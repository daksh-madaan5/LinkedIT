package com.linkedit.routing.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.dto.response.RouteGeometry;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.CrowFlyRoutingCostProvider;
import com.linkedit.routing.routing.RouteGeometryProvider;
import com.linkedit.routing.routing.RoutingLocation;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class RouteGeometryIntegrationTest {

    @Test
    void requestsGeometryOncePerUsedRouteAfterOptimization() {
        RecordingGeometryProvider geometryProvider = new RecordingGeometryProvider();
        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            geometryProvider
        );
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

        var response = service.optimize(request);

        assertEquals(3, response.routes().size());
        assertEquals(3, geometryProvider.calls.size());
        geometryProvider.calls.forEach(route -> assertEquals(3, route.size()));
    }

    @Test
    void geometryUsesVehicleSpecificStartAndEndLocations() {
        RecordingGeometryProvider geometryProvider = new RecordingGeometryProvider();
        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            geometryProvider
        );
        LocationRequest start = new LocationRequest("START", 20.20, 85.70);
        LocationRequest end = new LocationRequest("END", 20.40, 85.90);
        OptimizationRequest request = new OptimizationRequest(
            new LocationRequest("DEPOT", 20.2961, 85.8245),
            List.of(new VehicleRequest("V1", 1, start, end)),
            List.of(new DeliveryRequest("D1", 20.30, 85.82, 1, 0, null, null))
        );

        service.optimize(request);

        List<RoutingLocation> route = geometryProvider.calls.getFirst();
        assertEquals(List.of("START", "D1", "END"), route.stream().map(RoutingLocation::id).toList());
    }

    private static final class RecordingGeometryProvider implements RouteGeometryProvider {
        private final List<List<RoutingLocation>> calls = new ArrayList<>();

        @Override
        public RouteGeometry getGeometry(List<RoutingLocation> orderedLocations) {
            calls.add(List.copyOf(orderedLocations));
            return new RouteGeometry(
                "LineString",
                orderedLocations.stream()
                    .map(location -> List.of(location.longitude(), location.latitude()))
                    .toList()
            );
        }
    }
}
