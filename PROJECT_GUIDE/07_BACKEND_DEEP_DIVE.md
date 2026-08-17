# 07. Backend Deep Dive — Component Reference Dictionary

This document details every single Java class in the [`routing-backend`](file:///d:/Study/SIH/LinkedIT/routing-backend) module.

---

## Complete Class Directory Table

| Class Name | Package | Responsibility | Called By | Calls | Modify for Future Features? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [`RoutingBackendApplication`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/RoutingBackendApplication.java) | `c.l.routing` | Main Spring Boot application entry point (`main` method). | JVM / Spring Boot | `SpringApplication.run` | Seldom |
| [`OptimizationController`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/OptimizationController.java) | `c.l.r.controller` | REST controller exposing `POST /api/optimize`. | HTTP Clients | `OptimizationService` | Yes (New endpoints) |
| [`ApiExceptionHandler`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/ApiExceptionHandler.java) | `c.l.r.controller` | `@RestControllerAdvice` handling exceptions. | Spring Web | `ApiError` DTO | Yes (New exception types) |
| [`OptimizationRequestValidator`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/validation/OptimizationRequestValidator.java) | `c.l.r.validation` | Validates payload integrity and business rules. | `OptimizationService` | `InvalidOptimizationRequestException` | Yes (New request rules) |
| [`OptimizationService`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/service/OptimizationService.java) | `c.l.r.service` | Master orchestrator service. | `OptimizationController` | Validator, Mappers, Optimizer, Geometry | Yes (Workflow changes) |
| [`JspritProblemMapper`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java) | `c.l.r.optimization` | Maps DTOs to jsprit `VehicleRoutingProblem`. | `OptimizationService` | `RoutingCostProvider`, jsprit Builders | Yes (New vehicle/job constraints) |
| [`JspritOptimizer`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java) | `c.l.r.optimization` | Executes jsprit algorithm search strategies. | `OptimizationService` | `Jsprit.Builder`, `Solutions` | Yes (Algorithm tuning/iterations) |
| [`JspritSolutionMapper`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java) | `c.l.r.optimization` | Maps jsprit solution back to application DTOs. | `OptimizationService` | `SolutionAnalyser`, Response DTOs | Yes (New response fields) |
| [`RoutingCostProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingCostProvider.java) | `c.l.r.routing` | Interface for transport cost creation. | `JspritProblemMapper` | Implementations | Seldom |
| [`CrowFlyRoutingCostProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java) | `c.l.r.routing` | Offline Great-Circle cost provider. | `JspritProblemMapper` | `GreatCircleCosts` | Seldom |
| [`OsrmRoutingCostProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRoutingCostProvider.java) | `c.l.r.routing` | OSRM Table matrix cost provider. | `JspritProblemMapper` | `OsrmClient`, `RoutingLocations` | Seldom |
| [`OsrmClient`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmClient.java) | `c.l.r.routing` | Interface for OSRM REST HTTP calls. | Routing & Geometry Providers | Implementations | Seldom |
| [`HttpOsrmClient`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java) | `c.l.r.routing` | Java HttpClient implementation for OSRM REST. | `OsrmRoutingCostProvider`, Geometry | `HttpClient`, `ObjectMapper` | Yes (OSRM API updates) |
| [`OsrmProperties`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmProperties.java) | `c.l.r.routing` | `@ConfigurationProperties` for OSRM options. | Spring / `HttpOsrmClient` | Properties | Yes (New config options) |
| [`RoutingLocation`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocation.java) | `c.l.r.routing` | Location record (`id`, `lat`, `lng`). | Matrix & Geometry Providers | None | No |
| [`RoutingLocations`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocations.java) | `c.l.r.routing` | Deduplicates and indexes request locations. | `OsrmRoutingCostProvider` | `OptimizationRequest` | Seldom |
| [`RoutingMatrix`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingMatrix.java) | `c.l.r.routing` | Immutable 2D matrix of distances and durations. | `OsrmRoutingCostProvider` | Matrix Arrays | Seldom |
| [`RouteGeometryProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RouteGeometryProvider.java) | `c.l.r.routing` | Interface for route polyline resolution. | `OptimizationService` | Implementations | Seldom |
| [`CrowFlyRouteGeometryProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRouteGeometryProvider.java) | `c.l.r.routing` | Straight-line GeoJSON geometry provider. | `OptimizationService` | `RouteGeometry` | Seldom |
| [`OsrmRouteGeometryProvider`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRouteGeometryProvider.java) | `c.l.r.routing` | OSRM Route API GeoJSON geometry provider. | `OptimizationService` | `OsrmClient` | Seldom |
| [`OsrmCoordinateFormatter`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmCoordinateFormatter.java) | `c.l.r.routing` | Formats coordinates as `lng,lat;lng,lat...`. | `HttpOsrmClient` | String Joiner | Seldom |
| **DTO Records** (`dto/request/*`, `dto/response/*`) | `c.l.r.dto.*` | JSON request/response schema representations. | Entire Application | Jackson | Yes (API contract additions) |
| **Exceptions** (`exception/*`) | `c.l.r.exception` | Custom runtime exceptions. | Entire Application | `ApiExceptionHandler` | Yes (New exception cases) |

---

## Detailed Class Walkthroughs

### 1. [`OptimizationService.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/service/OptimizationService.java)
- **Role**: Core orchestrator bean registered as `@Service`.
- **Key Method**: `OptimizationResponse optimize(OptimizationRequest request)`
- **Detailed Mechanics**:
  1. Calls `validator.validate(request)`.
  2. Calls `problemMapper.map(request)` (which triggers cost provider loading).
  3. Calls `optimizer.optimize(problem)`.
  4. Calls `solutionMapper.map(problem, solution)`.
  5. Calls `solutionMapper.routeLocations(solution)` to retrieve final ordered route coordinates.
  6. Iterates over mapped routes and calls `geometryProvider.getGeometry(orderedLocations)` for each vehicle.
  7. Reassembles and returns final `OptimizationResponse`.

---

### 2. [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java)
- **Role**: Translates Spring JSON DTOs into jsprit mathematical domain objects.
- **Key Method**: `VehicleRoutingProblem map(OptimizationRequest request)`
- **Key Lines**:
  - `setFleetSize(VehicleRoutingProblem.FleetSize.FINITE)`: Enforces that jsprit cannot invent extra vehicles beyond the provided fleet.
  - `VehicleTypeImpl.Builder.newInstance(vehicle.id() + "-type").addCapacityDimension(0, vehicle.capacity()).setCostPerDistance(0.001)`: Assigns vehicle capacity dimension 0 and a small cost per distance.
  - `Delivery.Builder.newInstance(job.id()).setLocation(...).addSizeDimension(0, job.demand()).setServiceTime(job.serviceDuration())`: Builds delivery jobs with demands matching capacity dimension 0.
  - `Coordinate.newInstance(location.longitude(), location.latitude())`: Note coordinate parameter order in jsprit! `x = longitude`, `y = latitude`.

---

### 3. [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java)
- **Role**: Low-level HTTP networking client invoking external OSRM service.
- **Key Methods**:
  - `RoutingMatrix table(RoutingLocations locations)`: Calls `/table/v1/driving/{coords}?annotations=distance,duration`.
  - `RouteGeometry route(List<RoutingLocation> orderedLocations)`: Calls `/route/v1/driving/{coords}?overview=full&geometries=geojson`.
  - `URI buildTableUri(...)` & `URI buildRouteUri(...)`: Utility methods formatting coordinates into semicolon-delimited `longitude,latitude` strings.
- **Timeout & Error Handling**: Connect timeout defaults to 2s; request timeout defaults to 10s. Throws `RoutingProviderException` on HTTP status $\ge 300$, JSON parse errors, or missing routes.
