package com.linkedit.routing.service;

import com.graphhopper.jsprit.core.problem.VehicleRoutingProblem;
import com.graphhopper.jsprit.core.problem.solution.VehicleRoutingProblemSolution;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.response.OptimizationResponse;
import com.linkedit.routing.dto.response.RouteResponse;
import com.linkedit.routing.exception.OptimizationException;
import com.linkedit.routing.optimization.JspritOptimizer;
import com.linkedit.routing.optimization.JspritProblemMapper;
import com.linkedit.routing.optimization.JspritSolutionMapper;
import com.linkedit.routing.routing.RouteGeometryProvider;
import com.linkedit.routing.routing.RoutingLocation;
import com.linkedit.routing.validation.OptimizationRequestValidator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class OptimizationService {

    private final OptimizationRequestValidator validator;
    private final JspritProblemMapper problemMapper;
    private final JspritOptimizer optimizer;
    private final JspritSolutionMapper solutionMapper;
    private final RouteGeometryProvider geometryProvider;

    public OptimizationService(
        OptimizationRequestValidator validator,
        JspritProblemMapper problemMapper,
        JspritOptimizer optimizer,
        JspritSolutionMapper solutionMapper,
        RouteGeometryProvider geometryProvider
    ) {
        this.validator = validator;
        this.problemMapper = problemMapper;
        this.optimizer = optimizer;
        this.solutionMapper = solutionMapper;
        this.geometryProvider = geometryProvider;
    }

    public OptimizationResponse optimize(OptimizationRequest request) {
        validator.validate(request);
        VehicleRoutingProblem problem = problemMapper.map(request);
        VehicleRoutingProblemSolution solution = optimizer.optimize(problem);
        OptimizationResponse response = solutionMapper.map(problem, solution);
        Map<String, List<RoutingLocation>> routeLocations = solutionMapper.routeLocations(solution);
        List<RouteResponse> routesWithGeometry = response.routes().stream()
            .map(route -> withGeometry(route, routeLocations.get(route.vehicleId())))
            .toList();
        return new OptimizationResponse(routesWithGeometry, response.unassignedJobs(), response.summary());
    }

    private RouteResponse withGeometry(RouteResponse route, List<RoutingLocation> orderedLocations) {
        if (orderedLocations == null) {
            throw new OptimizationException("Missing final route locations for vehicle " + route.vehicleId());
        }
        return new RouteResponse(
            route.vehicleId(),
            route.stops(),
            route.distance(),
            route.duration(),
            route.initialLoad(),
            route.deliveredLoad(),
            geometryProvider.getGeometry(orderedLocations)
        );
    }
}
