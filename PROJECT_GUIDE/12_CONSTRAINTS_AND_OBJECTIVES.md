# 12. Constraints and Objectives — Optimization Rules

This document details the mathematical rules, hard constraints, soft constraints, and objective cost functions enforced by LinkedIT during route optimization.

---

## 1. Hard Constraints vs Soft Constraints

In VRP optimization:
- **Hard Constraints**: Rules that must **never** be violated. If assigning a job to a vehicle breaks a hard constraint, the assignment is mathematically forbidden.
- **Soft Constraints**: Preferences that can be violated, but incur a cost penalty in the objective function.

```text
 ┌────────────────────────────────────────────────────────┐
 │                   HARD CONSTRAINTS                     │
 │  - Vehicle Capacity Dimension 0                        │
 │  - Finite Vehicle Fleet Count                          │
 │  - Customer Time Windows (start <= arrival <= end)     │
 │  - Coordinate Validity Ranges                          │
 └────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────┐
 │                 OBJECTIVE / COST RULES                 │
 │  - Total Transport Distance (metres)                   │
 │  - Unassigned Job Penalties                            │
 │  - Job Priority Weights (1 = Highest, 10 = Lowest)     │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Implemented Constraints Matrix

| Constraint / Objective Rule | Classification | Implementation Status | How It Is Implemented | Source Location |
| :--- | :--- | :--- | :--- | :--- |
| **Vehicle Capacity** | Hard Constraint | `IMPLEMENTED` | Enforced by jsprit capacity dimension 0. Total job demands on route cannot exceed vehicle capacity. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L36) |
| **Finite Fleet Size** | Hard Constraint | `IMPLEMENTED` | `FleetSize.FINITE` prevents jsprit from creating extra vehicles beyond the input array. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L31) |
| **Time Windows** | Hard Constraint | `IMPLEMENTED` | `TimeWindow.newInstance(start, end)` enforces arrival within specified time window. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L57) |
| **Job Priorities** | Soft / Objective Rule | `IMPLEMENTED` | Priority values 1 through 10 guide jsprit insertion order preference. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L55) |
| **Transport Distance** | Objective Cost | `IMPLEMENTED` | Distance in metres added to solution cost via `costPerDistance = 0.001`. | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L37) |
| **Vehicle Skills / Driver Certifications** | Hard Constraint | `NOT IMPLEMENTED` / `FUTURE` | Native `JSprit capability` using `Skills`, but not exposed in LinkedIT DTOs. | Planned for future release |
| **Max Route Duration / Distance** | Hard Constraint | `NOT IMPLEMENTED` / `FUTURE` | Native `JSprit capability` using `HardRouteConstraint`, but not exposed in LinkedIT DTOs. | Planned for future release |
| **Pickup & Delivery (Shipments)** | Hard Constraint | `NOT IMPLEMENTED` / `FUTURE` | Native `JSprit capability` using `Shipment`, but not exposed in LinkedIT DTOs. | Planned for future release |

---

## 3. How Vehicle Capacity Works

Each vehicle defines a capacity:
```json
{"id": "V1", "capacity": 50}
```
Each delivery defines a demand:
```json
{"id": "D1", "demand": 18}
```
When `JspritProblemMapper` constructs the problem:
1. `VehicleTypeImpl` registers capacity dimension `0` with value `50`.
2. `Delivery` job registers size dimension `0` with value `18`.
3. During every insertion attempt, jsprit's `CapacityConstraint` checks if $\sum \text{demands} \le 50$. If false, insertion into that route is rejected.

---

## 4. How Time Windows Work

Each delivery can define an optional time window in seconds from start of day:
```json
"timeWindow": {"start": 3600.0, "end": 7200.0}
```
- If vehicle arrives at $t = 3000s$ (before $start = 3600s$), the driver **waits** $600s$ until $t = 3600s$ before servicing the job.
- Departure time is $t_{depart} = \max(t_{arrival}, start) + \text{serviceDuration}$.
- If vehicle arrives at $t > 7200s$, the time window is violated and jsprit rejects the route sequence.

---

## 5. Where to Add Future Custom Constraints

If you need to add custom business rules (e.g. maximum driving hours per driver, hazmat material restrictions, or vehicle skills):

1. **Native jsprit Constraints**: Implement jsprit's `HardRouteConstraint` or `HardActivityConstraint` interfaces in `routing-backend`.
2. **Register via ConstraintManager**: In [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java#L19), retrieve the algorithm's `ConstraintManager` and register your custom constraint before running `searchSolutions()`.
