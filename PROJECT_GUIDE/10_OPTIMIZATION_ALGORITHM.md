# 10. Optimization Algorithm — Ruin & Recreate Metaheuristic

This document explains how jsprit (`[JSPRIT]`) solves the Vehicle Routing Problem using the **Ruin & Recreate** metaheuristic framework.

---

## 1. High-Level Metaheuristic Concept

Finding the globally optimal route for a VRP with multiple vehicles and capacity constraints is an **NP-hard** problem. Trying every possible route combination (brute-force enumeration) would take years even for 20 delivery locations.

Instead of brute force, jsprit uses a **Large Neighborhood Search (LNS)** metaheuristic based on **Ruin & Recreate**:

```text
 1. Construction Phase
    Build an Initial Solution (e.g. using Best/Regret Insertion)
                      │
                      ▼
 2. Optimization Loop (Repeated for 200 Iterations)
    ┌────────────────────────────────────────────────────────┐
    │                                                        │
    │  [RUIN]  Destroy part of the current solution          │
    │          (Remove a percentage of jobs from routes)     │
    │                                                        │
    │  [RECREATE] Re-insert unassigned jobs back into routes │
    │             using regret or best insertion heuristics  │
    │                                                        │
    │  [EVALUATE] Calculate solution objective cost          │
    │                                                        │
    │  [ACCEPT/REJECT] Accept new solution if cheaper or     │
    │                  meets simulated annealing criteria    │
    │                                                        │
    └──────────────────────────┬─────────────────────────────┘
                               │
                               ▼
 3. Output Best Solution Found
```

---

## 2. Ruin Strategies

A **Ruin strategy** removes a subset of jobs from existing vehicle routes to open up opportunities for better re-arrangements:

- **Random Ruin**: Randomly picks $k$ jobs and removes them from their assigned vehicle routes.
- **Radial Ruin**: Selects a target job and removes all neighboring jobs within a spatial radius. This helps break localized route tangles.

---

## 3. Recreate (Insertion) Strategies

A **Recreate strategy** takes the jobs removed by Ruin (plus any unassigned jobs) and attempts to re-insert them into vehicle routes:

- **Best Insertion**: For each job, evaluates all possible insertion positions across all vehicles and inserts the job into the position that causes the smallest cost increase.
- **Regret Insertion**: Calculates the difference ("regret") between inserting a job into its best position versus its 2nd-best (or $n$-th best) position. Jobs with high regret are inserted first because delaying them severely penalizes the route cost later.

---

## 4. Objective Function & Cost Calculation

jsprit evaluates solution quality using a mathematical **Objective Function**:

$$\text{Total Cost} = \sum_{\text{routes}} \text{Transport Cost} + \sum_{\text{unassigned}} \text{Unassigned Job Penalty}$$

In LinkedIT:
- `VehicleTypeImpl` sets `costPerDistance = 0.001` ([`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L37)).
- `RoutingCostProvider` supplies transport distances and times.
- Unassigned jobs carry heavy automatic cost penalties so that jsprit will prioritize assigning jobs to vehicles whenever capacity permits.

---

## 5. Iterations & Termination

In [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java#L15), the iteration count is set to:
```java
static final int DEVELOPMENT_ITERATIONS = 200;
```
For 200 iterations, jsprit executes the Ruin $\rightarrow$ Recreate $\rightarrow$ Accept loop, keeping track of the best solution encountered. At iteration 200, `Solutions.bestOf(solutions)` returns the optimal solution.
