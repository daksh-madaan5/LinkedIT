package com.linkedit.routing.dto.response;

/** Total distance is metres and total duration is seconds. */
public record OptimizationSummary(
    double totalDistance,
    double totalDuration,
    int vehiclesUsed,
    int totalJobs,
    int assignedJobs,
    int unassignedJobs,
    double objectiveCost
) {
}
