# LinkedIT Routing Backend

LinkedIT is an SIH logistics-routing project that accepts depots, delivery vehicles, capacities, delivery demand, service times, priorities, and optional time windows, then returns optimized vehicle routes.

The current repository contains the backend optimization foundation. A React + Vite frontend will be added separately.

## Architecture

```text
React frontend (planned)
          ↓
POST /api/optimize
          ↓
Spring Boot routing-backend
          ↓
Validation and application DTOs
          ↓
Jsprit problem/solution mappers
          ↓
Configured routing costs (crow-fly or OSRM Table matrix)
          ↓
jsprit-core optimization engine
          ↓
Final route order
          ↓
Geometry provider (crow-fly LineString or OSRM Route)
          ↓
GeoJSON in OptimizationResponse
```

The dependency direction is strictly `routing-backend → jsprit-core`. Application-specific code is not added to jsprit internals.

## Repository Structure

```text
.
├── pom.xml
├── jsprit-core/        # Intact optimization library
└── routing-backend/    # Spring Boot API and application models
```

The upstream jsprit code remains licensed under Apache License 2.0; see `LICENSE.md` and `NOTICE.md`.

## Requirements

- Java 21
- Maven 3.6 or newer

## Build and Test

```text
mvn clean compile
mvn -pl routing-backend test
```

## Run

```text
mvn -pl routing-backend -am install -DskipTests
mvn -pl routing-backend spring-boot:run
```

The API is then available at:

```text
POST http://localhost:8080/api/optimize
```

Example request:

```json
{
  "depot": {
    "id": "DEPOT-1",
    "latitude": 20.2961,
    "longitude": 85.8245
  },
  "vehicles": [
    {
      "id": "V1",
      "capacity": 50
    }
  ],
  "jobs": [
    {
      "id": "D1",
      "latitude": 20.305,
      "longitude": 85.817,
      "demand": 18,
      "serviceDuration": 240,
      "priority": 2
    }
  ]
}
```

Routing defaults to offline great-circle distance and straight-line GeoJSON geometry. Set `routing.provider=osrm` and `routing.osrm.base-url=http://localhost:5000` to preload OSRM Table-service road distances and durations before optimization, then request actual road geometry once per final used route. See `routing-backend/README.md` for timeout, matrix-limit, and failure behavior.
