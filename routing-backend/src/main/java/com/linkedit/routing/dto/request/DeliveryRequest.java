package com.linkedit.routing.dto.request;

/** Service duration and time-window values are seconds. Priority is 1 (highest) through 10. */
public record DeliveryRequest(
    String id,
    Double latitude,
    Double longitude,
    int demand,
    double serviceDuration,
    Integer priority,
    TimeWindowRequest timeWindow
) {
}
