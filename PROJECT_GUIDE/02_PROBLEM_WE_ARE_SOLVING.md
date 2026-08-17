# 02. Problem We Are Solving — VRP Fundamentals

To understand the LinkedIT codebase, you must first understand the classical operations research problem it solves: the **Vehicle Routing Problem (VRP)**.

---

## 1. What is the Vehicle Routing Problem?

The **Vehicle Routing Problem (VRP)** is a combinatorial optimization problem that asks:

> *"What is the optimal set of routes for a fleet of vehicles to deliver goods to a given set of customers?"*

VRP is a direct generalization of the famous **Traveling Salesperson Problem (TSP)**. In TSP, a single salesperson visits $N$ cities and returns home in the shortest distance. In VRP, we have **multiple vehicles**, vehicle **capacity restrictions**, and multiple **delivery requirements**.

### Key Sub-types of VRP

1. **CVRP (Capacitated Vehicle Routing Problem)**: Each vehicle has a maximum load capacity $C$. Each customer job requires a specific demand $d_i$. The sum of demands on any route cannot exceed $C$.
2. **VRPTW (Vehicle Routing Problem with Time Windows)**: Each customer job can only be serviced within a specific time window $[t_{start}, t_{end}]$. Arriving early forces the vehicle to wait; arriving late violates the constraint.
3. **CVRPTW (Capacitated VRP with Time Windows)**: Combines capacity constraints and time windows. **This is the primary mathematical model solved by LinkedIT.**

---

## 2. Core Concepts & Definitions

```text
                  Central Depot
                 (lat: 20.2961, lng: 85.8245)
                       │
        ┌──────────────┴──────────────┐
        │                             │
    Vehicle V1                    Vehicle V2
    (Capacity: 50 units)          (Capacity: 50 units)
        │                             │
  ┌─────┴─────┐                 ┌─────┴─────┐
  │           │                 │           │
Delivery A  Delivery B        Delivery C  Delivery D
Demand: 18  Demand: 16        Demand: 20  Demand: 12
Duration:4m Duration:5m       Duration:3m Duration:4m
```

### Concept Dictionary

- **Depot**: The central hub where vehicles start and finish their routes.
- **Vehicle**: A transport unit with a unique ID and finite capacity (e.g. 50 units).
- **Job / Delivery**: A customer request at a specific geographic coordinate requiring a specific quantity of goods (`demand`), taking a certain time to unload (`serviceDuration`), and optional `priority` or `timeWindow`.
- **Capacity**: The maximum non-divisible load a vehicle can carry.
- **Demand**: The load quantity consumed by a specific job.
- **Route**: An ordered sequence of stops assigned to a specific vehicle, starting at its start location, visiting zero or more jobs, and ending at its end location.
- **Stop**: An individual activity along a vehicle's route where unloading occurs.
- **Constraint**: A rule that must not be violated (e.g. total route demand $\le$ vehicle capacity).
- **Objective**: The mathematical goal being minimized by the solver (e.g. total transport distance + unassigned job penalties).
- **Unassigned Job**: A job that could not be assigned to any vehicle without violating hard constraints (e.g. total demand of all jobs exceeds total fleet capacity).

---

## 3. How LinkedIT Maps to VRP Concepts

In LinkedIT:

| VRP Mathematical Concept | LinkedIT Application Model | Source Code Reference |
| :--- | :--- | :--- |
| Central Origin | `LocationRequest depot` | [`OptimizationRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/OptimizationRequest.java) |
| Vehicle Fleet | `List<VehicleRequest> vehicles` | [`VehicleRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/VehicleRequest.java) |
| Vehicle Capacity | `int capacity` (Dimension index 0) | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L36) |
| Vehicle Start / End | `LocationRequest startLocation / endLocation` | [`VehicleRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/VehicleRequest.java#L7-L8) |
| Delivery Customer Job | `List<DeliveryRequest> jobs` | [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java) |
| Delivery Quantity | `int demand` (Dimension index 0) | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L53) |
| Service Unloading Time | `double serviceDuration` (seconds) | [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java#L9) |
| Delivery Priority | `Integer priority` (1 to 10) | [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java#L10) |
| Customer Time Window | `TimeWindowRequest timeWindow` | [`TimeWindowRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/TimeWindowRequest.java) |
| Travel Distance & Time | `RoutingCostProvider` (CrowFly or OSRM) | [`RoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingCostProvider.java) |

---

## 4. Concrete Example: Bhubaneswar Delivery Routing

Imagine a warehouse located at **Bhubaneswar Railway Station** (`DEPOT-1`: `20.2961, 85.8245`).

We have **2 vehicles**:
- Vehicle `V1` (Capacity = 30)
- Vehicle `V2` (Capacity = 30)

We have **3 delivery jobs**:
- `D1` (Patia): Demand = 15, Service Time = 5 mins (300s)
- `D2` (Jaydev Vihar): Demand = 20, Service Time = 4 mins (240s)
- `D3` (Old Town): Demand = 18, Service Time = 3 mins (180s)

### What jsprit Tries to Determine

Total demand $= 15 + 20 + 18 = 53$.
Since a single vehicle has a capacity of 30, **no single vehicle can service all 3 jobs** ($53 > 30$).
jsprit must split the jobs across `V1` and `V2`:
- Option A: `V1` takes `D1` (15) + `D2` (20)? Total demand $= 35 > 30$ (INVALID - Capacity Exceeded).
- Option B: `V1` takes `D1` (15) + `D3` (18)? Total demand $= 33 > 30$ (INVALID - Capacity Exceeded).
- Option C: `V1` takes `D2` (20) + `D3` (18)? Total demand $= 38 > 30$ (INVALID - Capacity Exceeded).
- Option D: `V1` takes `D1` (15) & `V2` takes `D2` (20) + `D3` (18)? Demand for `V1` $= 15 \le 30$; Demand for `V2` $= 38 > 30$ (INVALID).
- Option E: `V1` takes `D1` (15) + `D?` -> jsprit determines that 2 vehicles can carry at most `15 + 20` or `15 + 18` or `20 + 18`. To serve all 53 units, `V1` takes `D1` (15) and `V2` takes `D2` (20) or `D3` (18), leaving 1 job unassigned if capacity is insufficient, or assigning `D1+D2` to `V1` if capacity was larger.

jsprit automatically evaluates thousands of candidate routes to find the solution that maximizes assigned jobs while minimizing total travel distance and cost.
