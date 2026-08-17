package com.linkedit.routing.validation;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.TimeWindowRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.exception.InvalidOptimizationRequestException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class OptimizationRequestValidator {

    public void validate(OptimizationRequest request) {
        List<String> errors = new ArrayList<>();
        if (request == null) {
            throw new InvalidOptimizationRequestException(List.of("request body is required"));
        }

        validateLocation("depot", request.depot(), errors);
        validateVehicles(request.vehicles(), errors);
        validateJobs(request.jobs(), errors);

        if (!errors.isEmpty()) {
            throw new InvalidOptimizationRequestException(errors);
        }
    }

    private void validateVehicles(List<VehicleRequest> vehicles, List<String> errors) {
        if (vehicles == null || vehicles.isEmpty()) {
            errors.add("at least one vehicle is required");
            return;
        }
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < vehicles.size(); i++) {
            VehicleRequest vehicle = vehicles.get(i);
            String path = "vehicles[" + i + "]";
            if (vehicle == null) {
                errors.add(path + " is required");
                continue;
            }
            validateId(path + ".id", vehicle.id(), ids, errors);
            if (vehicle.capacity() <= 0) errors.add(path + ".capacity must be greater than 0");
            if (vehicle.startLocation() != null) validateLocation(path + ".startLocation", vehicle.startLocation(), errors);
            if (vehicle.endLocation() != null) validateLocation(path + ".endLocation", vehicle.endLocation(), errors);
        }
    }

    private void validateJobs(List<DeliveryRequest> jobs, List<String> errors) {
        if (jobs == null || jobs.isEmpty()) {
            errors.add("at least one job is required");
            return;
        }
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < jobs.size(); i++) {
            DeliveryRequest job = jobs.get(i);
            String path = "jobs[" + i + "]";
            if (job == null) {
                errors.add(path + " is required");
                continue;
            }
            validateId(path + ".id", job.id(), ids, errors);
            validateCoordinates(path, job.latitude(), job.longitude(), errors);
            if (job.demand() < 0) errors.add(path + ".demand must be at least 0");
            if (!Double.isFinite(job.serviceDuration()) || job.serviceDuration() < 0) {
                errors.add(path + ".serviceDuration must be a finite value at least 0");
            }
            if (job.priority() != null && (job.priority() < 1 || job.priority() > 10)) {
                errors.add(path + ".priority must be between 1 (highest) and 10");
            }
            validateTimeWindow(path + ".timeWindow", job.timeWindow(), errors);
        }
    }

    private void validateTimeWindow(String path, TimeWindowRequest timeWindow, List<String> errors) {
        if (timeWindow == null) return;
        if (timeWindow.start() == null || timeWindow.end() == null
            || !Double.isFinite(timeWindow.start()) || !Double.isFinite(timeWindow.end())
            || timeWindow.start() < 0 || timeWindow.end() < timeWindow.start()) {
            errors.add(path + " must have finite seconds with 0 <= start <= end");
        }
    }

    private void validateLocation(String path, LocationRequest location, List<String> errors) {
        if (location == null) {
            errors.add(path + " is required");
            return;
        }
        if (isBlank(location.id())) errors.add(path + ".id is required");
        validateCoordinates(path, location.latitude(), location.longitude(), errors);
    }

    private void validateCoordinates(String path, Double latitude, Double longitude, List<String> errors) {
        if (latitude == null || !Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            errors.add(path + ".latitude must be between -90 and 90");
        }
        if (longitude == null || !Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            errors.add(path + ".longitude must be between -180 and 180");
        }
    }

    private void validateId(String path, String id, Set<String> seen, List<String> errors) {
        if (isBlank(id)) {
            errors.add(path + " is required");
        } else if (!seen.add(id)) {
            errors.add(path + " must be unique; duplicate value: " + id);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
