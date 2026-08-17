package com.linkedit.routing.routing;

import com.linkedit.routing.dto.response.RouteGeometry;
import java.util.List;

/** Resolves display geometry only after optimization has selected a final route order. */
public interface RouteGeometryProvider {

    RouteGeometry getGeometry(List<RoutingLocation> orderedLocations);
}
