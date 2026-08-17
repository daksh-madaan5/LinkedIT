package com.linkedit.routing.routing;

import com.graphhopper.jsprit.core.problem.cost.VehicleRoutingTransportCosts;
import com.linkedit.routing.dto.request.OptimizationRequest;

public interface RoutingCostProvider {

    VehicleRoutingTransportCosts createTransportCosts(OptimizationRequest request);
}
