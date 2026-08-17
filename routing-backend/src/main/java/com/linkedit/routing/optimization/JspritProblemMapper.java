package com.linkedit.routing.optimization;

import com.graphhopper.jsprit.core.problem.Location;
import com.graphhopper.jsprit.core.problem.VehicleRoutingProblem;
import com.graphhopper.jsprit.core.problem.job.Delivery;
import com.graphhopper.jsprit.core.problem.solution.route.activity.TimeWindow;
import com.graphhopper.jsprit.core.problem.vehicle.VehicleImpl;
import com.graphhopper.jsprit.core.problem.vehicle.VehicleTypeImpl;
import com.graphhopper.jsprit.core.util.Coordinate;
import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.exception.OptimizationException;
import com.linkedit.routing.routing.RoutingCostProvider;
import org.springframework.stereotype.Component;

@Component
public class JspritProblemMapper {

    private final RoutingCostProvider routingCostProvider;

    public JspritProblemMapper(RoutingCostProvider routingCostProvider) {
        this.routingCostProvider = routingCostProvider;
    }

    public VehicleRoutingProblem map(OptimizationRequest request) {
        try {
            Location depot = toLocation(request.depot());
            VehicleRoutingProblem.Builder problem = VehicleRoutingProblem.Builder.newInstance()
                .setFleetSize(VehicleRoutingProblem.FleetSize.FINITE)
                .setRoutingCost(routingCostProvider.createTransportCosts(request));

            for (VehicleRequest vehicle : request.vehicles()) {
                VehicleTypeImpl type = VehicleTypeImpl.Builder.newInstance(vehicle.id() + "-type")
                    .addCapacityDimension(0, vehicle.capacity())
                    .setCostPerDistance(0.001)
                    .build();
                Location start = vehicle.startLocation() == null ? depot : toLocation(vehicle.startLocation());
                Location end = vehicle.endLocation() == null ? depot : toLocation(vehicle.endLocation());
                VehicleImpl jspritVehicle = VehicleImpl.Builder.newInstance(vehicle.id())
                    .setType(type)
                    .setStartLocation(start)
                    .setEndLocation(end)
                    .setReturnToDepot(true)
                    .build();
                problem.addVehicle(jspritVehicle);
            }

            for (DeliveryRequest job : request.jobs()) {
                Delivery.Builder delivery = Delivery.Builder.newInstance(job.id());
                delivery.setLocation(toLocation(new LocationRequest(job.id(), job.latitude(), job.longitude())));
                delivery.addSizeDimension(0, job.demand());
                delivery.setServiceTime(job.serviceDuration());
                if (job.priority() != null) delivery.setPriority(job.priority());
                if (job.timeWindow() != null) {
                    delivery.setTimeWindow(TimeWindow.newInstance(job.timeWindow().start(), job.timeWindow().end()));
                }
                problem.addJob(delivery.build());
            }
            return problem.build();
        } catch (OptimizationException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new OptimizationException("Could not construct the jsprit routing problem", exception);
        }
    }

    private Location toLocation(LocationRequest location) {
        return Location.Builder.newInstance()
            .setId(location.id())
            .setCoordinate(Coordinate.newInstance(location.longitude(), location.latitude()))
            .build();
    }
}
