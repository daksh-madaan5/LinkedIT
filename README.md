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

## Frontend (React + Vite + TypeScript)

The React planning dashboard is located in `frontend/`:

```text
cd frontend
npm install
npm run dev
```

The web dashboard is then available at `http://localhost:5173`.

### Environment Configuration (Development & Production)

- **Backend CORS Allowed Origins (`CORS_ALLOWED_ORIGINS` / `cors.allowed-origins`)**:
  - Development Default: `http://localhost:5173,http://localhost:4173`
  - Production Example: `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.example`
  - Multiple origins can be comma-separated: `http://localhost:5173,https://app.example.com`

- **Frontend API Base URL (`VITE_API_BASE_URL`)**:
  - Development Default: `http://localhost:8080`
  - Production Example: `VITE_API_BASE_URL=https://api.yourlogisticsdomain.com`

Copy `frontend/.env.example` to `frontend/.env.local` to customize frontend variables for local development.

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

## Project Guide

For a complete beginner-friendly explanation of the project, architecture, backend, jsprit, OSRM, API, optimization flow, deployment, troubleshooting, and interview preparation, see:

[PROJECT_GUIDE](./PROJECT_GUIDE/00_START_HERE.md)

