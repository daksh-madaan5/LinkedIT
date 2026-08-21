package com.linkedit.routing.service;

import com.graphhopper.jsprit.core.problem.VehicleRoutingProblem;
import com.graphhopper.jsprit.core.problem.solution.VehicleRoutingProblemSolution;
import com.linkedit.routing.cache.CacheKeyGenerator;
import com.linkedit.routing.cache.InMemoryCache;
import com.linkedit.routing.cache.RoutingCacheProperties;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.dto.response.RouteResponse;
import com.linkedit.routing.exception.OptimizationException;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.RouteGeometryProvider;
import com.linkedit.routing.routing.RoutingLocation;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OptimizationService {

    private static final Logger log = LoggerFactory.getLogger(OptimizationService.class);

    private final OptimizationRequestValidator validator;
    private final JspritProblemMapper problemMapper;
    private final JspritOptimizer optimizer;
    private final JspritSolutionMapper solutionMapper;
    private final RouteGeometryProvider geometryProvider;
    private final RoutingCacheProperties cacheProperties;
    private final ExecutorService geometryExecutor;
    private final String routingProvider;

    private final InMemoryCache<String, OptimizationResponse> optimizationCache = new InMemoryCache<>();

    @Autowired
    public OptimizationService(
        OptimizationRequestValidator validator,
        JspritProblemMapper problemMapper,
        JspritOptimizer optimizer,
        JspritSolutionMapper solutionMapper,
        RouteGeometryProvider geometryProvider,
        RoutingCacheProperties cacheProperties,
        ExecutorService geometryExecutor,
        @Value("${routing.provider:crowfly}") String routingProvider
    ) {
        this.validator = validator;
        this.problemMapper = problemMapper;
        this.optimizer = optimizer;
        this.solutionMapper = solutionMapper;
        this.geometryProvider = geometryProvider;
        this.cacheProperties = cacheProperties != null ? cacheProperties : new RoutingCacheProperties();
        this.geometryExecutor = geometryExecutor != null ? geometryExecutor : Executors.newFixedThreadPool(5);
        this.routingProvider = routingProvider != null ? routingProvider : "crowfly";
    }

    public OptimizationService(
        OptimizationRequestValidator validator,
        JspritProblemMapper problemMapper,
        JspritOptimizer optimizer,
        JspritSolutionMapper solutionMapper,
        RouteGeometryProvider geometryProvider
    ) {
        this(validator, problemMapper, optimizer, solutionMapper, geometryProvider,
             new RoutingCacheProperties(), Executors.newFixedThreadPool(5), "crowfly");
    }

    public InMemoryCache<String, OptimizationResponse> getOptimizationCache() {
        return optimizationCache;
    }

    public OptimizationResponse optimize(OptimizationRequest request) {
        long totalStartNanos = System.nanoTime();
        validator.validate(request);

        boolean cachingEnabled = cacheProperties.getCache().isEnabled();
        String cacheKey = cachingEnabled ? CacheKeyGenerator.forOptimization(request, routingProvider) : null;

        if (cachingEnabled) {
            Optional<OptimizationResponse> cached = optimizationCache.get(cacheKey);
            if (cached.isPresent()) {
                log.info("Optimization cache HIT");
                double elapsedSeconds = (System.nanoTime() - totalStartNanos) / 1_000_000_000.0;
                log.info(String.format(Locale.US, "Optimization completed in %.3fs", elapsedSeconds));
                return cached.get();
            }
            log.info("Optimization cache MISS");
        }

        VehicleRoutingProblem problem = problemMapper.map(request);
        VehicleRoutingProblemSolution solution = optimizer.optimize(problem);
        OptimizationResponse response = solutionMapper.map(problem, solution);
        Map<String, List<RoutingLocation>> routeLocations = solutionMapper.routeLocations(solution);

        long geomStartNanos = System.nanoTime();
        List<RouteResponse> routesWithGeometry = enrichGeometriesConcurrently(response.routes(), routeLocations);
        double geomElapsedSeconds = (System.nanoTime() - geomStartNanos) / 1_000_000_000.0;
        log.info(String.format(Locale.US, "Geometry enrichment completed in %.3fs", geomElapsedSeconds));

        OptimizationResponse finalResponse = new OptimizationResponse(routesWithGeometry, response.unassignedJobs(), response.summary());

        if (cachingEnabled) {
            optimizationCache.put(cacheKey, finalResponse, cacheProperties.getCache().getTtl(), cacheProperties.getCache().getMaxEntries());
        }

        double totalElapsedSeconds = (System.nanoTime() - totalStartNanos) / 1_000_000_000.0;
        log.info(String.format(Locale.US, "Optimization completed in %.3fs", totalElapsedSeconds));

        return finalResponse;
    }

    private List<RouteResponse> enrichGeometriesConcurrently(
        List<RouteResponse> routes,
        Map<String, List<RoutingLocation>> routeLocations
    ) {
        if (routes == null || routes.isEmpty()) {
            return List.of();
        }

        List<CompletableFuture<RouteResponse>> futures = routes.stream()
            .map(route -> CompletableFuture.supplyAsync(
                () -> withGeometry(route, routeLocations.get(route.vehicleId())),
                geometryExecutor
            ))
            .toList();

        try {
            return futures.stream()
                .map(CompletableFuture::join)
                .toList();
        } catch (CompletionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            if (cause instanceof Error error) {
                throw error;
            }
            throw new OptimizationException("Geometry enrichment failed", cause);
        }
    }

    private RouteResponse withGeometry(RouteResponse route, List<RoutingLocation> orderedLocations) {
        if (orderedLocations == null) {
            throw new OptimizationException("Missing final route locations for vehicle " + route.vehicleId());
        }
        return new RouteResponse(
            route.vehicleId(),
            route.stops(),
            route.distance(),
            route.duration(),
            route.initialLoad(),
            route.deliveredLoad(),
            geometryProvider.getGeometry(orderedLocations)
        );
    }
}
