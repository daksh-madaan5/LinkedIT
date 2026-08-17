# 03. Tech Stack — Technologies & Dependencies

This document details every technology, framework, and library used in the LinkedIT repository, explaining why it was chosen, where it resides, and its implementation status.

---

## Technology Stack Summary Table

| Technology | Why We Use It | Where It Exists | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Java 21** | Long-Term Support (LTS) Java release providing modern language features like Record classes (`record`), Pattern Matching, and enhanced collections. | Root & Module POMs (`<maven.compiler.source>21</maven.compiler.source>`) | `IMPLEMENTED` |
| **Apache Maven** | Multi-module build, dependency management, and lifecycle execution tool. | [`pom.xml`](file:///d:/Study/SIH/LinkedIT/pom.xml), [`routing-backend/pom.xml`](file:///d:/Study/SIH/LinkedIT/routing-backend/pom.xml) | `IMPLEMENTED` |
| **Spring Boot 3.3.5** | Microservice framework providing dependency injection (`@Service`, `@Component`), REST controllers (`@RestController`), and HTTP client capabilities. | [`routing-backend/pom.xml`](file:///d:/Study/SIH/LinkedIT/routing-backend/pom.xml#L17) | `IMPLEMENTED` |
| **jsprit 2.1.0-SNAPSHOT** | Java-based open-source VRP metaheuristic optimization library built by GraphHopper. | Embedded sub-module [`jsprit-core`](file:///d:/Study/SIH/LinkedIT/jsprit-core) | `IMPLEMENTED` |
| **OSRM (Open Source Routing Machine)** | High-performance C++ routing engine providing road network distances, travel durations, and GeoJSON polyline geometries. | External service invoked via HTTP in [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java) | `IMPLEMENTED` |
| **Java 11+ HttpClient** | Native standard library HTTP client (`java.net.http.HttpClient`) for making asynchronous or synchronous REST calls to OSRM without third-party dependencies. | [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L26-L38) | `IMPLEMENTED` |
| **Jackson ObjectMapper** | High-performance JSON serialization/deserialization for parsing OSRM API responses and Spring Boot REST web requests. | [`HttpOsrmClient.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/HttpOsrmClient.java#L21) | `IMPLEMENTED` |
| **GeoJSON (LineString)** | Standard geographic data format (`{"type": "LineString", "coordinates": [[lng, lat], ...]}`) for displaying route lines on map components. | [`RouteGeometry.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/RouteGeometry.java) | `IMPLEMENTED` |
| **JUnit 5 (Jupiter)** | Modern Java unit and integration testing framework. | [`routing-backend/pom.xml`](file:///d:/Study/SIH/LinkedIT/routing-backend/pom.xml#L44) | `IMPLEMENTED` |
| **Mockito 5.10.0** | Mocking framework for isolating components in unit tests (e.g. mocking `OptimizationService` or `OsrmClient`). | [`pom.xml`](file:///d:/Study/SIH/LinkedIT/pom.xml#L48) | `IMPLEMENTED` |
| **React + Vite** | Planned frontend web interface for interactive map visualization, vehicle dispatching, and route viewing. | **NOT in this repository** | `FUTURE / FRONTEND` |

---

## Detailed Tech Stack Explanations

### 1. Java 21 & Java Records
The codebase takes heavy advantage of **Java Records** (introduced in Java 14 and finalized in Java 16) for all Data Transfer Objects (DTOs), immutability, and concise boilerplate-free data structures.
Example from [`LocationRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/LocationRequest.java):
```java
public record LocationRequest(String id, Double latitude, Double longitude) {}
```
Java 21 guarantees thread safety, immutability, built-in `equals()`, `hashCode()`, and `toString()`.

---

### 2. Spring Boot 3.3.5
Spring Boot acts as the web container and glue layer. It handles:
- Inversion of Control (IoC) and Dependency Injection (DI) to wire up services, validators, mappers, and routing providers.
- `@ConditionalOnProperty` to dynamically switch between offline `crowfly` routing and real-world `osrm` road matrix routing at startup.
- Global exception handling (`@RestControllerAdvice`) to convert internal exceptions into clean API error responses.

---

### 3. Embedded jsprit-core Library
Rather than importing jsprit as an external precompiled JAR dependency, jsprit is included directly in the workspace as a source sub-module [`jsprit-core`](file:///d:/Study/SIH/LinkedIT/jsprit-core). This ensures exact compatibility with Java 21, provides absolute build stability, and allows deep inspection into algorithm mechanics.

---

### 4. OSRM (Open Source Routing Machine)
OSRM is an open-source C++ routing engine designed for OpenStreetMap (OSM) data.
LinkedIT communicates with OSRM over HTTP via two endpoints:
1. `GET /table/v1/driving/{coordinates}`: Computes an $N \times N$ matrix of driving distances (metres) and travel durations (seconds).
2. `GET /route/v1/driving/{coordinates}?overview=full&geometries=geojson`: Returns full GeoJSON road geometry for ordered vehicle stops.

---

### 5. React + Vite (Frontend — Planned)
The root `README.md` notes that a React + Vite web dashboard will be built separately. When created, the frontend will consume `POST /api/optimize` and render the returned GeoJSON `LineString` coordinates on an interactive map (such as Mapbox, Leaflet, or OpenLayers).
