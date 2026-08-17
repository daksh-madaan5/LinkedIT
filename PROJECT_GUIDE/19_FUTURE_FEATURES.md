# 19. Future Features — Feature Roadmap

This document outlines the product roadmap for LinkedIT, distinguishing verified MVP capabilities from planned future enhancements.

---

## Roadmap Feature Matrix

| Feature | Feature Category | Status | Proposed Connection Point in Architecture |
| :--- | :--- | :--- | :--- |
| Single Depot & Fleet Capacities | Core VRP | `IMPLEMENTED` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java) |
| Customer Delivery Time Windows | VRP Constraints | `IMPLEMENTED` | [`TimeWindowRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/TimeWindowRequest.java) |
| Crow-Fly & OSRM Matrix Routing | Routing Engine | `IMPLEMENTED` | [`OsrmRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRoutingCostProvider.java) |
| GeoJSON Polyline Generation | Map Rendering | `IMPLEMENTED` | [`OsrmRouteGeometryProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRouteGeometryProvider.java) |
| Health Check Endpoint (`GET /api/health`) | API Infra | `NOT IMPLEMENTED` | Create `HealthController.java` in `com.linkedit.routing.controller`. |
| React + Vite Map UI Dashboard | Frontend UI | `FUTURE / FRONTEND` | Separate React web application consuming `POST /api/optimize`. |
| Vehicle Skills / Job Skill Matching | VRP Constraints | `FUTURE / PLANNED` | Add `List<String> skills` to `VehicleRequest` & `DeliveryRequest`; map to jsprit `Skills`. |
| Maximum Route Duration / Distance | VRP Constraints | `FUTURE / PLANNED` | Add `maxDuration` to `VehicleRequest`; register custom `HardRouteConstraint` in `JspritOptimizer`. |
| Multiple Depots Support | Fleet Routing | `FUTURE / PLANNED` | Extend `OptimizationRequest` to accept `List<LocationRequest> depots`. |
| Pickup & Delivery (Shipments) | VRP Routing | `FUTURE / PLANNED` | Create `ShipmentRequest.java`; map to jsprit `Shipment` objects in `JspritProblemMapper`. |
| Live GPS Driver Tracking | Telematics | `FUTURE / PLANNED` | WebSockets server in Spring Boot updating driver coordinates on frontend map. |
| Persistence (Route History DB) | Data Layer | `FUTURE / PLANNED` | Spring Data JPA / PostgreSQL integration saving `OptimizationResponse` JSON records. |
| User Auth & Multi-Tenancy | Security | `FUTURE / PLANNED` | Spring Security + JWT authentication for multi-tenant logistics companies. |

---

## Connection Points for Next Features

### 1. Adding Vehicle & Job Skills
- **Goal**: Ensure heavy cargo is only assigned to heavy trucks (`refrigerated`, `heavy_truck`).
- **Connection**:
  1. Update `VehicleRequest` and `DeliveryRequest` DTOs with `Set<String> skills`.
  2. In [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java), call `vehicleBuilder.addSkill(...)` and `deliveryBuilder.addRequiredSkill(...)`.

### 2. Adding Route History Database
- **Goal**: Persist past route optimizations for analytics and audit trails.
- **Connection**:
  1. Add `spring-boot-starter-data-jpa` dependency to `routing-backend/pom.xml`.
  2. Create `@Entity RouteHistoryEntity` in a new package `com.linkedit.routing.entity`.
  3. Call `routeHistoryRepository.save(response)` in [`OptimizationService.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/service/OptimizationService.java) after solution mapping.
