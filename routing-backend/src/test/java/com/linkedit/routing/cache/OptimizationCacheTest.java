package com.linkedit.routing.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.graphhopper.jsprit.core.problem.VehicleRoutingProblem;
import com.graphhopper.jsprit.core.problem.solution.VehicleRoutingProblemSolution;
import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.CrowFlyRouteGeometryProvider;
import com.linkedit.routing.routing.CrowFlyRoutingCostProvider;
import com.linkedit.routing.service.OptimizationService;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class OptimizationCacheTest {

    @Test
    void test1_sameOptimizationRequestTwice_returnsCachedResponseWithoutReinvokingJsprit() {
        AtomicInteger solverCalls = new AtomicInteger(0);
        JspritOptimizer countingOptimizer = new JspritOptimizer() {
            @Override
            public VehicleRoutingProblemSolution optimize(VehicleRoutingProblem problem) {
                solverCalls.incrementAndGet();
                return super.optimize(problem);
            }
        };

        RoutingCacheProperties props = new RoutingCacheProperties();
        props.getCache().setEnabled(true);

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            countingOptimizer,
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            props,
            Executors.newFixedThreadPool(2),
            "crowfly"
        );

        OptimizationRequest request = createSampleRequest(50, 20.30, 85.81);

        // First call -> Cache MISS -> runs solver
        OptimizationResponse firstResponse = service.optimize(request);
        assertEquals(1, solverCalls.get());
        assertFalse(firstResponse.routes().isEmpty());

        // Second call -> Cache HIT -> returns cached response, solver NOT invoked again
        OptimizationResponse secondResponse = service.optimize(request);
        assertEquals(1, solverCalls.get(), "Solver should not be re-invoked on cache HIT");
        assertSame(firstResponse, secondResponse, "Should return identical cached response instance");
    }

    @Test
    void test2_twoRequestsDifferingOnlyInVehicleCapacity_producesOptimizationCacheMiss() {
        AtomicInteger solverCalls = new AtomicInteger(0);
        JspritOptimizer countingOptimizer = new JspritOptimizer() {
            @Override
            public VehicleRoutingProblemSolution optimize(VehicleRoutingProblem problem) {
                solverCalls.incrementAndGet();
                return super.optimize(problem);
            }
        };

        RoutingCacheProperties props = new RoutingCacheProperties();
        props.getCache().setEnabled(true);

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            countingOptimizer,
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            props,
            Executors.newFixedThreadPool(2),
            "crowfly"
        );

        OptimizationRequest request1 = createSampleRequest(50, 20.30, 85.81);
        OptimizationRequest request2 = createSampleRequest(100, 20.30, 85.81); // Different capacity

        service.optimize(request1);
        assertEquals(1, solverCalls.get());

        // Second request with different capacity should MISS optimization cache
        service.optimize(request2);
        assertEquals(2, solverCalls.get(), "Second request with different capacity must trigger a cache MISS and re-optimize");
    }

    @Test
    void test3_twoRequestsWithDifferentCoordinates_producesOptimizationCacheMiss() {
        AtomicInteger solverCalls = new AtomicInteger(0);
        JspritOptimizer countingOptimizer = new JspritOptimizer() {
            @Override
            public VehicleRoutingProblemSolution optimize(VehicleRoutingProblem problem) {
                solverCalls.incrementAndGet();
                return super.optimize(problem);
            }
        };

        RoutingCacheProperties props = new RoutingCacheProperties();
        props.getCache().setEnabled(true);

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            countingOptimizer,
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            props,
            Executors.newFixedThreadPool(2),
            "crowfly"
        );

        OptimizationRequest request1 = createSampleRequest(50, 20.30, 85.81);
        OptimizationRequest request2 = createSampleRequest(50, 20.45, 85.95); // Different coordinates

        service.optimize(request1);
        assertEquals(1, solverCalls.get());

        service.optimize(request2);
        assertEquals(2, solverCalls.get(), "Request with different coordinates must MISS optimization cache");
    }

    @Test
    void test9_ttlExpiry_expiredEntryBehavesAsCacheMiss() throws InterruptedException {
        AtomicInteger solverCalls = new AtomicInteger(0);
        JspritOptimizer countingOptimizer = new JspritOptimizer() {
            @Override
            public VehicleRoutingProblemSolution optimize(VehicleRoutingProblem problem) {
                solverCalls.incrementAndGet();
                return super.optimize(problem);
            }
        };

        RoutingCacheProperties props = new RoutingCacheProperties();
        props.getCache().setEnabled(true);
        props.getCache().setTtl(Duration.ofMillis(50)); // Very short TTL for test

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            countingOptimizer,
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            props,
            Executors.newFixedThreadPool(2),
            "crowfly"
        );

        OptimizationRequest request = createSampleRequest(50, 20.30, 85.81);

        service.optimize(request);
        assertEquals(1, solverCalls.get());

        // Wait for TTL to expire
        Thread.sleep(70);

        // Third call after expiration should MISS and re-run solver
        service.optimize(request);
        assertEquals(2, solverCalls.get(), "Expired entry must trigger a cache MISS and re-optimize");
    }

    @Test
    void test10_cacheDisabled_noCacheHitsAndExistingBehaviorRemainsUnchanged() {
        AtomicInteger solverCalls = new AtomicInteger(0);
        JspritOptimizer countingOptimizer = new JspritOptimizer() {
            @Override
            public VehicleRoutingProblemSolution optimize(VehicleRoutingProblem problem) {
                solverCalls.incrementAndGet();
                return super.optimize(problem);
            }
        };

        RoutingCacheProperties props = new RoutingCacheProperties();
        props.getCache().setEnabled(false); // DISABLED

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            countingOptimizer,
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider(),
            props,
            Executors.newFixedThreadPool(2),
            "crowfly"
        );

        OptimizationRequest request = createSampleRequest(50, 20.30, 85.81);

        service.optimize(request);
        assertEquals(1, solverCalls.get());

        service.optimize(request);
        assertEquals(2, solverCalls.get(), "When cache is disabled, repeated request must execute solver every time");
    }

    private OptimizationRequest createSampleRequest(int vehicleCapacity, double jobLat, double jobLon) {
        LocationRequest depot = new LocationRequest("DEPOT-1", 20.2961, 85.8245);
        List<VehicleRequest> vehicles = List.of(
            new VehicleRequest("V1", vehicleCapacity, null, null)
        );
        List<DeliveryRequest> jobs = List.of(
            new DeliveryRequest("D1", jobLat, jobLon, 10, 120.0, 1, null)
        );
        return new OptimizationRequest(depot, vehicles, jobs);
    }
}
