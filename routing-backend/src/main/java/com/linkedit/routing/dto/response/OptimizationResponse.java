package com.linkedit.routing.dto.response;

import java.util.List;

public record OptimizationResponse(
    List<RouteResponse> routes,
    List<String> unassignedJobs,
    OptimizationSummary summary
) {
}
