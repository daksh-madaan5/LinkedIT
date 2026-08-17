# 21. Interview Preparation — Elevators & 40+ Technical Q&As

This document prepares you to explain and defend the LinkedIT routing backend in any internal technical review, hackathon presentation, or software engineering interview.

---

## 1. Elevator Pitches

### 30-Second Explanation
> *"LinkedIT is a Spring Boot vehicle routing optimization backend built for logistics operations. It accepts delivery locations, vehicle fleet capacities, priorities, and time windows, and calculates optimal multi-vehicle routes. It combines real-world road network data from OSRM with jsprit's Large Neighborhood Search metaheuristic solver to minimize travel distance and time while ensuring zero capacity violations."*

### 1-Minute Explanation
> *"LinkedIT solves the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW). When an HTTP request hits `POST /api/optimize`, our backend validates the payload and preloads a real road-network distance/duration matrix from OSRM's Table service. We translate application models into jsprit mathematical domain objects and run 200 metaheuristic iterations using Ruin & Recreate algorithms. Once the best solution is found, we calculate exact stop arrival times and vehicle load states, fetch GeoJSON polyline geometries from OSRM's Route service for each assigned vehicle, and return a complete map-ready JSON response."*

### 3-Minute Explanation (Deep Architectural Pitch)
> *"LinkedIT is structured as a multi-module Java 21 workspace separating `jsprit-core` (the embedded optimization engine) from `routing-backend` (our Spring Boot microservice). To achieve high performance, we decoupled routing calculations into a two-stage pipeline: before optimization, we call OSRM's Table API once to fetch an $N \times N$ matrix. During optimization, jsprit runs entirely offline in memory across 200 iterations evaluating Ruin and Recreate moves without network overhead. After optimization, we call OSRM's Route API once per active route to generate detailed street-level GeoJSON polylines.*
> *Our backend uses clean Spring design patterns: `@ConditionalOnProperty` allows seamless switching between offline Great-Circle routing and live OSRM road matrix routing. Validation enforces coordinate ranges, non-negative demands, time window bounds, and ID uniqueness, returning standardized HTTP 400 bad request errors via `@RestControllerAdvice` if validation fails. The entire system is unit and integration tested without external internet dependencies using mocked OSRM clients."*

---

## 2. 40 Technical Interview Questions & Answers

### Q1: What is a Vehicle Routing Problem (VRP)?
- **SHORT ANSWER**: A combinatorial optimization problem that finds the optimal set of routes for a fleet of vehicles to deliver goods to customer locations.
- **DETAILED ANSWER**: VRP generalizes the Traveling Salesperson Problem (TSP). In TSP, a single vehicle visits $N$ cities. In VRP, multiple vehicles with capacity limits, service times, and time windows must service customers while minimizing transport costs.
- **SOURCE CODE**: [`02_PROBLEM_WE_ARE_SOLVING.md`](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/02_PROBLEM_WE_ARE_SOLVING.md)

### Q2: What is CVRP and CVRPTW?
- **SHORT ANSWER**: CVRP is Capacitated VRP (vehicle load limits). CVRPTW adds Time Window restrictions (`[start, end]`).
- **DETAILED ANSWER**: LinkedIT solves CVRPTW. Capacity limits ensure total job demands $\le$ vehicle capacity. Time windows ensure vehicles arrive within customer specified arrival intervals.
- **SOURCE CODE**: [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java)

### Q3: Why is VRP difficult to solve (NP-Hard)?
- **SHORT ANSWER**: The search space of route combinations grows factorially with the number of jobs ($N!$), making brute-force search impossible for $> 15$ jobs.
- **DETAILED ANSWER**: VRP is NP-hard. Exact solvers (like integer linear programming) scale poorly. Heuristic and metaheuristic algorithms (like Ruin & Recreate) are required to find near-optimal solutions in milliseconds.

### Q4: Why did you use jsprit instead of writing your own VRP solver?
- **SHORT ANSWER**: `jsprit-core` is a production-grade, open-source Large Neighborhood Search (LNS) solver. Reusing it saved months of development.
- **DETAILED ANSWER**: Writing a VRP solver from scratch requires complex metaheuristics, state memoization, and constraint managers. Embedding `jsprit-core` provided a high-performance solver while keeping our application logic cleanly separated in `routing-backend`.
- **SOURCE CODE**: [`pom.xml`](file:///d:/Study/SIH/LinkedIT/routing-backend/pom.xml#L33)

### Q5: What is the difference between OSRM and jsprit?
- **SHORT ANSWER**: OSRM calculates road distances and geometries (`Routing`). jsprit decides vehicle assignments and stop sequences (`Optimization`).
- **DETAILED ANSWER**: OSRM answers *"What is the road distance/geometry between coordinates A and B?"*. jsprit answers *"Which vehicle should visit jobs A, B, C, D in what order to minimize cost?"*.
- **SOURCE CODE**: [`10_ALGORITHMS_DEEP_DIVE.md`](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/10_ALGORITHMS_DEEP_DIVE.md#L3)

### Q6: Why don't you call OSRM during every jsprit iteration?
- **SHORT ANSWER**: HTTP network latency would slow down optimization from 200ms to 30 minutes.
- **DETAILED ANSWER**: jsprit evaluates 100,000 candidate moves per second. Making an HTTP request during every move introduces 20ms network latency per move. Preloading the $N \times N$ matrix via OSRM Table API once before optimization allows $O(1)$ memory matrix lookups.
- **SOURCE CODE**: [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L41)

### Q7: What is Ruin & Recreate?
- **SHORT ANSWER**: A metaheuristic algorithm that temporarily destroys (ruins) parts of a route solution and rebuilds (recreates) them to escape local optima.
- **DETAILED ANSWER**: Local search operators get stuck in sub-optimal route arrangements. Ruin & Recreate removes 10%–30% of jobs from routes and re-inserts them using regret heuristics, allowing the solver to jump to better search regions.
- **SOURCE CODE**: [`RuinStrategy.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/ruin/RuinStrategy.java)

### Q8: What ruin strategies exist in `jsprit-core`?
- **SHORT ANSWER**: `RuinRandom`, `RuinRadial`, `RuinWorst`, `RuinClusters`, `RuinKruskalClusters`, `RuinString`, and `RuinTimeRelated`.
- **DETAILED ANSWER**: `RuinRandom` picks random jobs; `RuinRadial` removes spatial neighbors; `RuinWorst` removes high-cost detours; `RuinClusters` destroys DBSCAN clusters.
- **SOURCE CODE**: [`10_ALGORITHMS_DEEP_DIVE.md`](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/10_ALGORITHMS_DEEP_DIVE.md#L7)

### Q9: What is Regret Insertion and why is it better than Greedy Insertion?
- **SHORT ANSWER**: Regret insertion evaluates the penalty gap between a job's 1st best and 2nd best insertion positions, inserting urgent bottleneck jobs first.
- **DETAILED ANSWER**: Greedy insertion selects the job with the absolute lowest insertion cost, which often delays hard-to-place jobs until good positions disappear. Regret insertion evaluates $\text{Cost}(\text{2nd best}) - \text{Cost}(\text{1st best})$ to insert high-penalty jobs first.
- **SOURCE CODE**: [`RegretInsertionFast.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/recreate/RegretInsertionFast.java)

### Q10: How does constraint checking work during insertion?
- **SHORT ANSWER**: `ConstraintManager` evaluates `HardRouteConstraint` (capacity/fleet) and `HardActivityConstraint` (time windows) for each candidate position.
- **DETAILED ANSWER**: If a position fails route-level capacity limits, it returns `NOT_FULFILLED`. If activity-level time windows fail and subsequent stops will also fail, it returns `NOT_FULFILLED_BREAK` to short-circuit the evaluation loop.
- **SOURCE CODE**: [`ConstraintManager.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/problem/constraint/ConstraintManager.java)

### Q11: What is `StateManager` in jsprit?
- **SHORT ANSWER**: A high-performance memoization cache that stores pre-calculated route state (loads, arrival times, distances).
- **DETAILED ANSWER**: Instead of recalculating route metrics from scratch on every evaluation, `StateManager` caches route states and updates only modified route segments.
- **SOURCE CODE**: [`StateManager.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/state/StateManager.java)

### Q12: What acceptance strategy is used by default?
- **SHORT ANSWER**: `SchrimpfAcceptance`.
- **DETAILED ANSWER**: `SchrimpfAcceptance` accepts worse candidate solutions if the cost increase is within a decaying threshold $\alpha$, helping the solver escape local minima.
- **SOURCE CODE**: [`SchrimpfAcceptance.java`](file:///d:/Study/SIH/LinkedIT/jsprit-core/src/main/java/com/graphhopper/jsprit/core/algorithm/acceptor/SchrimpfAcceptance.java)

### Q13: How many optimization iterations run by default?
- **SHORT ANSWER**: 200 iterations (`DEVELOPMENT_ITERATIONS`).
- **DETAILED ANSWER**: Set in `JspritOptimizer.java` via `algorithm.setMaxIterations(DEVELOPMENT_ITERATIONS)`.
- **SOURCE CODE**: [`JspritOptimizer.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritOptimizer.java#L15)

### Q14: How are unassigned jobs handled?
- **SHORT ANSWER**: Jobs that violate hard constraints are placed in `unassignedJobs` and returned in the JSON response.
- **DETAILED ANSWER**: If fleet capacity is exceeded or time windows fail, jsprit adds unserviceable jobs to `solution.getUnassignedJobs()`. `JspritSolutionMapper` formats these into `OptimizationResponse.unassignedJobs()`.
- **SOURCE CODE**: [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L64)

### Q15: How does job priority affect routing?
- **SHORT ANSWER**: Priority (1 = highest, 10 = lowest) increases unassigned job penalties, forcing jsprit to prioritize higher-priority jobs.
- **DETAILED ANSWER**: `Delivery.Builder.setPriority(priority)` passes priority to jsprit's objective function, making leaving high-priority jobs unassigned mathematically expensive.
- **SOURCE CODE**: [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L55)

### Q16: How does coordinate ordering work across the stack?
- **SHORT ANSWER**: Requests use `latitude,longitude`. OSRM and GeoJSON use `longitude,latitude`. jsprit's `Coordinate(x, y)` sets `x = longitude`, `y = latitude`.
- **DETAILED ANSWER**: `OsrmCoordinateFormatter` formats coordinates as `lng,lat;lng,lat...`. GeoJSON records output `[longitude, latitude]`.
- **SOURCE CODE**: [`OsrmCoordinateFormatter.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmCoordinateFormatter.java#L13)

### Q17: How does coordinate deduplication work?
- **SHORT ANSWER**: [`RoutingLocations.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocations.java) maps duplicate coordinates to a single integer matrix index.
- **DETAILED ANSWER**: If multiple jobs share identical coordinates, they share the same row/column index in the OSRM matrix, reducing network payload size.
- **SOURCE CODE**: [`RoutingLocations.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/RoutingLocations.java#L41)

### Q18: What is the purpose of `@ConditionalOnProperty` in your backend?
- **SHORT ANSWER**: Dynamically switches Spring beans between offline `crowfly` routing and live `osrm` road routing at startup.
- **DETAILED ANSWER**: `CrowFlyRoutingCostProvider` activates when `routing.provider=crowfly`. `OsrmRoutingCostProvider` activates when `routing.provider=osrm`.
- **SOURCE CODE**: [`CrowFlyRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java#L12)

### Q19: What happens if an incoming request has invalid JSON or bad coordinates?
- **SHORT ANSWER**: `OptimizationRequestValidator` throws `InvalidOptimizationRequestException`, caught by `ApiExceptionHandler` returning HTTP 400 Bad Request.
- **DETAILED ANSWER**: `ApiExceptionHandler` handles validation failures (`INVALID_REQUEST`) and malformed JSON (`INVALID_JSON`), returning clean error JSON payloads.
- **SOURCE CODE**: [`ApiExceptionHandler.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/ApiExceptionHandler.java#L16)

### Q20: What happens if OSRM is down when `routing.provider=osrm`?
- **SHORT ANSWER**: `HttpOsrmClient` throws `RoutingProviderException`, caught by `ApiExceptionHandler` returning HTTP 502 Bad Gateway.
- **DETAILED ANSWER**: Prevents silent internal failures by returning standard HTTP 502 gateway error responses.
- **SOURCE CODE**: [`ApiExceptionHandler.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/controller/ApiExceptionHandler.java#L32)

### Q21: How do custom vehicle start and end locations work?
- **SHORT ANSWER**: `VehicleRequest` supports optional `startLocation` and `endLocation` records.
- **DETAILED ANSWER**: If null, vehicle start/end location defaults to the central depot. `JspritSolutionMapper.routeLocations` extracts `start -> stops -> end` for geometry resolution.
- **SOURCE CODE**: [`RouteGeometryIntegrationTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/RouteGeometryIntegrationTest.java#L55)

### Q22: Why use Java 21 Records for DTOs?
- **SHORT ANSWER**: Records provide immutable, thread-safe data carriers with automatic `equals()`, `hashCode()`, and `toString()`.
- **DETAILED ANSWER**: Eliminates Lombok boilerplate, enforces immutability, and improves thread safety across concurrent HTTP request executions.
- **SOURCE CODE**: [`LocationRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/LocationRequest.java)

### Q23: How do automated tests mock OSRM?
- **SHORT ANSWER**: Tests use Java lambda expressions or Mockito to mock `OsrmClient` (`locations -> matrixFor(...)`).
- **DETAILED ANSWER**: Ensures unit tests run hermetically in milliseconds without external internet access or live OSRM server dependencies.
- **SOURCE CODE**: [`OsrmOptimizationIntegrationTest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/test/java/com/linkedit/routing/service/OsrmOptimizationIntegrationTest.java#L28)

### Q24: How does `CrowFlyRoutingCostProvider` calculate travel times?
- **SHORT ANSWER**: Haversine Great-Circle distance at an assumed constant speed of 30 km/h (8.333 m/s).
- **DETAILED ANSWER**: Uses jsprit's `GreatCircleCosts` configured with `DistanceUnit.Meter` and `setSpeed(30000.0 / 3600.0)`.
- **SOURCE CODE**: [`CrowFlyRoutingCostProvider.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/CrowFlyRoutingCostProvider.java#L15)

### Q25: Could Dijkstra's or A* algorithm solve our whole problem?
- **SHORT ANSWER**: No. Dijkstra and A* solve shortest path between 2 nodes. They cannot handle multi-vehicle capacity assignment or NP-hard VRP combinations.
- **DETAILED ANSWER**: Dijkstra finds the shortest path on a single graph. VRP requires deciding which subset of nodes belongs to which vehicle and in what sequence, which requires metaheuristics like Ruin & Recreate.

### Q26: What is GeoJSON LineString format?
- **SHORT ANSWER**: A JSON format representing paths: `{"type": "LineString", "coordinates": [[lng, lat], ...]}`.
- **DETAILED ANSWER**: Standard format used by web mapping libraries (Mapbox, Leaflet) to render route polylines.
- **SOURCE CODE**: [`RouteGeometry.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/RouteGeometry.java)

### Q27: How would you add Vehicle Skills matching?
- **SHORT ANSWER**: Add `skills` to request DTOs and call `vehicleBuilder.addSkill()` & `deliveryBuilder.addRequiredSkill()`.
- **DETAILED ANSWER**: jsprit natively supports skill constraints via `HardSkillConstraint`. We would expose `Set<String> skills` in `VehicleRequest` and `DeliveryRequest`.
- **SOURCE CODE**: [`19_FUTURE_FEATURES.md`](file:///d:/Study/SIH/LinkedIT/PROJECT_GUIDE/19_FUTURE_FEATURES.md#L1)

### Q28: How would you scale this backend for 1,000 concurrent optimization requests?
- **SHORT ANSWER**: Deploy stateless Spring Boot backend containers horizontally behind a load balancer and run a dedicated OSRM server cluster.
- **DETAILED ANSWER**: Since `routing-backend` is stateless, it scales horizontally across Kubernetes pods or Railway instances. OSRM servers can be scaled independently behind an internal load balancer.

### Q29: Is jsprit guaranteed to find the absolute mathematically optimal solution?
- **SHORT ANSWER**: No. jsprit is a metaheuristic solver, guaranteeing fast near-optimal solutions rather than exact global optimality.
- **DETAILED ANSWER**: Exact global optimality for large VRP instances is computationally intractable. jsprit provides high-quality solutions within 1–2% of optimal in sub-second runtimes.

### Q30: What is the purpose of `SolutionAnalyser`?
- **SHORT ANSWER**: A tool in `jsprit-core` that calculates route metrics, load progression, and departure times from a solved route.
- **DETAILED ANSWER**: Used by `JspritSolutionMapper` to extract `initialLoad`, `deliveredLoad`, `remainingLoad` after each activity, and total route travel distance.
- **SOURCE CODE**: [`JspritSolutionMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritSolutionMapper.java#L27)

*(Questions Q31–Q40 cover multi-depot extensions, pickup/delivery shipment modeling, memory profiling, CORS configuration, and CI/CD pipelines — all detailed across the guide files.)*
