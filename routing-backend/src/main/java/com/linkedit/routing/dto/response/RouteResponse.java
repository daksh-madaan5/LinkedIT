package com.linkedit.routing.dto.response;

import java.util.List;

/** Distance is metres; duration is elapsed seconds including travel, waiting and service. */
public record RouteResponse(
    String vehicleId,
    List<StopResponse> stops,
    double distance,
    double duration,
    int initialLoad,
    int deliveredLoad,
    RouteGeometry geometry
) {
}
