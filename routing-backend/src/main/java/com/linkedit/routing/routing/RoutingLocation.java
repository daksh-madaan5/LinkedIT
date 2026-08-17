package com.linkedit.routing.routing;

/** A unique WGS84 coordinate sent to the routing matrix service. */
public record RoutingLocation(String id, double latitude, double longitude) {
}
