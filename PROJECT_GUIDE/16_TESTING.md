# 16. Testing — Test Suite & Mocking Strategies

This document describes the automated unit and integration tests present in the LinkedIT backend repository.

---

## 1. Test Suite Directory Table

Location: [`routing-backend/src/test/java/com/linkedit/routing/`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/)

| Test Class | Test Type | What It Verifies | Source Location |
| :--- | :--- | :--- | :--- |
| [`OptimizationControllerTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/controller/OptimizationControllerTest.java) | Controller Test (`@WebMvcTest`) | Verifies `POST /api/optimize` endpoint mapping, HTTP status codes, JSON serialization, and GeoJSON LineString formatting. | [`OptimizationControllerTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/controller/OptimizationControllerTest.java) |
| [`OptimizationServiceTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/OptimizationServiceTest.java) | Service Integration Test | Performs an end-to-end optimization of a multi-job Bhubaneswar scenario using Crow-Fly costs, verifying assigned jobs, non-duplicate stops, capacity limits, and summary metrics. | [`OptimizationServiceTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/OptimizationServiceTest.java) |
| [`OsrmOptimizationIntegrationTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/OsrmOptimizationIntegrationTest.java) | OSRM Integration Test | Verifies that the optimizer calls the OSRM Table API **exactly once**, preloads the road matrix, and chooses the cheapest stop order (`A -> B`). | [`OsrmOptimizationIntegrationTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/OsrmOptimizationIntegrationTest.java) |
| [`RouteGeometryIntegrationTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/RouteGeometryIntegrationTest.java) | Geometry Integration Test | Verifies that geometry is requested **once per used route** after optimization and preserves vehicle-specific start/end locations. | [`RouteGeometryIntegrationTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/RouteGeometryIntegrationTest.java) |
| [`HttpOsrmClientTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/routing/HttpOsrmClientTest.java) | Unit Test | Tests URI string formatting (`lng,lat;lng,lat...`) for Table and Route APIs, and verifies GeoJSON parsing from OSRM response JSON. | [`HttpOsrmClientTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/routing/HttpOsrmClientTest.java) |
| [`OsrmRoutingCostProviderTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/routing/OsrmRoutingCostProviderTest.java) | Unit Test | Verifies asymmetric distance/duration lookup and vehicle cost adjustment calculation. | [`OsrmRoutingCostProviderTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/routing/OsrmRoutingCostProviderTest.java) |
| [`RoutingLocationsTest`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/routing/RoutingLocationsTest.java) | Unit Test | Verifies coordinate deduplication and deterministic indexing across depot, vehicle start/end, and job locations. | [`RoutingLocationsTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/routing/RoutingLocationsTest.java) |

---

## 2. Why Tests Do Not Call Public OSRM Servers

> [!IMPORTANT]
> **Hermetic Testing Rule**:
> Automated unit and integration tests must **never** depend on external internet services like public OSRM servers.
> External public servers can be slow, rate-limited, offline, or return changing road geometries.
> Instead, tests mock the `OsrmClient` interface using Lambda functions or Mockito (`OsrmClient fakeClient = locations -> matrixFor(...)`), ensuring tests run in milliseconds without network calls.

---

## 3. How to Run the Tests

Execute in Windows PowerShell at the repository root:

### Run All Unit and Integration Tests
```powershell
mvn -pl routing-backend test
```

### Run a Specific Test Class
```powershell
mvn -pl routing-backend test -Dtest=OptimizationServiceTest
```
