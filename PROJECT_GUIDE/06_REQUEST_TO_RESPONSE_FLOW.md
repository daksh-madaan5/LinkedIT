# 06. Request-to-Response Flow — Detailed Step Tracing

This document provides a complete, 13-step trace of what happens when a client sends an HTTP `POST /api/optimize` request to the LinkedIT backend.

---

## Complete 13-Step Request Lifecycle

```text
 Client
   │
   ├─► Step 1: HTTP Request enters OptimizationController
   ├─► Step 2: Payload Validation by OptimizationRequestValidator
   ├─► Step 3: Coordinate Collection & Deduplication by RoutingLocations
   ├─► Step 4: Routing Provider Selection (CrowFly vs OSRM)
   ├─► Step 5: OSRM Matrix Preloading (Table API GET request)
   ├─► Step 6: VehicleRoutingProblem Construction by JspritProblemMapper
   ├─► Step 7: jsprit Algorithm Instantiation (Jsprit.Builder)
   ├─► Step 8: Metaheuristic Search Execution (200 iterations)
   ├─► Step 9: Best Solution Selection (Solutions.bestOf)
   ├─► Step 10: Solution DTO Mapping & Load Calculations (SolutionAnalyser)
   ├─► Step 11: Route Order Extraction (routeLocations)
   ├─► Step 12: Route Geometry Resolution (GeoJSON LineString)
   └─► Step 13: HTTP JSON Response Generation (200 OK)
```

---

### Step 1: HTTP Request Enters Controller
- **Class**: [`OptimizationController.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/OptimizationController.java#L22-L25)
- **Method**: `optimize(@RequestBody OptimizationRequest request)`
- **Action**: Spring MVC deserializes the JSON request body into an immutable [`OptimizationRequest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/OptimizationRequest.java) record and calls `optimizationService.optimize(request)`.

---

### Step 2: Payload Validation
- **Class**: [`OptimizationRequestValidator.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/validation/OptimizationRequestValidator.java#L18-L31)
- **Method**: `validate(OptimizationRequest request)`
- **Checks**:
  1. Verifies request body, depot, vehicles list, and jobs list are non-null and non-empty.
  2. Ensures vehicle capacities are $> 0$.
  3. Checks that all IDs (vehicle IDs, job IDs, location IDs) are non-blank and globally unique.
  4. Verifies coordinate ranges: Latitude $\in [-90, 90]$, Longitude $\in [-180, 180]$.
  5. Validates job service durations $\ge 0$, demand $\ge 0$, and priority $\in [1, 10]$.
  6. Checks time windows satisfy $0 \le start \le end$.
- **Error Behavior**: If any check fails, throws [`InvalidOptimizationRequestException`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/exception/InvalidOptimizationRequestException.java), converted by [`ApiExceptionHandler.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/ApiExceptionHandler.java#L16-L19) into HTTP `400 Bad Request`.

---

### Step 3: Location Collection & Deduplication
- **Class**: [`RoutingLocations.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocations.java#L21-L32)
- **Method**: `RoutingLocations.from(OptimizationRequest request)`
- **Action**: Collects all coordinates across depot, vehicle start/end locations, and jobs into a deduplicated list. If two locations share identical latitude/longitude, they share the same integer matrix index.

---

### Step 4: Routing Provider Selection
- **Interface**: [`RoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingCostProvider.java)
- **Selection**: Governed by Spring Boot `@ConditionalOnProperty`:
  - `routing.provider=crowfly` (default) $\rightarrow$ [`CrowFlyRoutingCostProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java)
  - `routing.provider=osrm` $\rightarrow$ [`OsrmRoutingCostProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRoutingCostProvider.java)

---

### Step 5: OSRM Matrix Preloading (In OSRM Mode)
- **Class**: [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L41-L68)
- **Method**: `table(RoutingLocations locations)`
- **Action**: Builds URL `http://localhost:5000/table/v1/driving/lng1,lat1;lng2,lat2...?annotations=distance,duration`. Makes a single HTTP GET request to OSRM. Returns a 2D matrix of road distances (metres) and durations (seconds) wrapped in a [`RoutingMatrix`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingMatrix.java).

---

### Step 6: VehicleRoutingProblem Construction
- **Class**: [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L27-L67)
- **Method**: `map(OptimizationRequest request)`
- **Action**:
  1. Builds jsprit `Location` objects with `Coordinate.newInstance(longitude, latitude)`.
  2. Sets `FleetSize.FINITE`.
  3. Attaches the `VehicleRoutingTransportCosts` matrix.
  4. Builds `VehicleTypeImpl` with `setCostPerDistance(0.001)` and capacity dimension 0.
  5. Builds `VehicleImpl` instances for each vehicle request.
  6. Builds `Delivery` job instances with demand, service time, priority, and time windows.

---

### Step 7 & 8: Algorithm Instantiation & Search Execution
- **Class**: [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java#L17-L30)
- **Method**: `optimize(VehicleRoutingProblem problem)`
- **Action**:
  1. Instantiates algorithm: `Jsprit.Builder.newInstance(problem).buildAlgorithm()`.
  2. Sets iterations: `algorithm.setMaxIterations(200)`.
  3. Executes search: `algorithm.searchSolutions()`. Performs Ruin & Recreate metaheuristic optimization over 200 iterations completely in memory.

---

### Step 9: Best Solution Selection
- **Class**: [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java#L22)
- **Action**: Calls `Solutions.bestOf(solutions)` to select the `VehicleRoutingProblemSolution` with the lowest total objective cost.

---

### Step 10: Solution DTO Mapping & Load Analysis
- **Class**: [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L26-L79)
- **Method**: `map(VehicleRoutingProblem problem, VehicleRoutingProblemSolution solution)`
- **Action**: Uses jsprit's `SolutionAnalyser` to calculate exact arrival times, departure times, load at beginning of route, delivered load, remaining load right after each activity, total route distance, and total route duration. Builds [`StopResponse`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/StopResponse.java) and [`RouteResponse`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/RouteResponse.java) records.

---

### Step 11: Route Order Extraction
- **Class**: [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L82-L94)
- **Method**: `routeLocations(VehicleRoutingProblemSolution solution)`
- **Action**: Extracts the exact sequence of start location $\rightarrow$ activity locations $\rightarrow$ end location for each used vehicle as a `List<RoutingLocation>`.

---

### Step 12: Route Geometry Resolution
- **Class**: [`OptimizationService.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/service/OptimizationService.java#L54-L67)
- **Method**: `withGeometry(RouteResponse route, List<RoutingLocation> orderedLocations)`
- **Action**: Passes ordered locations to [`RouteGeometryProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RouteGeometryProvider.java).
  - In `crowfly` mode: Returns straight LineString segments.
  - In `osrm` mode: Calls OSRM Route API (`/route/v1/driving/lng1,lat1;lng2,lat2...?overview=full&geometries=geojson`) to fetch precise road polyline geometry.

---

### Step 13: HTTP JSON Response Generation
- **Class**: [`OptimizationController.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/OptimizationController.java#L24)
- **Action**: Wraps the final [`OptimizationResponse`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/OptimizationResponse.java) in `ResponseEntity.ok()` and sends HTTP 200 OK with formatted JSON.
