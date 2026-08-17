package com.linkedit.routing.routing;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.graphhopper.jsprit.core.problem.Location;
import com.graphhopper.jsprit.core.problem.cost.VehicleRoutingTransportCosts;
import com.graphhopper.jsprit.core.problem.vehicle.VehicleImpl;
import com.graphhopper.jsprit.core.problem.vehicle.VehicleTypeImpl;
import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class OsrmRoutingCostProviderTest {

    @Test
    void returnsAsymmetricMatrixDistanceDurationAndVehicleAdjustedCost() {
        RoutingMatrix matrix = new RoutingMatrix(
            Map.of("A", 0, "B", 1),
            new double[][] {{0, 5_000}, {7_000, 0}},
            new double[][] {{0, 600}, {900, 0}}
        );
        OsrmRoutingCostProvider provider = new OsrmRoutingCostProvider(ignored -> matrix);
        VehicleRoutingTransportCosts costs = provider.createTransportCosts(minimalRequest());
        Location a = Location.newInstance("A");
        Location b = Location.newInstance("B");
        VehicleTypeImpl type = VehicleTypeImpl.Builder.newInstance("type").setCostPerDistance(0.001).build();
        VehicleImpl vehicle = VehicleImpl.Builder.newInstance("vehicle").setType(type).setStartLocation(a).build();

        assertEquals(5_000, costs.getDistance(a, b, 0, vehicle));
        assertEquals(600, costs.getTransportTime(a, b, 0, null, vehicle));
        assertEquals(5, costs.getTransportCost(a, b, 0, null, vehicle));
        assertEquals(7_000, costs.getDistance(b, a, 0, vehicle));
        assertEquals(900, costs.getBackwardTransportTime(b, a, 0, null, vehicle));
    }

    private OptimizationRequest minimalRequest() {
        return new OptimizationRequest(
            new LocationRequest("A", 0.0, 0.0),
            List.of(new VehicleRequest("V", 1, null, null)),
            List.of(new DeliveryRequest("B", 1.0, 1.0, 1, 0, null, null))
        );
    }
}
