package com.linkedit.routing.dto.response;

/** All time values are seconds from the beginning of the route day. */
public record StopResponse(
    String jobId,
    int sequence,
    double latitude,
    double longitude,
    double arrivalTime,
    double departureTime,
    int remainingLoad
) {
}
