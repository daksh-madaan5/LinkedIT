# 17. Running Locally — Step-by-Step Beginner Guide

This step-by-step guide assumes you have never compiled or run a Java Maven Spring Boot application before.

---

## 1. Prerequisites

Before starting, verify that the following tools are installed on your Windows machine:

1. **Java Development Kit (JDK) 21**:
   Check Java version in PowerShell:
   ```powershell
   java -version
   ```
   *Expected output*: `openjdk version "21.0.x"` (or Java 21+).

2. **Apache Maven 3.6+**:
   Check Maven version:
   ```powershell
   mvn -version
   ```
   *Expected output*: `Apache Maven 3.6.x` or newer.

---

## 2. Step-by-Step Execution Guide

### Step 1: Open Terminal & Navigate to Project Root
```powershell
cd d:\Study\SIH\LinkedIT
```

### Step 2: Clean and Compile Source Code
Compile all Java source code across both `jsprit-core` and `routing-backend`:
```powershell
mvn clean compile
```

### Step 3: Run Automated Test Suite
Verify that all unit and integration tests pass cleanly:
```powershell
mvn -pl routing-backend test
```

### Step 4: Build Local Modules
Install local artifacts to your `.m2` cache while skipping tests for speed:
```powershell
mvn -pl routing-backend -am install -DskipTests
```

### Step 5: Start the Spring Boot Backend Server
Launch the application server:
```powershell
mvn -pl routing-backend spring-boot:run
```
*Expected log output*:
```text
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.3.5)

2026-08-18 Started RoutingBackendApplication in 1.842 seconds (process running for 2.15)
```

---

## 3. Testing the API Endpoint

Once the server is running on `http://localhost:8080`, open a **second PowerShell window** and run:

### Test Call via `Invoke-RestMethod` (PowerShell cURL)
```powershell
$body = @{
    depot = @{ id = "DEPOT-1"; latitude = 20.2961; longitude = 85.8245 }
    vehicles = @(
        @{ id = "V1"; capacity = 50 }
    )
    jobs = @(
        @{ id = "D1"; latitude = 20.3050; longitude = 85.8170; demand = 18; serviceDuration = 240; priority = 2 },
        @{ id = "D2"; latitude = 20.3160; longitude = 85.8260; demand = 16; serviceDuration = 300; priority = 2 }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8080/api/optimize" -Method Post -ContentType "application/json" -Body $body
```

---

## 4. Running with Real OSRM Road Networks

By default, the backend runs in offline `crowfly` mode (no external servers required).

To enable real-world road matrix routing with OSRM:
1. Ensure an OSRM server is running locally on port 5000 (`http://localhost:5000`).
2. Pass environment variables when launching Spring Boot:
   ```powershell
   $env:ROUTING_PROVIDER="osrm"
   $env:ROUTING_OSRM_BASE_URL="http://localhost:5000"
   mvn -pl routing-backend spring-boot:run
   ```
