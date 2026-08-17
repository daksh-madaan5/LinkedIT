# 08. jsprit Deep Dive — Engine Abstractions & Domain Models

This document explains the internal concepts, domain models, and algorithmic components of **jsprit** (`[JSPRIT]`) as embedded in `jsprit-core`.

---

## 1. What is jsprit?

`jsprit` is an open-source Java library created by GraphHopper for solving rich Vehicle Routing Problems (VRP). It uses a powerful **Ruin & Recreate** metaheuristic framework (specifically Large Neighborhood Search - LNS) to find high-quality solutions for complex routing problems in seconds.

---

## 2. Core jsprit Domain Classes

```text
                        VehicleRoutingProblem
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
    Location                 VehicleImpl                AbstractJob
 (id, Coordinate)                 │                      (Delivery)
                                  ▼                        │
                           VehicleTypeImpl                 ▼
                         (CapacityDimension)       (SizeDimension, ServiceTime)
```

### Domain Model Dictionary

| jsprit Class | Ownership Tag | Description | LinkedIT Mapping |
| :--- | :--- | :--- | :--- |
| `VehicleRoutingProblem` | `[JSPRIT]` | The master container holding all vehicles, jobs, locations, fleet size rules, and transport cost matrix. | Built in [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L30) |
| `Location` | `[JSPRIT]` | Immutable location object containing an ID string and a 2D `Coordinate(x, y)` where $x = \text{longitude}$ and $y = \text{latitude}$. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L69-L74) |
| `VehicleImpl` | `[JSPRIT]` | Concrete vehicle instance assigned a `VehicleTypeImpl`, `startLocation`, `endLocation`, and return-to-depot policy. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L41-L46) |
| `VehicleTypeImpl` | `[JSPRIT]` | Defines vehicle physical properties: capacity dimensions, cost per distance unit, fixed costs. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L35-L38) |
| `Delivery` | `[JSPRIT]` | Subclass of `AbstractJob` representing a delivery from a depot to a customer location. Has size dimensions (demand), service time, priority, and time window. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L50-L60) |
| `VehicleRoute` | `[JSPRIT]` | Represents a single vehicle's active route schedule, including start activity, tour activities (jobs), and end activity. | [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L32) |
| `TourActivity` | `[JSPRIT]` | Individual stop along a route (`JobActivity` or Start/End activity). Has arrival time (`getArrTime()`) and end time (`getEndTime()`). | [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L35-L48) |
| `VehicleRoutingProblemSolution` | `[JSPRIT]` | Contains the complete output: list of active `VehicleRoute` objects, collection of `unassignedJobs`, and overall solution `cost`. | [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L26) |

---

## 3. Core jsprit Algorithm Components

```text
               Jsprit.Builder.newInstance(problem).buildAlgorithm()
                                        │
                                        ▼
                             VehicleRoutingAlgorithm
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
                 Ruin Strategies               Recreate Strategies
              (Radial, Random Ruin)          (Best, Regret Insertion)
                        │                               │
                        └───────────────┬───────────────┘
                                        ▼
                             Solution Cost Calculator
                                        │
                                        ▼
                            Acceptance & Termination
                            (200 Iterations Max)
```

### Component Breakdown

1. **`Jsprit.Builder`**: Factory class that constructs a pre-configured `VehicleRoutingAlgorithm` with default ruin/recreate strategies, strategy selectors, solution acceptors, and cost calculators tuned for standard VRPs.
2. **`VehicleRoutingTransportCosts`**: Interface defining matrix lookup methods:
   - `getDistance(from, to, departureTime, vehicle)`
   - `getTransportTime(from, to, departureTime, driver, vehicle)`
   - `getTransportCost(from, to, departureTime, driver, vehicle)`
3. **`SolutionAnalyser`**: Analysis tool in `jsprit-core` used by [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L27) to compute route load progression (`getLoadRightAfterActivity`), beginning loads (`getLoadAtBeginning`), delivered loads (`getLoadDelivered`), and exact travel distances (`getDistance`).

---

## 4. JSprit Capabilities vs LinkedIT Application Code

It is vital to distinguish what is provided natively by jsprit versus what we built in LinkedIT:

```text
[JSPRIT Capability]
- Ruin & Recreate optimization algorithm
- Time window constraint calculation
- Solution cost calculations & SolutionAnalyser
- Fleet size enforcement algorithms

[LINKED IT Application Code]
- Spring Boot REST Controller & HTTP JSON handling
- OSRM HTTP Table API & Route API integration
- Coordinate deduplication (RoutingLocations)
- Custom Request Validator & Response GeoJSON Mapper
```
