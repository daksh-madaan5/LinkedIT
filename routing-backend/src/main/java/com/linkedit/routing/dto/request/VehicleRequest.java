package com.linkedit.routing.dto.request;

/** Capacity is an application-defined, non-divisible integer unit. */
public record VehicleRequest(
    String id,
    int capacity,
    LocationRequest startLocation,
    LocationRequest endLocation
) {
}
