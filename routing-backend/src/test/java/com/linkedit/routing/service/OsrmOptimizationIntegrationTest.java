package com.linkedit.routing.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.OsrmClient;
import com.linkedit.routing.routing.OsrmRoutingCostProvider;
import com.linkedit.routing.routing.CrowFlyRouteGeometryProvider;
import com.linkedit.routing.routing.RoutingLocations;
import com.linkedit.routing.routing.RoutingMatrix;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class OsrmOptimizationIntegrationTest {

    @Test
    void optimizerUsesOnePreloadedRoadMatrixAndChoosesItsCheapestOrder() {
        AtomicInteger tableCalls = new AtomicInteger();
        OsrmClient fakeClient = locations -> matrixFor(locations, tableCalls);
        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new OsrmRoutingCostProvider(fakeClient)),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider()
        );
        OptimizationRequest request = new OptimizationRequest(
            new LocationRequest("DEPOT", 20.2961, 85.8245),
            List.of(new VehicleRequest("V1", 2, null, null)),
            List.of(
                new DeliveryRequest("A", 20.40, 85.90, 1, 0, null, null),
                new DeliveryRequest("B", 20.20, 85.70, 1, 0, null, null)
            )
        );

        OptimizationResponse response = service.optimize(request);

        assertEquals(1, tableCalls.get());
        assertEquals(List.of("A", "B"), response.routes().getFirst().stops().stream()
            .map(stop -> stop.jobId())
            .toList());
        assertEquals(3, response.routes().getFirst().distance());
    }

    private RoutingMatrix matrixFor(RoutingLocations locations, AtomicInteger tableCalls) {
        tableCalls.incrementAndGet();
        assertEquals(0, locations.indexById().get("DEPOT"));
        assertEquals(1, locations.indexById().get("A"));
        assertEquals(2, locations.indexById().get("B"));
        return new RoutingMatrix(
            locations.indexById(),
            new double[][] {
                {0, 1, 100},
                {100, 0, 1},
                {1, 100, 0}
            },
            new double[][] {
                {0, 1, 100},
                {100, 0, 1},
                {1, 100, 0}
            }
        );
    }
}
