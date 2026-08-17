# 18. Deployment — Production Packaging & Cloud Platforms

This document outlines the deployment strategy and cloud infrastructure setup for the LinkedIT backend.

---

## Deployment Status Notice

> [!NOTE]
> **Deployment Verification Status**: `PLANNED / NOT VERIFIED`
> Deployment configurations (Dockerfiles, Railway manifests, CI/CD pipelines) are **PLANNED** for future implementation. The current repository contains the core application source code ready for compilation into an executable Spring Boot fat JAR.

---

## 1. Packaging the Executable Fat JAR

To produce a single, self-contained executable `.jar` file containing all dependencies and the embedded Tomcat server:

```powershell
mvn clean package -DskipTests
```

This creates the executable JAR artifact at:
`routing-backend/target/routing-backend-2.1.0-SNAPSHOT.jar`

### Running the Production JAR Directly
```powershell
java -jar routing-backend/target/routing-backend-2.1.0-SNAPSHOT.jar
```

---

## 2. Cloud Platform Deployment Architecture (e.g. Railway / Render / AWS)

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                      CLOUD ENVIRONMENT                      │
 │                                                             │
 │   ┌────────────────────────┐      ┌─────────────────────┐   │
 │   │  Spring Boot Backend   │      │ OSRM Server Service │   │
 │   │  Port 8080             │─────►│ Port 5000           │   │
 │   │                        │ HTTP │ (Pre-extracted OSM) │   │
 │   └────────────────────────┘      └─────────────────────┘   │
 │               ▲                                             │
 └───────────────┼─────────────────────────────────────────────┘
                 │ HTTPS POST /api/optimize
        React Web Frontend
```

---

## 3. Required Environment Variables for Production

When deploying to platforms like Railway or Render, configure these environment variables in your deployment dashboard:

```text
JAVA_VERSION=21
ROUTING_PROVIDER=osrm
ROUTING_OSRM_BASE_URL=http://osrm-service-internal.railway.internal:5000
ROUTING_OSRM_CONNECT_TIMEOUT=3s
ROUTING_OSRM_REQUEST_TIMEOUT=15s
ROUTING_OSRM_MAX_LOCATIONS=250
PORT=8080
```
