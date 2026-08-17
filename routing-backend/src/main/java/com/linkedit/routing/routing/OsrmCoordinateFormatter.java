package com.linkedit.routing.routing;

import java.util.List;
import java.util.stream.Collectors;

final class OsrmCoordinateFormatter {

    private OsrmCoordinateFormatter() {
    }

    static String format(List<RoutingLocation> locations) {
        return locations.stream()
            .map(location -> Double.toString(location.longitude()) + "," + Double.toString(location.latitude()))
            .collect(Collectors.joining(";"));
    }
}
