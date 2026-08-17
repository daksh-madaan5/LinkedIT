package com.linkedit.routing.routing;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

class RoutingLocationsTest {

    @Test
    void assignsDeterministicIndexesAndDeduplicatesCoordinates() {
        OptimizationRequest request = new OptimizationRequest(
            new LocationRequest("DEPOT-1", 20.2961, 85.8245),
            List.of(new VehicleRequest(
                "V1",
                10,
                new LocationRequest("V1-START", 20.3000, 85.8300),
                new LocationRequest("V1-END", 20.2961, 85.8245)
            )),
            List.of(
                new DeliveryRequest("D1", 20.3100, 85.8400, 1, 0, null, null),
                new DeliveryRequest("D2", 20.3100, 85.8400, 1, 0, null, null)
            )
        );

        RoutingLocations locations = RoutingLocations.from(request);

        assertEquals(3, locations.uniqueLocations().size());
        assertEquals(0, locations.indexById().get("DEPOT-1"));
        assertEquals(1, locations.indexById().get("V1-START"));
        assertEquals(0, locations.indexById().get("V1-END"));
        assertEquals(2, locations.indexById().get("D1"));
        assertEquals(2, locations.indexById().get("D2"));
    }
}
