# 00. Start Here — Welcome to LinkedIT Routing Backend

Welcome to the **LinkedIT** project! This guide is written specifically to teach you this entire codebase from complete beginner level up to advanced source-code mastery.

Even if you are the lead developer on paper, assume you currently have zero deep knowledge of how Vehicle Routing Problems (VRP), optimization engines, OSRM road networks, or Spring Boot dependency configurations work together in this repository. By following this guide step by step, you will understand every line of code, every architectural decision, and be completely ready to extend the project or ace any technical interview about it.

---

## What is LinkedIT?

**LinkedIT** is a vehicle routing optimization system designed for modern logistics operations. Given a central depot, a fleet of delivery vehicles with specific capacity constraints, and a set of delivery jobs (with demands, service times, priorities, and optional time windows), LinkedIT automatically computes the optimal assignment of deliveries to vehicles and orders the stops to minimize total travel time and distance.

---

## What Problem Does It Solve?

In logistics, sending vehicles on unoptimized routes wastes fuel, increases driver costs, delays customer deliveries, and underutilizes vehicle capacity. Figuring out which vehicle should take which packages and in what sequence is a classic NP-hard computational problem known as the **Vehicle Routing Problem (VRP)** (specifically the **Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)**).

LinkedIT solves this by combining:
1. **Real-world Road Data (OSRM)**: Obtaining true driving distances and travel durations across real road networks.
2. **Advanced Metaheuristic Optimization (jsprit)**: Solving complex multi-vehicle constraint satisfaction problems in seconds.
3. **Clean RESTful Web API (Spring Boot)**: Accepting simple JSON payloads and returning formatted, map-ready routes with GeoJSON geometries.

---

## What Does the Backend Do?

The backend repository (`d:\Study\SIH\LinkedIT`) is a Java multi-module project comprising:
- `jsprit-core`: An embedded, unmodified open-source optimization engine.
- `routing-backend`: A Spring Boot web application that exposes REST APIs, validates requests, translates application domain models into optimization mathematical problems, executes optimization, fetches road geometries, and returns final route JSON.

---

## Core Infrastructure Dependencies: jsprit & OSRM

To understand LinkedIT, you must understand how `jsprit` and `OSRM` divide responsibilities:

| Infrastructure | Ownership Tag | Primary Role | When It Is Used |
| :--- | :--- | :--- | :--- |
| **jsprit** | `[JSPRIT]` | Algorithmic Optimization Engine | Searches thousands of route combinations using Ruin & Recreate metaheuristics to find optimal stop sequences. |
| **OSRM** | `[OSRM]` | Open Source Routing Machine | Calculates real road distances/durations between coordinates and generates map polyline geometry. |

### How jsprit and OSRM Work Together

```text
1. Application receives delivery locations
   │
2. [OSRM] Table API preloads all pairwise road distances & travel times into a matrix
   │
3. [JSPRIT] Uses the preloaded road matrix to evaluate route combinations offline (0 network calls during algorithm search)
   │
4. [JSPRIT] Produces the final ordered sequence of stops for each vehicle
   │
5. [OSRM] Route API is called ONCE per used route to fetch detailed road geometry (GeoJSON LineString)
   │
6. Backend returns the complete JSON response
```

---

## Mental Model: Request to Map Display

Here is how data flows through the complete system:

```text
                 USER / CLIENT
                      │
                      ▼
            React Frontend [FUTURE / PLANNED]
                      │
                      │ HTTP POST /api/optimize
                      ▼
         Spring Boot routing-backend [LINKED IT]
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
  Request Validation     Routing Provider Selection
  (OptimizationRequest)  (CrowFly or OSRM Table)
                                 │
                                 ▼
                     Distance & Time Matrix
                                 │
                                 ▼
                    jsprit Optimization Engine [JSPRIT]
                    (200 Metaheuristic Iterations)
                                 │
                                 ▼
                     Optimized Vehicle Routes
                                 │
                                 ▼
                     Geometry Provider [LINKED IT / OSRM]
                     (GeoJSON LineString Generation)
                                 │
                                 ▼
                     OptimizationResponse JSON
                      │
                      ▼
            React Map Display [FUTURE / FRONTEND]
```

> [!NOTE]
> **Status Summary**:
> - `POST /api/optimize`: `IMPLEMENTED`
> - `GET /api/health`: `NOT IMPLEMENTED`
> - React Frontend: `FUTURE / FRONTEND`
> - OSRM Integration: `IMPLEMENTED`
> - Crow-Fly Offline Mode: `IMPLEMENTED`

---

## What Happens When I Call `POST /api/optimize`?

1. **HTTP Entry**: Request enters [`OptimizationController.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/OptimizationController.java).
2. **Validation**: [`OptimizationRequestValidator.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/validation/OptimizationRequestValidator.java) verifies coordinates, vehicle capacities, demands, and time windows.
3. **Routing Matrix Preload**: [`RoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingCostProvider.java) prepares travel cost calculations:
   - In `crowfly` mode: Uses offline Great-Circle trigonometry assuming 30 km/h.
   - In `osrm` mode: Calls OSRM Table API (`/table/v1/driving/...`) to fetch real road distances (metres) and durations (seconds).
4. **jsprit Problem Construction**: [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java) translates request DTOs into a `VehicleRoutingProblem`.
5. **Optimization**: [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java) runs jsprit search strategies over 200 iterations to find the cheapest valid solution.
6. **Solution Mapping**: [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java) converts the best jsprit solution into application DTOs and extracts final ordered route coordinates.
7. **Geometry Enrichment**: [`RouteGeometryProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RouteGeometryProvider.java) attaches GeoJSON LineString coordinates to each assigned vehicle route.
8. **HTTP Response**: The controller returns `200 OK` with the complete JSON payload containing routes, unassigned jobs, and summary metrics.

---

## Recommended Learning Path

To master this project efficiently, read the documentation files in this exact sequence:

1. [01_PROJECT_OVERVIEW.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/01_PROJECT_OVERVIEW.md) — Problem context, business goals, and MVP capabilities.
2. [02_PROBLEM_WE_ARE_SOLVING.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/02_PROBLEM_WE_ARE_SOLVING.md) — Vehicle Routing Problem (VRP) fundamentals.
3. [03_TECH_STACK.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/03_TECH_STACK.md) — Technology matrix and dependency choices.
4. [04_REPOSITORY_STRUCTURE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/04_REPOSITORY_STRUCTURE.md) — Multi-module workspace organization.
5. [05_ARCHITECTURE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/05_ARCHITECTURE.md) — High-level and component architecture.
6. [06_REQUEST_TO_RESPONSE_FLOW.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/06_REQUEST_TO_RESPONSE_FLOW.md) — Step-by-step 13-stage request tracing.
7. [07_BACKEND_DEEP_DIVE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/07_BACKEND_DEEP_DIVE.md) — Exhaustive code walk-through of every backend class.
8. [08_JSPRIT_DEEP_DIVE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/08_JSPRIT_DEEP_DIVE.md) — Deep dive into jsprit engine abstractions.
9. [09_OSRM_DEEP_DIVE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/09_OSRM_DEEP_DIVE.md) — How OSRM road routing integration works.
10. [10_ALGORITHMS_DEEP_DIVE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/10_ALGORITHMS_DEEP_DIVE.md) — Comprehensive, source-code-level algorithmic teardown.
11. [ALGORITHM_CHEAT_SHEET.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/ALGORITHM_CHEAT_SHEET.md) — Rapid revision cheat sheet.
12. [14_API_REFERENCE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/14_API_REFERENCE.md) — Endpoint specifications and JSON samples.
13. [17_RUNNING_LOCALLY.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/17_RUNNING_LOCALLY.md) — Quickstart execution guide.
14. [20_CODE_CHANGE_GUIDE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/20_CODE_CHANGE_GUIDE.md) — How to safely add new features.
15. [21_INTERVIEW_PREPARATION.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/21_INTERVIEW_PREPARATION.md) — 40+ Questions and answers for technical rounds.
16. [24_FRONTEND_DEEP_DIVE.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/24_FRONTEND_DEEP_DIVE.md) — Complete React + Vite frontend architecture, data tables, and Leaflet map integration.
17. [25_UI_SPECIFICATION.md](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/25_UI_SPECIFICATION.md) — Complete UI sizing, dimensions, padding, colors, and layout metrics.


