# Algorithm Cheat Sheet — Quick Revision Guide

This cheat sheet provides a rapid revision summary of all key optimization concepts, algorithms, and source code references in LinkedIT.

---

## Quick Revision Table

| Concept | What is it? | Why do we use it? | Where in Code? |
| :--- | :--- | :--- | :--- |
| **VRP** | Vehicle Routing Problem | General problem of assigning customers to vehicle routes. | [`02_PROBLEM_WE_ARE_SOLVING.md`](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/02_PROBLEM_WE_ARE_SOLVING.md) |
| **CVRPTW** | Capacitated VRP with Time Windows | Specific mathematical VRP model solved by LinkedIT (Capacities + Time Windows). | [`10_ALGORITHMS_DEEP_DIVE.md`](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/10_ALGORITHMS_DEEP_DIVE.md#L1) |
| **Ruin & Recreate** | LNS Metaheuristic | Temporarily destroys (ruins) and rebuilds (recreates) routes to escape local optima. | [`RuinStrategy.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/ruin/RuinStrategy.java) |
| **Random Ruin** | Ruin Operator | Removes random jobs from routes to promote global search exploration. | [`RuinRandom.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/ruin/RuinRandom.java) |
| **Radial Ruin** | Ruin Operator | Removes geographically clustered jobs to untangle local spatial routes. | [`RuinRadial.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/ruin/RuinRadial.java) |
| **Worst Ruin** | Ruin Operator | Removes jobs contributing highest marginal transport cost. | [`RuinWorst.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/ruin/RuinWorst.java) |
| **Best Insertion** | Recreate Operator | Inserts a job into its cheapest feasible route position. | [`BestInsertion.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/recreate/BestInsertion.java) |
| **Regret Insertion** | Recreate Operator | Prioritizes inserting jobs with largest penalty gap between 1st and 2nd best positions. | [`RegretInsertionFast.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/recreate/RegretInsertionFast.java) |
| **ConstraintManager** | Constraint Evaluator | Hierarchically evaluates `HardRouteConstraint` and `HardActivityConstraint` rules. | [`ConstraintManager.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/problem/constraint/ConstraintManager.java) |
| **StateManager** | Memoization Cache | Stores route loads and arrival times to avoid $O(N)$ re-calculations. | [`StateManager.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/state/StateManager.java) |
| **SchrimpfAcceptance** | Acceptance Strategy | Accepts candidate solutions using decaying cost threshold to break local minima. | [`SchrimpfAcceptance.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/acceptor/SchrimpfAcceptance.java) |
| **OSRM Table API** | Road Matrix Preloader | Preloads $N \times N$ road distances & times before optimization for $10,000\times$ speedup. | [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L41) |
| **OSRM Route API** | Geometry Generator | Fetches GeoJSON road polyline ONCE per final route after optimization completes. | [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L71) |

---

## 3 Core Takeaways for Interviews

1. **Routing $\neq$ Optimization**: OSRM calculates road distances and polylines (`Routing`). jsprit determines which vehicle takes which jobs in what sequence (`Optimization`).
2. **Matrix Caching**: Preloading OSRM Table matrices before optimization turns $N$ network HTTP calls into $O(1)$ memory lookups during search, reducing runtimes from 30 minutes to 200ms.
3. **Regret Insertion Avoids Bottlenecks**: Regret insertion evaluates $c(2\text{nd best}) - c(1\text{st best})$ to insert urgent jobs first before their feasible positions disappear.
