# 01. Project Overview — LinkedIT Routing Backend

## 1. Project Purpose

Logistics and delivery management platforms must answer three critical questions every morning:
1. Which vehicle should deliver which packages?
2. In what sequence should each vehicle visit its assigned delivery locations?
3. How can total fuel consumption, driver time, and vehicle wear-and-tear be minimized while meeting customer deadlines and vehicle weight/volume limits?

**LinkedIT** is an automated routing backend designed for Smart India Hackathon (SIH) logistics scenarios. It takes delivery jobs, depot origins, vehicle fleet capacities, and optional delivery time windows, and calculates optimized multi-vehicle route plans.

---

## 2. What the MVP Currently Does

The current Minimum Viable Product (MVP) implemented in this repository provides a production-grade optimization engine wrapped in a Spring Boot REST API.

### Feature Audit & Status Matrix

| Feature | Feature Category | Status | Code Location |
| :--- | :--- | :--- | :--- |
| Single Depot Support | Core Routing | `IMPLEMENTED` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java) |
| Multiple Vehicles with Capacities | Fleet Management | `IMPLEMENTED` | [`OptimizationRequestValidator.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/validation/OptimizationRequestValidator.java) |
| Custom Start/End Vehicle Locations | Fleet Management | `IMPLEMENTED` | [`VehicleRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/VehicleRequest.java) |
| Delivery Demand Units | Job Constraints | `IMPLEMENTED` | [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java) |
| Service Duration (Unloading Time) | Job Constraints | `IMPLEMENTED` | [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java) |
| Job Priorities (1 = highest, 10 = lowest) | Job Constraints | `IMPLEMENTED` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java) |
| Time Windows (Earliest/Latest Arrival) | Job Constraints | `IMPLEMENTED` | [`TimeWindowRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/TimeWindowRequest.java) |
| Offline Great-Circle Distance ("Crow-Fly") | Routing Cost | `IMPLEMENTED` | [`CrowFlyRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java) |
| OSRM Road Distance & Time Matrix | Routing Cost | `IMPLEMENTED` | [`OsrmRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRoutingCostProvider.java) |
| Coordinate Deduplication | Performance | `IMPLEMENTED` | [`RoutingLocations.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocations.java) |
| GeoJSON LineString Road Geometry | Response Rendering | `IMPLEMENTED` | [`OsrmRouteGeometryProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRouteGeometryProvider.java) |
| Unassigned Job Detection | Error & Planning | `IMPLEMENTED` | [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java) |
| Health Check Endpoint (`GET /api/health`) | API Infrastructure | `NOT IMPLEMENTED` | *No health controller configured* |
| React UI Dashboard | Frontend | `FUTURE / FRONTEND` | *To be created in separate repository* |
| Vehicle Skills / Driver Qualifications | Advanced Routing | `NOT IMPLEMENTED` | `FUTURE / PLANNED` |
| Pickup & Delivery Shipments | Advanced Routing | `NOT IMPLEMENTED` | `FUTURE / PLANNED` |
| Database Persistence (PostgreSQL/MySQL) | Data Storage | `NOT IMPLEMENTED` | `FUTURE / PLANNED` |
| Authentication & Multi-Tenancy | Security | `NOT IMPLEMENTED` | `FUTURE / PLANNED` |

---

## 3. Current MVP Flow

Here is the complete lifecycle of a single optimization request:

```text
 Client
   │
   │ 1. Sends HTTP POST /api/optimize with JSON payload
   ▼
[LINKED IT] OptimizationController
   │
   │ 2. Delegates to OptimizationService
   ▼
[LINKED IT] OptimizationService
   │
   ├─► 3. OptimizationRequestValidator checks payload integrity
   │      (Returns 400 Bad Request if invalid)
   │
   ├─► 4. RoutingCostProvider fetches costs
   │      ├─► CrowFly: GreatCircle distance at 30 km/h (Offline)
   │      └─► OSRM: Calls OSRM Table API (/table/v1/driving/...)
   │
   ├─► 5. JspritProblemMapper constructs VehicleRoutingProblem
   │      (Builds Locations, VehicleImpl, Delivery jobs)
   │
   ├─► 6. JspritOptimizer executes metaheuristic algorithm
   │      (200 iterations of Ruin & Recreate via Jsprit.Builder)
   │
   ├─► 7. JspritSolutionMapper converts solution back to DTOs
   │      (Calculates total distance, duration, loads per stop)
   │
   └─► 8. RouteGeometryProvider attaches GeoJSON geometries
          ├─► CrowFly: Straight line segment between stops
          └─► OSRM: Calls OSRM Route API (/route/v1/driving/...)
   │
   ▼
 Client receives 200 OK with OptimizationResponse JSON
```
