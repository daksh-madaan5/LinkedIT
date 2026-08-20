# LinkedIT — Deployment, OSRM Road Routing & Multi-Depot Guide

A complete guide covering:
1. **Multi-Depot Capabilities** in LinkedIT.
2. **OSRM Road Routing Engine Setup** (Local, Docker & Public endpoints).
3. **Production Cloud Deployment** (Frontend, Backend, OSRM & Docker Compose).

---

## 1. Multi-Depot Capabilities

### Single Root Depot vs. Multi-Depot Fleet

| Level | Support Status | Implementation Details |
| :--- | :--- | :--- |
| **Top-Level Request (`depot`)** | **Single Primary Depot** (Required) | The root `OptimizationRequest` expects one default depot location (`depot: LocationRequest`) used as the fallback origin for vehicles. |
| **Vehicle-Level (`startLocation`, `endLocation`)** | **Multi-Depot Supported** (Built-in) | Each `VehicleRequest` in `vehicles: [...]` accepts optional `startLocation` and `endLocation`. If specified, vehicles start and finish at different warehouses/hubs. |

### Example Multi-Depot Request Payload
```json
{
  "depot": {
    "id": "CENTRAL-DEPOT",
    "latitude": 20.2961,
    "longitude": 85.8245
  },
  "vehicles": [
    {
      "id": "V1-NORTH",
      "capacity": 50,
      "startLocation": { "id": "NORTH-HUB", "latitude": 20.3340, "longitude": 85.8220 },
      "endLocation": { "id": "NORTH-HUB", "latitude": 20.3340, "longitude": 85.8220 }
    },
    {
      "id": "V2-SOUTH",
      "capacity": 50,
      "startLocation": { "id": "SOUTH-HUB", "latitude": 20.2700, "longitude": 85.8330 },
      "endLocation": { "id": "SOUTH-HUB", "latitude": 20.2700, "longitude": 85.8330 }
    }
  ],
  "jobs": [
    { "id": "D1", "latitude": 20.3050, "longitude": 85.8170, "demand": 18, "serviceDuration": 240, "priority": 2 }
  ]
}
```

---

## 2. OSRM Road Routing Engine Setup

LinkedIT supports two routing modes:
1. **`crowfly` (Default / Offline)**: Straight Euclidean line segments using spherical Haversine distance.
2. **`osrm` (Real Road Routing)**: Computes real-world street distance matrices and returns full turn-by-turn GeoJSON road geometry.

### Switching to OSRM in Spring Boot
In `routing-backend/src/main/resources/application.properties`:
```properties
# Switch from 'crowfly' to 'osrm'
routing.provider=osrm

# Point to your running OSRM instance
routing.osrm.base-url=http://localhost:5000
routing.osrm.connect-timeout=2s
routing.osrm.request-timeout=10s
routing.osrm.max-locations=100
```

---

### Option A: Quick Testing using Public OSRM Endpoint (No Docker needed)
For quick prototyping or dev testing without running a local OSRM server:
```properties
routing.osrm.base-url=https://router.project-osrm.org
```

---

### Option B: Local / Self-Hosted OSRM Server using Docker (Recommended)

1. **Create data directory and download OpenStreetMap data**:
   ```powershell
   mkdir C:\osrm-data
   cd C:\osrm-data
   # Download OSM extract (e.g. Eastern India / Odisha from Geofabrik)
   curl -O https://download.geofabrik.de/asia/india/eastern-zone-latest.osm.pbf
   ```

2. **Extract & Build the Graph**:
   ```powershell
   # 1. Extract road network using car profile
   docker run -t -v "C:\osrm-data:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/eastern-zone-latest.osm.pbf

   # 2. Partition graph
   docker run -t -v "C:\osrm-data:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/eastern-zone-latest.osrm

   # 3. Customize routing weights
   docker run -t -v "C:\osrm-data:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/eastern-zone-latest.osrm
   ```

3. **Start the OSRM Routing Container**:
   ```powershell
   docker run -d -p 5000:5000 --name linkedit-osrm -v "C:\osrm-data:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/eastern-zone-latest.osrm
   ```

4. **Verify OSRM is responding**:
   ```powershell
   curl "http://localhost:5000/route/v1/driving/85.8245,20.2961;85.8170,20.3050?overview=full&geometries=geojson"
   ```

---

## 3. Production Cloud Deployment

### Target Cloud Architecture

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                      CLOUD ENVIRONMENT                      │
 │                                                             │
 │   ┌────────────────────────┐      ┌─────────────────────┐   │
 │   │  Spring Boot Backend   │      │ OSRM Docker Service │   │
 │   │  Port 8080             │─────►│ Port 5000           │   │
 │   │                        │ HTTP │ (Pre-extracted OSM) │   │
 │   └────────────────────────┘      └─────────────────────┘   │
 │               ▲                                             │
 └───────────────┼─────────────────────────────────────────────┘
                 │ HTTPS (POST /api/optimize)
        React Web Frontend
       (Vercel / Netlify / CDN)
```

---

### Step 1: Deploying the Frontend (Vercel / Netlify / Cloudflare Pages)

1. **Build the production bundle**:
   ```bash
   cd frontend
   npm run build
   ```
2. **Deploy Configuration**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```env
     VITE_API_BASE_URL=https://api.your-domain.com
     ```

---

### Step 2: Deploying the Spring Boot Backend (Railway / Render / AWS)

1. **Compile the Executable Fat JAR**:
   ```bash
   mvn clean package -DskipTests
   ```
   Artifact output: `routing-backend/target/routing-backend-2.1.0-SNAPSHOT.jar`

2. **Set Cloud Environment Variables**:
   ```env
   JAVA_VERSION=21
   ROUTING_PROVIDER=osrm
   ROUTING_OSRM_BASE_URL=http://osrm-service:5000
   CORS_ALLOWED_ORIGINS=https://linkedit.app,https://your-frontend.vercel.app
   PORT=8080
   ```

---

### Step 3: Single VPS Deployment (All-in-One Docker Compose)

Deploy frontend, backend, and OSRM together on an Ubuntu VPS (e.g. AWS EC2, DigitalOcean, Hetzner):

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  # 1. OSRM Road Engine (Internal Network)
  osrm:
    image: ghcr.io/project-osrm/osrm-backend:latest
    restart: always
    volumes:
      - ./osrm-data:/data
    command: osrm-routed --algorithm mld /data/eastern-zone-latest.osrm
    expose:
      - "5000"

  # 2. Spring Boot Optimization Backend
  backend:
    build:
      context: .
      dockerfile: routing-backend/Dockerfile
    restart: always
    environment:
      - ROUTING_PROVIDER=osrm
      - ROUTING_OSRM_BASE_URL=http://osrm:5000
      - CORS_ALLOWED_ORIGINS=https://your-domain.com,http://localhost:5173
      - PORT=8080
    ports:
      - "8080:8080"
    depends_on:
      - osrm

  # 3. React Frontend (Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
```

#### Backend `routing-backend/Dockerfile`
```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY routing-backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 4. Summary Checklist

- [x] **Multi-Depot**: Top-level `depot` is required; individual vehicles support custom `startLocation` & `endLocation`.
- [x] **Road Geometry**: Set `routing.provider=osrm` in `application.properties` and start OSRM on port `5000`.
- [x] **Production Backend**: Package via `mvn clean package -DskipTests` and supply `CORS_ALLOWED_ORIGINS` & `ROUTING_OSRM_BASE_URL`.
- [x] **Production Frontend**: Build via `npm run build` and point `VITE_API_BASE_URL` to the backend.
