# Routing Backend

This Spring Boot module exposes jsprit through the application-owned `POST /api/optimize` contract. It has no database or authentication dependency. Routing can use either offline great-circle costs or an OSRM road matrix without changing the HTTP API.

## Units

| Value | Unit |
| --- | --- |
| Coordinates | WGS84 latitude/longitude degrees |
| Capacity and demand | Application-defined integer units |
| Service duration | Seconds |
| Time windows | Seconds from route-day start |
| Distance | Metres |
| Travel and route duration | Seconds |
| Objective cost | Solver cost units (kilometre-equivalent distance with the current `0.001` per-metre vehicle cost) |

Crow-fly routing uses jsprit's great-circle distance at an assumed constant speed of 30 km/h. Its response geometry is a straight GeoJSON `LineString` through the final start, stops, and end, and it never calls OSRM.

OSRM routing loads one asymmetric Table-service matrix before optimization; all jsprit lookups are then in-memory. After optimization, it makes one OSRM Route-service request per used vehicle route with `overview=full&geometries=geojson`. The returned geometry is for display only. Existing Table/jsprit distance and duration values remain authoritative and are not overwritten by Route-service metrics.

## Routing configuration

Crow-fly mode is the default and requires no external service:

```properties
routing.provider=crowfly
```

To use a local OSRM server:

```properties
routing.provider=osrm
routing.osrm.base-url=http://localhost:5000
routing.osrm.connect-timeout=2s
routing.osrm.request-timeout=10s
routing.osrm.max-locations=100
```

Every setting can also be supplied as a Spring Boot environment variable. For example in PowerShell:

```powershell
$env:ROUTING_PROVIDER='osrm'
$env:ROUTING_OSRM_BASE_URL='http://localhost:5000'
mvn -pl routing-backend spring-boot:run
```

OSRM mode does not silently fall back to crow-fly. Unavailable services, timeouts, non-success responses, invalid JSON, rejected OSRM responses, missing routes, invalid geometry, matrix-size mismatches, and unroutable pairs return HTTP `502` with the stable error code `ROUTING_PROVIDER_FAILED`. If optimization succeeds but required OSRM geometry fails, the entire request returns that clean provider error rather than a partial route response.

Each successful route now includes frontend-ready geometry:

```json
"geometry": {
  "type": "LineString",
  "coordinates": [[85.8245, 20.2961], [85.817, 20.305]]
}
```

GeoJSON and OSRM coordinates are always longitude first, then latitude. Vehicle-specific start and end locations are preserved; the global depot is not appended unless it is the route's actual end.

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured for `/api/**` endpoints.

Development Default:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:4173
```

Development Environment Variable Example:
```powershell
$env:CORS_ALLOWED_ORIGINS='http://localhost:5173'
mvn -pl routing-backend spring-boot:run
```

Production Environment Variable Example:
```bash
export CORS_ALLOWED_ORIGINS="https://your-frontend-domain.example"
```

Multiple allowed origins can be specified as a comma-separated list:
```bash
export CORS_ALLOWED_ORIGINS="https://frontend.example.com,https://staging.example.com"
```

In production, `CORS_ALLOWED_ORIGINS` must be supplied through your cloud deployment platform's environment variables (e.g. AWS App Runner, Docker, Render, Kubernetes).

## Run

From the repository root:

```text
mvn -pl routing-backend -am install
mvn -pl routing-backend spring-boot:run
```

Example request using Bhubaneswar coordinates:

```powershell
$body = @'
{
  "depot": {"id":"DEPOT-1","latitude":20.2961,"longitude":85.8245},
  "vehicles": [{"id":"V1","capacity":50}],
  "jobs": [
    {"id":"D1","latitude":20.305,"longitude":85.817,"demand":18,"serviceDuration":240,"priority":2},
    {"id":"D2","latitude":20.316,"longitude":85.826,"demand":16,"serviceDuration":300,"priority":2}
  ]
}
'@
Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/optimize' -ContentType 'application/json' -Body $body
```
