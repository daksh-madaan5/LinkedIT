package com.linkedit.routing.dto.request;

import java.util.List;

public record OptimizationRequest(
    LocationRequest depot,
    List<VehicleRequest> vehicles,
    List<DeliveryRequest> jobs
) {
}
