package com.linkedit.routing.optimization;

import com.graphhopper.jsprit.core.analysis.SolutionAnalyser;
import com.graphhopper.jsprit.core.problem.VehicleRoutingProblem;
import com.graphhopper.jsprit.core.problem.solution.VehicleRoutingProblemSolution;
import com.graphhopper.jsprit.core.problem.solution.route.VehicleRoute;
import com.graphhopper.jsprit.core.problem.solution.route.activity.TourActivity;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.dto.response.OptimizationSummary;
import com.linkedit.routing.dto.response.RouteResponse;
import com.linkedit.routing.dto.response.StopResponse;
import com.linkedit.routing.exception.OptimizationException;
import com.linkedit.routing.routing.RoutingLocation;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class JspritSolutionMapper {

    public OptimizationResponse map(VehicleRoutingProblem problem, VehicleRoutingProblemSolution solution) {
        SolutionAnalyser analyser = new SolutionAnalyser(problem, solution, problem.getTransportCosts());
        List<RouteResponse> routes = new ArrayList<>();
        Set<String> assignedJobIds = new HashSet<>();
        double totalDuration = 0;

        for (VehicleRoute route : solution.getRoutes()) {
            List<StopResponse> stops = new ArrayList<>();
            int sequence = 1;
            for (TourActivity activity : route.getActivities()) {
                if (!(activity instanceof TourActivity.JobActivity jobActivity)) continue;
                String jobId = jobActivity.getJob().getId();
                assignedJobIds.add(jobId);
                stops.add(new StopResponse(
                    jobId,
                    sequence++,
                    activity.getLocation().getCoordinate().getY(),
                    activity.getLocation().getCoordinate().getX(),
                    activity.getArrTime(),
                    activity.getEndTime(),
                    analyser.getLoadRightAfterActivity(activity, route).get(0)
                ));
            }

            double duration = route.getEnd().getArrTime() - route.getStart().getEndTime();
            totalDuration += duration;
            routes.add(new RouteResponse(
                route.getVehicle().getId(),
                List.copyOf(stops),
                analyser.getDistance(route),
                duration,
                analyser.getLoadAtBeginning(route).get(0),
                analyser.getLoadDelivered(route).get(0),
                null
            ));
        }

        routes.sort(Comparator.comparing(RouteResponse::vehicleId));
        List<String> unassignedJobs = solution.getUnassignedJobs().stream()
            .map(job -> job.getId())
            .sorted()
            .toList();
        int totalJobs = problem.getJobs().size();
        OptimizationSummary summary = new OptimizationSummary(
            analyser.getDistance(),
            totalDuration,
            routes.size(),
            totalJobs,
            assignedJobIds.size(),
            unassignedJobs.size(),
            solution.getCost()
        );
        return new OptimizationResponse(List.copyOf(routes), unassignedJobs, summary);
    }

    /** Extracts the exact final jsprit route order without performing any geometry I/O. */
    public Map<String, List<RoutingLocation>> routeLocations(VehicleRoutingProblemSolution solution) {
        Map<String, List<RoutingLocation>> locationsByVehicle = new LinkedHashMap<>();
        for (VehicleRoute route : solution.getRoutes()) {
            List<RoutingLocation> locations = new ArrayList<>();
            locations.add(toRoutingLocation(route.getStart().getLocation()));
            for (TourActivity activity : route.getActivities()) {
                locations.add(toRoutingLocation(activity.getLocation()));
            }
            locations.add(toRoutingLocation(route.getEnd().getLocation()));
            locationsByVehicle.put(route.getVehicle().getId(), List.copyOf(locations));
        }
        return Map.copyOf(locationsByVehicle);
    }

    private RoutingLocation toRoutingLocation(com.graphhopper.jsprit.core.problem.Location location) {
        if (location == null || location.getCoordinate() == null) {
            throw new OptimizationException("Final route contains a location without coordinates");
        }
        return new RoutingLocation(
            location.getId(),
            location.getCoordinate().getY(),
            location.getCoordinate().getX()
        );
    }
}
