package com.linkedit.routing.dto.request;

/** Coordinates are WGS84 latitude/longitude degrees. */
public record LocationRequest(String id, Double latitude, Double longitude) {
}
