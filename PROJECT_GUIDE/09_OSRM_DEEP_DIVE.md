# 09. OSRM Deep Dive — Open Source Routing Machine Integration

This document details how LinkedIT integrates with the **Open Source Routing Machine (OSRM)** (`[OSRM]`) for road-network matrices and GeoJSON polyline geometries.

---

## 1. What is OSRM and Why Do We Need It?

`jsprit` is an optimization solver, not a mapping or routing engine. Out of the box, jsprit only understands Euclidean or Great-Circle straight lines. In real cities:
- Vehicles cannot fly over buildings or rivers.
- Road networks have one-way streets, turn restrictions, speed limits, and traffic obstacles.
- A 10 km straight-line distance might require a 15 km driving route taking 25 minutes.

**OSRM** provides real road network data derived from OpenStreetMap (OSM). LinkedIT uses OSRM to supply jsprit with true driving distances and travel times.

---

## 2. OSRM Architecture in LinkedIT

LinkedIT interacts with OSRM using two distinct APIs at two different stages of the request lifecycle:

```text
 1. BEFORE Optimization (Pre-optimization Matrix Loading)
    OptimizationRequest Locations
                 │
                 ▼
          OSRM Table API  GET /table/v1/driving/{coordinates}?annotations=distance,duration
                 │
                 ▼
          RoutingMatrix (2D arrays of metres & seconds)
                 │
                 ▼
          jsprit Engine (Uses preloaded matrix for all 200 iterations)

 2. AFTER Optimization (Post-optimization Geometry Generation)
    Final Ordered Stops per Vehicle Route
                 │
                 ▼
          OSRM Route API  GET /route/v1/driving/{coordinates}?overview=full&geometries=geojson
                 │
                 ▼
          GeoJSON LineString Polylines
                 │
                 ▼
          Frontend Map Visualization
```

---

## 3. Why Table API Before Optimization vs Route API After Optimization?

This design decision is **critical** for system performance:

> [!IMPORTANT]
> **Performance Architecture Decision**:
> - During optimization, jsprit evaluates thousands of route permutations per second. Calling OSRM over HTTP during every iteration would cause thousands of network calls, slowing down optimization from 1 second to 30 minutes!
> - Instead, we call the **OSRM Table API ONCE** before optimization to fetch an $N \times N$ matrix. jsprit performs all evaluations offline in memory against this matrix.
> - Once the best route is selected, we call the **OSRM Route API ONCE per used vehicle** to fetch the detailed GeoJSON road polyline for UI rendering.

---

## 4. OSRM API Specifications & Formats

### A. Coordinate Ordering & Format
- OSRM and GeoJSON require coordinates in **`longitude,latitude`** order (WGS84 degrees).
- Formatted in [`OsrmCoordinateFormatter.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmCoordinateFormatter.java) as semicolon-delimited values:
  `lng1,lat1;lng2,lat2;lng3,lat3`

### B. Unit Standards
- **Distance**: Metres ($m$).
- **Duration**: Seconds ($s$).

### C. OSRM Table Request Example
```text
GET http://localhost:5000/table/v1/driving/85.8245,20.2961;85.817,20.305;85.826,20.316?annotations=distance,duration
```

### D. OSRM Route Request Example
```text
GET http://localhost:5000/route/v1/driving/85.8245,20.2961;85.817,20.305;85.8245,20.2961?overview=full&geometries=geojson
```

---

## 5. OSRM Configuration & Failure Modes

Configuration properties in [`OsrmProperties.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmProperties.java):
- `routing.osrm.base-url`: OSRM server address (Default: `http://localhost:5000`).
- `routing.osrm.connect-timeout`: HTTP connect timeout (Default: `2s`).
- `routing.osrm.request-timeout`: HTTP request timeout (Default: `10s`).
- `routing.osrm.max-locations`: Maximum unique locations allowed (Default: `100`).

### Failure Behavior
If OSRM is unreachable, times out, returns HTTP 5xx, or returns unroutable coordinates (`null` matrix entries), [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L58-L67) throws [`RoutingProviderException`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/exception/RoutingProviderException.java). [`ApiExceptionHandler.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/ApiExceptionHandler.java#L32-L36) catches this and returns HTTP `502 Bad Gateway`.
