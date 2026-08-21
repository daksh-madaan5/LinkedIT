package com.linkedit.routing.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.exception.RoutingProviderException;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.CrowFlyRouteGeometryProvider;
import com.linkedit.routing.routing.HttpOsrmClient;
import com.linkedit.routing.routing.OsrmClient;
import com.linkedit.routing.routing.OsrmProperties;
import com.linkedit.routing.routing.OsrmRoutingCostProvider;
import com.linkedit.routing.routing.RoutingLocations;
import com.linkedit.routing.routing.RoutingMatrix;
import com.linkedit.routing.service.OptimizationService;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class OsrmMatrixCacheTest {

    @Test
    void test4_sameRoutingLocationsDifferentOptimizationConfig_producesOptimizationMissAndMatrixHit() {
        AtomicInteger tableCalls = new AtomicInteger(0);

        OsrmProperties props = new OsrmProperties();
        props.setBaseUrl("http://mock-osrm:5000");
        RoutingCacheProperties cacheProps = new RoutingCacheProperties();
        cacheProps.getCache().setEnabled(true);

        OsrmClient cachingClient = new OsrmClient() {
            private final InMemoryCache<String, RoutingMatrix> matrixCache = new InMemoryCache<>();

            @Override
            public RoutingMatrix table(RoutingLocations locations) {
                String key = CacheKeyGenerator.forMatrix(locations.uniqueLocations(), props.getBaseUrl());
                return matrixCache.get(key).orElseGet(() -> {
                    tableCalls.incrementAndGet();
                    RoutingMatrix matrix = fakeMatrix(locations);
                    matrixCache.put(key, matrix, cacheProps.getCache().getTtl(), cacheProps.getCache().getMaxEntries());
                    return matrix;
                });
            }

            @Override
            public com.linkedit.routing.dto.response.RouteGeometry route(List<com.linkedit.routing.routing.RoutingLocation> orderedLocations) {
                return new com.linkedit.routing.dto.response.RouteGeometry("LineString", List.of(List.of(85.8245, 20.2961), List.of(85.81, 20.30)));
            }
        };

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new OsrmRoutingCostProvider(cachingClient)),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            cacheProps,
            Executors.newFixedThreadPool(2),
            "osrm"
        );

        // Request 1: capacity 50, priority 1
        OptimizationRequest req1 = new OptimizationRequest(
            new LocationRequest("DEPOT", 20.2961, 85.8245),
            List.of(new VehicleRequest("V1", 50, null, null)),
            List.of(new DeliveryRequest("D1", 20.30, 85.81, 10, 100.0, 1, null))
        );

        // Request 2: capacity 100 (diff), priority 3 (diff) but SAME coordinates & depot
        OptimizationRequest req2 = new OptimizationRequest(
            new LocationRequest("DEPOT", 20.2961, 85.8245),
            List.of(new VehicleRequest("V1", 100, null, null)),
            List.of(new DeliveryRequest("D1", 20.30, 85.81, 10, 100.0, 3, null))
        );

        OptimizationResponse res1 = service.optimize(req1);
        assertEquals(1, tableCalls.get(), "First request should call OSRM table once");

        OptimizationResponse res2 = service.optimize(req2);
        // Optimization response is different / freshly computed, but table was retrieved from matrix cache!
        assertEquals(1, tableCalls.get(), "Second request with same locations must HIT matrix cache (0 additional OSRM table calls)");
    }

    @Test
    void test8_osrmFailure_errorBehaviorRemainsUnchangedAndFailedResultIsNotCached() {
        AtomicInteger attemptCount = new AtomicInteger(0);

        OsrmProperties props = new OsrmProperties();
        props.setBaseUrl("http://failing-osrm:5000");
        RoutingCacheProperties cacheProps = new RoutingCacheProperties();
        cacheProps.getCache().setEnabled(true);

        OsrmClient failingClient = new OsrmClient() {
            @Override
            public RoutingMatrix table(RoutingLocations locations) {
                attemptCount.incrementAndGet();
                throw new RoutingProviderException("OSRM table request failed with HTTP 500");
            }

            @Override
            public com.linkedit.routing.dto.response.RouteGeometry route(List<com.linkedit.routing.routing.RoutingLocation> orderedLocations) {
                throw new RoutingProviderException("OSRM route request failed");
            }
        };

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new OsrmRoutingCostProvider(failingClient)),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            cacheProps,
            Executors.newFixedThreadPool(2),
            "osrm"
        );

        OptimizationRequest req = new OptimizationRequest(
            new LocationRequest("DEPOT", 20.2961, 85.8245),
            List.of(new VehicleRequest("V1", 50, null, null)),
            List.of(new DeliveryRequest("D1", 20.30, 85.81, 10, 100.0, 1, null))
        );

        // First attempt fails
        assertThrows(RoutingProviderException.class, () -> service.optimize(req));
        assertEquals(1, attemptCount.get());
        assertEquals(0, service.getOptimizationCache().size(), "Failed optimization must NOT be cached");

        // Second attempt must try again and fail again (not serve any invalid/failed cache entry)
        assertThrows(RoutingProviderException.class, () -> service.optimize(req));
        assertEquals(2, attemptCount.get(), "Second attempt must call OSRM again and not use cached failure");
    }

    private RoutingMatrix fakeMatrix(RoutingLocations locations) {
        int n = locations.uniqueLocations().size();
        double[][] distances = new double[n][n];
        double[][] durations = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                distances[i][j] = (i == j) ? 0.0 : 1000.0;
                durations[i][j] = (i == j) ? 0.0 : 120.0;
            }
        }
        return new RoutingMatrix(locations.indexById(), distances, durations);
    }
}
