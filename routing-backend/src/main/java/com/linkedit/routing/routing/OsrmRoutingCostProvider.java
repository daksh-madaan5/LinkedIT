package com.linkedit.routing.routing;

import com.graphhopper.jsprit.core.problem.Location;
import com.graphhopper.jsprit.core.problem.cost.AbstractForwardVehicleRoutingTransportCosts;
import com.graphhopper.jsprit.core.problem.cost.VehicleRoutingTransportCosts;
import com.graphhopper.jsprit.core.problem.driver.Driver;
import com.graphhopper.jsprit.core.problem.vehicle.Vehicle;
import com.linkedit.routing.dto.request.OptimizationRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "routing.provider", havingValue = "osrm")
public class OsrmRoutingCostProvider implements RoutingCostProvider {

    private final OsrmClient osrmClient;

    public OsrmRoutingCostProvider(OsrmClient osrmClient) {
        this.osrmClient = osrmClient;
    }

    @Override
    public VehicleRoutingTransportCosts createTransportCosts(OptimizationRequest request) {
        RoutingMatrix matrix = osrmClient.table(RoutingLocations.from(request));
        return new MatrixTransportCosts(matrix);
    }

    private static final class MatrixTransportCosts extends AbstractForwardVehicleRoutingTransportCosts {
        private final RoutingMatrix matrix;

        private MatrixTransportCosts(RoutingMatrix matrix) {
            this.matrix = matrix;
        }

        @Override
        public double getDistance(Location from, Location to, double departureTime, Vehicle vehicle) {
            return matrix.distanceMetres(from.getId(), to.getId());
        }

        @Override
        public double getTransportTime(
            Location from, Location to, double departureTime, Driver driver, Vehicle vehicle
        ) {
            return matrix.durationSeconds(from.getId(), to.getId());
        }

        @Override
        public double getTransportCost(
            Location from, Location to, double departureTime, Driver driver, Vehicle vehicle
        ) {
            double distance = matrix.distanceMetres(from.getId(), to.getId());
            if (vehicle == null || vehicle.getType() == null) return distance;
            return distance * vehicle.getType().getVehicleCostParams().perDistanceUnit;
        }
    }
}
