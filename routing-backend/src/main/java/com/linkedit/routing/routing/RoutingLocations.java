package com.linkedit.routing.routing;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.exception.RoutingProviderException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Deterministic, coordinate-deduplicated locations and their application-ID aliases. */
public record RoutingLocations(List<RoutingLocation> uniqueLocations, Map<String, Integer> indexById) {

    public RoutingLocations {
        uniqueLocations = List.copyOf(uniqueLocations);
        indexById = Map.copyOf(indexById);
    }

    public static RoutingLocations from(OptimizationRequest request) {
        Collector collector = new Collector();
        collector.add(request.depot());
        for (VehicleRequest vehicle : request.vehicles()) {
            collector.add(vehicle.startLocation() == null ? request.depot() : vehicle.startLocation());
            collector.add(vehicle.endLocation() == null ? request.depot() : vehicle.endLocation());
        }
        for (DeliveryRequest job : request.jobs()) {
            collector.add(new LocationRequest(job.id(), job.latitude(), job.longitude()));
        }
        return collector.result();
    }

    private static final class Collector {
        private final List<RoutingLocation> locations = new ArrayList<>();
        private final Map<CoordinateKey, Integer> indexesByCoordinate = new LinkedHashMap<>();
        private final Map<String, Integer> indexesById = new LinkedHashMap<>();

        private void add(LocationRequest location) {
            CoordinateKey coordinate = new CoordinateKey(location.latitude(), location.longitude());
            int index = indexesByCoordinate.computeIfAbsent(coordinate, ignored -> {
                int next = locations.size();
                locations.add(new RoutingLocation(location.id(), location.latitude(), location.longitude()));
                return next;
            });
            Integer previous = indexesById.putIfAbsent(location.id(), index);
            if (previous != null && previous != index) {
                throw new RoutingProviderException(
                    "Location ID '" + location.id() + "' refers to more than one coordinate"
                );
            }
        }

        private RoutingLocations result() {
            return new RoutingLocations(locations, indexesById);
        }
    }

    private record CoordinateKey(double latitude, double longitude) {
    }
}
