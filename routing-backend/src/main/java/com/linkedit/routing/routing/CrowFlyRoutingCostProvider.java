package com.linkedit.routing.routing;

import com.graphhopper.jsprit.core.problem.cost.VehicleRoutingTransportCosts;
import com.graphhopper.jsprit.core.util.DistanceUnit;
import com.graphhopper.jsprit.core.util.GreatCircleCosts;
import com.linkedit.routing.dto.request.OptimizationRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Offline great-circle routing: metres at a constant 30 km/h assumed speed. */
@Component
@ConditionalOnProperty(name = "routing.provider", havingValue = "crowfly", matchIfMissing = true)
public class CrowFlyRoutingCostProvider implements RoutingCostProvider {

    static final double ASSUMED_SPEED_METRES_PER_SECOND = 30_000.0 / 3_600.0;

    @Override
    public VehicleRoutingTransportCosts createTransportCosts(OptimizationRequest request) {
        GreatCircleCosts costs = new GreatCircleCosts(DistanceUnit.Meter);
        costs.setSpeed(ASSUMED_SPEED_METRES_PER_SECOND);
        return costs;
    }
}
