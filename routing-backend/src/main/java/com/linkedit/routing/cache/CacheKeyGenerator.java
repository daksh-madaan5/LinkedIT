package com.linkedit.routing.cache;

import com.linkedit.routing.dto.request.DeliveryRequest;
import com.linkedit.routing.dto.request.LocationRequest;
import com.linkedit.routing.dto.request.OptimizationRequest;
import com.linkedit.routing.dto.request.TimeWindowRequest;
import com.linkedit.routing.dto.request.VehicleRequest;
import com.linkedit.routing.routing.RoutingLocation;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

/**
 * Deterministic SHA-256 cache key generator for optimization requests,
 * OSRM matrix queries, and route geometry queries.
 */
public final class CacheKeyGenerator {

    private CacheKeyGenerator() {
    }

    /**
     * Generates a deterministic SHA-256 key for a full OptimizationRequest.
     */
    public static String forOptimization(OptimizationRequest request, String routingProvider) {
        StringBuilder sb = new StringBuilder(512);
        sb.append("PROVIDER:").append(routingProvider == null ? "" : routingProvider).append("|");

        if (request.depot() != null) {
            sb.append("DEPOT:").append(formatLocation(request.depot())).append("|");
        }

        sb.append("VEHICLES:[");
        if (request.vehicles() != null) {
            for (VehicleRequest v : request.vehicles()) {
                if (v == null) continue;
                sb.append(v.id()).append(",")
                  .append(v.capacity()).append(",")
                  .append(v.startLocation() == null ? "" : formatLocation(v.startLocation())).append(",")
                  .append(v.endLocation() == null ? "" : formatLocation(v.endLocation())).append(";");
            }
        }
        sb.append("]|JOBS:[");
        if (request.jobs() != null) {
            for (DeliveryRequest j : request.jobs()) {
                if (j == null) continue;
                sb.append(j.id()).append(",")
                  .append(j.latitude()).append(",")
                  .append(j.longitude()).append(",")
                  .append(j.demand()).append(",")
                  .append(j.serviceDuration()).append(",")
                  .append(j.priority() == null ? "" : j.priority()).append(",")
                  .append(formatTimeWindow(j.timeWindow())).append(";");
            }
        }
        sb.append("]");

        return sha256(sb.toString());
    }

    /**
     * Generates a deterministic SHA-256 key for an OSRM matrix (table) request.
     */
    public static String forMatrix(List<RoutingLocation> uniqueLocations, String baseUrl) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("BASE:").append(baseUrl == null ? "" : baseUrl).append("|LOCATIONS:[");
        if (uniqueLocations != null) {
            for (RoutingLocation loc : uniqueLocations) {
                if (loc == null) continue;
                sb.append(loc.id()).append(",").append(loc.latitude()).append(",").append(loc.longitude()).append(";");
            }
        }
        sb.append("]");
        return sha256(sb.toString());
    }

    /**
     * Generates a deterministic SHA-256 key for an OSRM route geometry request.
     */
    public static String forGeometry(List<RoutingLocation> orderedLocations, String baseUrl) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("BASE:").append(baseUrl == null ? "" : baseUrl).append("|ROUTE:[");
        if (orderedLocations != null) {
            for (RoutingLocation loc : orderedLocations) {
                if (loc == null) continue;
                sb.append(loc.id()).append(",").append(loc.latitude()).append(",").append(loc.longitude()).append(";");
            }
        }
        sb.append("]");
        return sha256(sb.toString());
    }

    private static String formatLocation(LocationRequest loc) {
        if (loc == null) return "";
        return loc.id() + "," + loc.latitude() + "," + loc.longitude();
    }

    private static String formatTimeWindow(TimeWindowRequest tw) {
        if (tw == null) return "";
        return tw.start() + "-" + tw.end();
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 message digest not available", e);
        }
    }
}
