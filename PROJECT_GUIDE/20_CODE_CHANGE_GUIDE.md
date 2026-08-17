# 20. Code Change Guide — "If I Want to Change X, Where Do I Go?"

This practical guide tells you exactly which files to modify when adding new features or tweaking existing functionality in the LinkedIT backend.

---

## 1. Quick Change Directory Table

| I Want to... | Files to Modify |
| :--- | :--- |
| **Add a new request field** | 1. Request DTO (`DeliveryRequest.java` or `VehicleRequest.java`)<br>2. Validation (`OptimizationRequestValidator.java`)<br>3. Problem Mapper (`JspritProblemMapper.java`) |
| **Add a new response field** | 1. Response DTO (`RouteResponse.java` or `StopResponse.java`)<br>2. Solution Mapper (`JspritSolutionMapper.java`) |
| **Change validation rules** | `OptimizationRequestValidator.java` |
| **Change OSRM request timeouts or defaults** | `application.properties` OR `OsrmProperties.java` |
| **Change OSRM HTTP endpoint format** | `HttpOsrmClient.java` AND `OsrmCoordinateFormatter.java` |
| **Change jsprit optimization iterations** | `JspritOptimizer.java` (`DEVELOPMENT_ITERATIONS` constant) |
| **Add a hard or soft constraint** | 1. Implement custom constraint in `com.linkedit.routing.optimization.constraint`<br>2. Register constraint in `JspritOptimizer.java` |
| **Change vehicle cost per distance calculation** | `JspritProblemMapper.java` (`setCostPerDistance(0.001)`) |
| **Add a new REST API endpoint** | 1. Controller (`OptimizationController.java` or new controller)<br>2. Service (`OptimizationService.java`) |
| **Change exception error messages or HTTP codes** | `ApiExceptionHandler.java` |

---

## 2. Files You Should NEVER Modify

> [!WARNING]
> **Files to Avoid Modifying**:
> 1. **`jsprit-core/**`**: Do **NOT** modify files inside the embedded `jsprit-core` module unless you are fixing an upstream algorithm bug. All LinkedIT application logic, mapping, validation, and routing integration belongs inside `routing-backend`.
> 2. **Master `pom.xml` dependency versions**: Do **NOT** downgrade Maven compiler properties below Java 21 (`<maven.compiler.source>21</maven.compiler.source>`), as the codebase relies heavily on Java 21 Records and stream features.

---

## 3. Step-by-Step Example: Adding a `driverName` Field to Vehicle

### Step 1: Update `VehicleRequest.java`
Add `String driverName` parameter to the record:
```java
public record VehicleRequest(
    String id,
    int capacity,
    String driverName,
    LocationRequest startLocation,
    LocationRequest endLocation
) {}
```

### Step 2: Update `OptimizationRequestValidator.java`
Add validation rule if required:
```java
if (vehicle.driverName() != null && vehicle.driverName().isBlank()) {
    errors.add(path + ".driverName cannot be blank if provided");
}
```

### Step 3: Update `RouteResponse.java`
Add `String driverName` to response:
```java
public record RouteResponse(
    String vehicleId,
    String driverName,
    List<StopResponse> stops,
    double distance, ...
) {}
```

### Step 4: Update `JspritSolutionMapper.java`
Map driver name from problem/request to response:
```java
routes.add(new RouteResponse(
    route.getVehicle().getId(),
    driverNameMap.get(route.getVehicle().getId()),
    ...
));
```
