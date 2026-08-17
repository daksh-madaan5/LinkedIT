# 23. Glossary — Beginner-Friendly Terminology

This glossary defines all domain-specific terms, mathematical concepts, and technology acronyms used throughout the LinkedIT project.

---

## Glossary Index

- **API (Application Programming Interface)**: A software interface allowing different applications (such as a React frontend and a Spring Boot backend) to communicate over HTTP using JSON payloads.
- **Activity (`TourActivity`)**: An individual event along a vehicle route, such as delivering cargo at a customer location (`JobActivity`), starting at a depot, or ending at a depot.
- **Capacity**: The maximum non-divisible weight, volume, or quantity of goods a vehicle can carry on a single route. Enforced as capacity dimension 0 in jsprit.
- **Constraint**: A mathematical rule or boundary condition that must be satisfied during route optimization (such as vehicle load capacity limits or customer time window bounds).
- **CVRP (Capacitated Vehicle Routing Problem)**: A classical VRP variant where vehicles have maximum carrying capacity restrictions and customers require specific delivery demands.
- **CVRPTW (Capacitated Vehicle Routing Problem with Time Windows)**: A VRP variant combining vehicle load capacities and customer arrival time windows. This is the primary problem solved by LinkedIT.
- **Demand**: The load quantity consumed by a specific customer delivery job.
- **Depot**: The central hub, warehouse, or origin point where vehicles start and complete their delivery routes.
- **DTO (Data Transfer Object)**: An immutable object (implemented via Java 21 `record`) used exclusively to carry data between software processes or network calls without containing business logic.
- **GeoJSON**: A standard JSON format for representing geographic features. LinkedIT returns route polylines as GeoJSON `LineString` objects (`{"type": "LineString", "coordinates": [[lng, lat], ...]}`).
- **Great-Circle Distance**: The shortest distance between two points on the surface of a sphere, calculated offline using latitude/longitude trigonometry (Haversine formula). Used in LinkedIT's `crowfly` mode.
- **Insertion Strategy**: An algorithmic heuristic (such as Best Insertion or Regret Insertion) that places unassigned jobs back into vehicle routes during optimization.
- **Job / Delivery**: A customer order at a specific geographic coordinate requiring delivery of goods.
- **jsprit**: An embedded, open-source Java library developed by GraphHopper for solving rich Vehicle Routing Problems using Ruin & Recreate metaheuristics.
- **LineString**: A GeoJSON geometry type consisting of an ordered list of two or more coordinate pairs representing a continuous path or route polyline on a map.
- **Metaheuristic**: An algorithmic framework designed to find high-quality solutions to complex NP-hard computational problems in a short time, without guaranteeing absolute global mathematical perfection.
- **NP-Hard**: A class of computational problems (including TSP and VRP) for which no known polynomial-time algorithm exists to find global exact solutions for large inputs.
- **Objective Function**: A mathematical cost formula minimized by the solver during optimization ($\text{Cost} = \text{Transport Distance Cost} + \text{Unassigned Job Penalties}$).
- **OSRM (Open Source Routing Machine)**: A high-performance C++ routing engine providing road network distances, travel durations, and GeoJSON polyline geometries from OpenStreetMap data.
- **Priority**: A numerical ranking (1 = highest, 10 = lowest) assigned to delivery jobs to guide insertion preference during route optimization.
- **Recreate Strategy**: The phase in Large Neighborhood Search where unassigned jobs are re-inserted into vehicle routes.
- **REST (Representational State Transfer)**: An architectural style for web APIs using standard HTTP methods (`GET`, `POST`) and stateless JSON exchanges.
- **Route**: An ordered sequence of stops assigned to a vehicle, starting at a start location, visiting customer jobs, and returning to an end location.
- **Ruin & Recreate**: A Large Neighborhood Search metaheuristic strategy that repeatedly destroys ("ruins") parts of a route solution and re-builds ("recreates") them to discover cheaper routes.
- **Service Duration**: The unloading or waiting time required at a delivery stop in seconds before the vehicle can depart to the next location.
- **SolutionAnalyser**: An analysis component in `jsprit-core` used to calculate vehicle load progression, delivered load, and route travel metrics.
- **Stop**: A specific delivery activity along a vehicle route.
- **Time Window**: An allowed time interval (`[start, end]`) in seconds from start of day during which a customer delivery must be initiated.
- **TSP (Traveling Salesperson Problem)**: A foundational optimization problem where a single salesperson must visit $N$ cities in the shortest possible distance and return home.
- **Unassigned Job**: A delivery job that could not be assigned to any available vehicle without violating hard constraints (such as vehicle capacity or time window bounds).
- **VRP (Vehicle Routing Problem)**: The general optimization problem of finding optimal route schedules for a fleet of vehicles servicing a set of customers.
- **WGS84**: World Geodetic System 1984, the standard geographic coordinate reference system using decimal latitude and longitude degrees.
