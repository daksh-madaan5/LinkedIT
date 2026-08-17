# 22. Troubleshooting — Practical Diagnostic Guide

This guide provides solutions for common compilation errors, runtime failures, validation issues, and OSRM integration problems.

---

## 1. Diagnostic Matrix

| Symptom | Likely Cause | Diagnostic Step | How to Fix |
| :--- | :--- | :--- | :--- |
| `mvn` is not recognized | Maven binary is not added to system PATH. | Run `mvn -v` in PowerShell. | Install Maven 3.6+ and add its `bin` directory to environment `PATH`. |
| `java: invalid target release: 21` | JDK 17 or older is being used by Maven. | Run `java -version` and `javac -version`. | Install JDK 21 and set `JAVA_HOME` environment variable to JDK 21 path. |
| Port `8080` already in use | Another application or previous backend instance is running. | Run `netstat -ano \| findstr 8080` in PowerShell. | Kill running process (`stop-process -id <PID>`) or change port via `-Dserver.port=8081`. |
| `HTTP 502 Bad Gateway` on `/api/optimize` | Backend is configured for `routing.provider=osrm` but OSRM server is down or unreachable. | Check server logs for `RoutingProviderException` and verify `http://localhost:5000/table/v1/driving/...` in browser. | Start OSRM server on port 5000, or switch to offline mode by setting `routing.provider=crowfly` in `application.properties`. |
| `HTTP 400 Bad Request` (`INVALID_REQUEST`) | Input JSON payload failed business validation (e.g. duplicate IDs, zero capacity, invalid coordinates). | Inspect response JSON `errors` array. | Fix JSON payload to ensure valid coordinates ($-90 \le \text{lat} \le 90$), capacity $> 0$, and unique job/vehicle IDs. |
| Jobs returned in `unassignedJobs` | Vehicle capacities are too small, or job demand is larger than any single vehicle. | Compare sum of job demands against vehicle capacities. | Increase vehicle capacity in request or add additional vehicles to the fleet. |
| OSRM `max-locations` exceeded | Optimization request contains more unique locations than allowed by configuration. | Count unique coordinates in request. | Increase `routing.osrm.max-locations` property in `application.properties`. |

---

## 2. Troubleshooting Workflow

```text
 System Issue Occurs
          │
          ▼
 Is it a Maven / Build Error? ──► YES ──► Check Java 21 JDK installation & run `mvn clean compile`
          │
          NO
          ▼
 Is it HTTP 400 Bad Request?  ──► YES ──► Check response `errors` array & validate JSON field values
          │
          NO
          ▼
 Is it HTTP 502 Bad Gateway?  ──► YES ──► OSRM server unreachable. Verify port 5000 or set `routing.provider=crowfly`
          │
          NO
          ▼
 Inspect backend console logs for root cause stack trace
```
