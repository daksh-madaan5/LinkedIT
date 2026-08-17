# 04. Repository Structure — Multi-Module Layout

This document explains the physical organization of the LinkedIT workspace repository, detailing the purpose of every major file and directory.

---

## 1. Directory Tree Overview

```text
LinkedIT/
├── .editorconfig          # Code style and formatting rules (indentation, line endings)
├── .gitignore             # Git exclusion rules for Maven build target directories and IDE files
├── LICENSE.md             # Apache License 2.0 (Upstream GraphHopper / jsprit license)
├── NOTICE.md              # Copyright notice for GraphHopper GmbH
├── README.md              # Project quickstart guide and architecture overview
├── pom.xml                # Master Maven parent POM (aggregates modules and dependency versions)
│
├── jsprit-core/           # [JSPRIT] Embedded optimization algorithm engine sub-module
│   ├── pom.xml            # jsprit-core module POM
│   └── src/               # Core VRP data structures, ruin & recreate algorithms, analysis tools
│       ├── main/java/com/graphhopper/jsprit/core/
│       └── test/java/com/graphhopper/jsprit/core/
│
└── routing-backend/       # [LINKED IT] Spring Boot web API application sub-module
    ├── pom.xml            # routing-backend module POM (depends on jsprit-core)
    └── src/
        ├── main/
        │   ├── java/com/linkedit/routing/
        │   │   ├── RoutingBackendApplication.java # Main Spring Boot entry point
        │   │   ├── controller/   # REST API Endpoints & ApiExceptionHandler
        │   │   ├── dto/          # Request & Response Records
        │   │   ├── exception/    # Custom Domain Exceptions
        │   │   ├── optimization/ # Jsprit Problem & Solution Mappers, JspritOptimizer
        │   │   ├── routing/      # CrowFly & OSRM Routing Cost & Geometry Providers
        │   │   ├── service/      # OptimizationService orchestrator
        │   │   └── validation/   # OptimizationRequestValidator
        │   └── resources/
        │       └── application.properties # Server port & routing configuration properties
        └── test/
            └── java/com/linkedit/routing/ # Unit, Integration, & Controller tests
```

---

## 2. Distinction: `jsprit-core` vs `routing-backend`

Understanding the boundary between these two modules is **critical** for safely working on this project:

```text
                      master pom.xml
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
       jsprit-core                   routing-backend
 ┌──────────────────────┐        ┌──────────────────────┐
 │ [JSPRIT Engine]      │        │ [LINKED IT Application]│
 │                      │        │                      │
 │ Generic VRP Library  │◄───────│ Spring Boot REST API │
 │ Mathematical Solvers │        │ Request Validation   │
 │ Ruin & Recreate      │        │ DTO Mapping Layer    │
 │ Solution Analysis    │        │ OSRM Integration     │
 └──────────────────────┘        └──────────────────────┘
```

### Module Responsibilities Breakdown

| Module | Ownership Tag | Purpose | Who Uses It | Should You Modify It? |
| :--- | :--- | :--- | :--- | :--- |
| **`jsprit-core`** | `[JSPRIT]` | Embedded optimization library containing core data models (`VehicleRoutingProblem`, `VehicleRoute`, `TourActivity`) and algorithm execution logic (`Jsprit.Builder`). | Included as a Maven dependency by `routing-backend`. | **DO NOT MODIFY.** Treat as an external library. All application customizations belong in `routing-backend`. |
| **`routing-backend`** | `[LINKED IT]` | LinkedIT Spring Boot application containing all Web APIs, request validation, domain DTOs, OSRM client integration, and mapping logic. | External HTTP Clients, Web Frontends, Dispatchers. | **YES.** This is where all new features, API changes, and custom rules are added. |

---

## 3. Key Package Descriptions in `routing-backend`

All application source files reside under `routing-backend/src/main/java/com/linkedit/routing/`:

### A. `controller`
- [`OptimizationController.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/OptimizationController.java): Exposes `POST /api/optimize`.
- [`ApiExceptionHandler.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/ApiExceptionHandler.java): Global `@RestControllerAdvice` handling validation and routing exceptions, returning formatted HTTP status codes.

### B. `dto`
- `dto/request`: Contains immutable records for incoming JSON payloads (`OptimizationRequest`, `VehicleRequest`, `DeliveryRequest`, `LocationRequest`, `TimeWindowRequest`).
- `dto/response`: Contains immutable records for outgoing JSON responses (`OptimizationResponse`, `RouteResponse`, `StopResponse`, `OptimizationSummary`, `RouteGeometry`).

### C. `validation`
- [`OptimizationRequestValidator.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/validation/OptimizationRequestValidator.java): Validates request business rules before optimization begins.

### D. `service`
- [`OptimizationService.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/service/OptimizationService.java): Master service orchestrating validation, matrix loading, problem mapping, optimization, solution mapping, and geometry enrichment.

### E. `optimization`
- [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java): Translates application DTOs into jsprit `VehicleRoutingProblem`.
- [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java): Configures and runs the jsprit `VehicleRoutingAlgorithm`.
- [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java): Translates jsprit `VehicleRoutingProblemSolution` back into application response DTOs.

### F. `routing`
- [`RoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingCostProvider.java): Interface for matrix travel cost generation.
- [`CrowFlyRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java): Offline Great-Circle cost provider.
- [`OsrmRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmRoutingCostProvider.java): OSRM Table matrix cost provider.
- [`OsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmClient.java) & [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java): HTTP client for OSRM REST calls.
- [`RoutingLocations.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocations.java): Deduplicates coordinates into a deterministic indexed list.
- [`RouteGeometryProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RouteGeometryProvider.java): Interface for resolving final GeoJSON route polylines.
