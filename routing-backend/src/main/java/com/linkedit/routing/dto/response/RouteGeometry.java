package com.linkedit.routing.dto.response;

import java.util.List;

/** GeoJSON LineString coordinates in longitude/latitude order. */
public record RouteGeometry(String type, List<List<Double>> coordinates) {

    public RouteGeometry {
        coordinates = coordinates == null
            ? null
            : coordinates.stream().map(List::copyOf).toList();
    }
}
