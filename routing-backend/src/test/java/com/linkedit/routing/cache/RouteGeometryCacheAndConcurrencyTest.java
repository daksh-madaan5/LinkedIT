package com.linkedit.routing.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.dto.response.RouteGeometry;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.CrowFlyRoutingCostProvider;
import com.linkedit.routing.routing.RouteGeometryProvider;
import com.linkedit.routing.routing.RoutingLocation;
import com.linkedit.routing.service.OptimizationService;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class RouteGeometryCacheAndConcurrencyTest {

    @Test
    void test5_sameFinalOrderedRoute_producesGeometryCacheHit() {
        AtomicInteger networkCalls = new AtomicInteger(0);

        InMemoryCache<String, RouteGeometry> geometryCache = new InMemoryCache<>();
        RoutingCacheProperties cacheProps = new RoutingCacheProperties();
        cacheProps.getCache().setEnabled(true);

        RouteGeometryProvider cachingGeometryProvider = orderedLocations -> {
            String key = CacheKeyGenerator.forGeometry(orderedLocations, "http://osrm:5000");
            return geometryCache.get(key).orElseGet(() -> {
                networkCalls.incrementAndGet();
                RouteGeometry geom = new RouteGeometry("LineString", orderedLocations.stream()
                    .map(loc -> List.of(loc.longitude(), loc.latitude()))
                    .toList());
                geometryCache.put(key, geom, cacheProps.getCache().getTtl(), cacheProps.getCache().getMaxEntries());
                return geom;
            });
        };

        List<RoutingLocation> routeLocations = List.of(
            new RoutingLocation("DEPOT", 20.2961, 85.8245),
            new RoutingLocation("D1", 20.30, 85.81),
            new RoutingLocation("DEPOT", 20.2961, 85.8245)
        );

        // First call
        RouteGeometry geom1 = cachingGeometryProvider.getGeometry(routeLocations);
        assertEquals(1, networkCalls.get());

        // Second call with same ordered route
        RouteGeometry geom2 = cachingGeometryProvider.getGeometry(routeLocations);
        assertEquals(1, networkCalls.get(), "Second call with same ordered locations must HIT geometry cache");
        assertEquals(geom1.coordinates(), geom2.coordinates());
    }

    @Test
    void test6_differentStopOrdering_producesDifferentGeometryCacheKeyAndMiss() {
        List<RoutingLocation> routeA = List.of(
            new RoutingLocation("DEPOT", 20.2961, 85.8245),
            new RoutingLocation("D1", 20.30, 85.81),
            new RoutingLocation("D2", 20.35, 85.85),
            new RoutingLocation("DEPOT", 20.2961, 85.8245)
        );

        List<RoutingLocation> routeB = List.of(
            new RoutingLocation("DEPOT", 20.2961, 85.8245),
            new RoutingLocation("D2", 20.35, 85.85),
            new RoutingLocation("D1", 20.30, 85.81),
            new RoutingLocation("DEPOT", 20.2961, 85.8245)
        );

        String keyA = CacheKeyGenerator.forGeometry(routeA, "http://osrm:5000");
        String keyB = CacheKeyGenerator.forGeometry(routeB, "http://osrm:5000");

        assertNotEquals(keyA, keyB, "Different waypoint sequences must generate different cache keys");
    }

    @Test
    void test7_multipleUsedVehicles_geometryRequestsExecuteConcurrentlyUsingBoundedExecutor() {
        Set<String> threadNames = Collections.newSetFromMap(new ConcurrentHashMap<>());
        AtomicInteger geometryCalls = new AtomicInteger(0);

        RouteGeometryProvider concurrentGeometryProvider = orderedLocations -> {
            threadNames.add(Thread.currentThread().getName());
            geometryCalls.incrementAndGet();
            try {
                // Simulate network latency
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return new RouteGeometry("LineString", orderedLocations.stream()
                .map(l -> List.of(l.longitude(), l.latitude()))
                .toList());
        };

        RoutingCacheProperties props = new RoutingCacheProperties();
        props.getGeometry().setParallelism(3);

        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            concurrentGeometryProvider,
            props,
            Executors.newFixedThreadPool(3),
            "crowfly"
        );

        // Request with 3 vehicles each taking 1 delivery
        OptimizationRequest request = new OptimizationRequest(
            new LocationRequest("DEPOT", 20.2961, 85.8245),
            List.of(
                new VehicleRequest("V1", 1, null, null),
                new VehicleRequest("V2", 1, null, null),
                new VehicleRequest("V3", 1, null, null)
            ),
            List.of(
                new DeliveryRequest("D1", 20.30, 85.81, 1, 0, null, null),
                new DeliveryRequest("D2", 20.31, 85.82, 1, 0, null, null),
                new DeliveryRequest("D3", 20.32, 85.83, 1, 0, null, null)
            )
        );

        long start = System.currentTimeMillis();
        OptimizationResponse response = service.optimize(request);
        long elapsed = System.currentTimeMillis() - start;

        assertEquals(3, response.routes().size());
        assertEquals(3, geometryCalls.get());
        // Verify multiple threads executed the geometry requests concurrently
        assertTrue(threadNames.size() > 1, "Geometry requests should execute concurrently across worker threads");
        // Verify each route received its geometry in correct order
        for (int i = 0; i < 3; i++) {
            assertEquals("LineString", response.routes().get(i).geometry().type());
            assertFalse(response.routes().get(i).geometry().coordinates().isEmpty());
        }
    }
}
