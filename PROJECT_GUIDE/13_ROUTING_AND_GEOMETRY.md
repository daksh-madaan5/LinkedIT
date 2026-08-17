# 13. Routing and Geometry — Crow-Fly vs OSRM

This document explains how LinkedIT computes travel costs (distances and durations) and generates map display geometries across its two supported routing modes: **Crow-Fly** (offline Great-Circle) and **OSRM** (Open Source Routing Machine).

---

## 1. Routing Providers Overview

LinkedIT uses Spring Boot's `@ConditionalOnProperty` to switch between routing modes based on `application.properties`:

```text
                           routing.provider
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
      crowfly                                             osrm
 (Default / Offline)                              (Real-World Road)
         │                                                 │
 ┌───────┴────────────────┐                       ┌────────┴────────────────┐
 │ Distance: GreatCircle  │                       │ Distance: OSRM Table    │
 │ Speed: Assumed 30 km/h │                       │ Time: OSRM Table        │
 │ Geometry: Straight line│                       │ Geometry: OSRM Route    │
 └────────────────────────┘                       └─────────────────────────┘
```

---

## 2. Crow-Fly Mode (`routing.provider=crowfly`)

### A. Transport Cost Calculation
Implemented in [`CrowFlyRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java).
- Uses jsprit's `GreatCircleCosts` configured with `DistanceUnit.Meter`.
- Calculates offline sphere trigonometry (Haversine formula) between coordinates.
- Assumes a constant speed of **30 km/h** ($8.333 \text{ m/s}$):
  ```java
  static final double ASSUMED_SPEED_METRES_PER_SECOND = 30_000.0 / 3_600.0;
  ```

### B. Geometry Generation
Implemented in [`CrowFlyRouteGeometryProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRouteGeometryProvider.java).
- Produces a straight-line GeoJSON `LineString` directly connecting the ordered stop coordinates:
  ```json
  {
    "type": "LineString",
    "coordinates": [[85.8245, 20.2961], [85.8170, 20.3050], [85.8245, 20.2961]]
  }
  ```

---

## 3. OSRM Mode (`routing.provider=osrm`)

### A. Matrix Cost Calculation
Implemented in [`OsrmRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRoutingCostProvider.java).
- Deduplicates and formats all request locations into a single OSRM Table API call (`GET /table/v1/driving/...`).
- Receives asymmetric road distance (metres) and duration (seconds) matrices.
- Wraps the matrix in a custom jsprit `AbstractForwardVehicleRoutingTransportCosts`:
  ```java
  @Override
  public double getDistance(Location from, Location to, double departureTime, Vehicle vehicle) {
      return matrix.distanceMetres(from.getId(), to.getId());
  }

  @Override
  public double getTransportTime(Location from, Location to, double departureTime, Driver driver, Vehicle vehicle) {
      return matrix.durationSeconds(from.getId(), to.getId());
  }
  ```

### B. Road Polyline Geometry Generation
Implemented in [`OsrmRouteGeometryProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRouteGeometryProvider.java).
- Called **after** optimization completes.
- Passes each vehicle's final ordered stops to the OSRM Route API (`GET /route/v1/driving/...`).
- Returns actual street-level GeoJSON road coordinates following highways, intersections, and turns.

---

## 4. Handling Vehicle-Specific Start and End Locations

Vehicles can specify custom start or end locations different from the central depot:
```json
{
  "id": "V1",
  "startLocation": {"id": "START-1", "latitude": 20.30, "longitude": 85.81},
  "endLocation": {"id": "END-1", "latitude": 20.29, "longitude": 85.82}
}
```
- [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L86-L90) extracts the exact sequence:
  `[Vehicle Start Location] -> [Stop 1] -> [Stop 2] -> ... -> [Vehicle End Location]`
- [`RouteGeometryIntegrationTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/RouteGeometryIntegrationTest.java#L55-L76) verifies that geometry generation preserves custom start and end locations.
