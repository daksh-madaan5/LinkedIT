package com.linkedit.routing.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.dto.response.RouteResponse;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.CrowFlyRoutingCostProvider;
import com.linkedit.routing.routing.CrowFlyRouteGeometryProvider;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class OptimizationServiceTest {

    @Test
    void optimizesApplicationRequestEndToEnd() {
        OptimizationService service = new OptimizationService(
            new OptimizationRequestValidator(),
            new JspritProblemMapper(new CrowFlyRoutingCostProvider()),
            new JspritOptimizer(),
            new JspritSolutionMapper(),
            new CrowFlyRouteGeometryProvider()
        );
        OptimizationRequest request = bhubaneswarRequest();

        OptimizationResponse response = service.optimize(request);

        assertFalse(response.routes().isEmpty());
        assertTrue(response.summary().assignedJobs() > 0);
        assertTrue(response.summary().totalDistance() > 0);
        assertTrue(Double.isFinite(response.summary().objectiveCost()));
        assertTrue(response.routes().stream().allMatch(route -> route.geometry() != null));

        Set<String> assignedIds = new HashSet<>();
        response.routes().stream()
            .flatMap(route -> route.stops().stream())
            .forEach(stop -> assertTrue(assignedIds.add(stop.jobId()), "job assigned more than once: " + stop.jobId()));

        Map<String, Integer> capacities = request.vehicles().stream()
            .collect(Collectors.toMap(vehicle -> vehicle.id(), vehicle -> vehicle.capacity()));
        for (RouteResponse route : response.routes()) {
            assertTrue(route.initialLoad() <= capacities.get(route.vehicleId()));
            assertEquals(route.initialLoad(), route.deliveredLoad());
        }
        assertEquals(response.summary().assignedJobs(), assignedIds.size());
        assertEquals(request.jobs().size(), response.summary().assignedJobs() + response.summary().unassignedJobs());
        assertEquals(request.jobs().size(), response.summary().totalJobs());
    }

    private OptimizationRequest bhubaneswarRequest() {
        LocationRequest depot = new LocationRequest("DEPOT-1", 20.2961, 85.8245);
        List<VehicleRequest> vehicles = List.of(
            new VehicleRequest("V1", 50, null, null),
            new VehicleRequest("V2", 50, null, null),
            new VehicleRequest("V3", 50, null, null)
        );
        List<DeliveryRequest> jobs = List.of(
            job("D1", 20.3050, 85.8170, 18, 240, 2),
            job("D2", 20.3160, 85.8260, 16, 300, 2),
            job("D3", 20.2870, 85.8430, 20, 180, 1),
            job("D4", 20.2700, 85.8330, 14, 300, 3),
            job("D5", 20.3030, 85.8540, 12, 240, 2),
            job("D6", 20.3290, 85.8070, 17, 360, 2),
            job("D7", 20.2770, 85.8070, 15, 180, 1),
            job("D8", 20.3220, 85.8480, 10, 240, 3),
            job("D9", 20.2910, 85.7900, 13, 300, 2)
        );
        return new OptimizationRequest(depot, vehicles, jobs);
    }

    private DeliveryRequest job(
        String id, double latitude, double longitude, int demand, double serviceDuration, int priority
    ) {
        return new DeliveryRequest(id, latitude, longitude, demand, serviceDuration, priority, null);
    }
}
