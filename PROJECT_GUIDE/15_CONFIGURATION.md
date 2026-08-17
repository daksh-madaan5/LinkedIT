# 15. Configuration — Application Properties & Environment Variables

This document explains all configuration options available in the LinkedIT routing backend.

---

## 1. Environment File Clarification

> [!NOTE]
> **Environment File Status**:
> The backend does **not** require a `.env` file. All backend configurations are managed via standard Spring Boot [`application.properties`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/resources/application.properties) or environment variables passed to the JVM.

---

## 2. Configuration Properties Reference

File location: [`routing-backend/src/main/resources/application.properties`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/resources/application.properties)

| Property Key | Default Value | Property Class Mapping | Description |
| :--- | :--- | :--- | :--- |
| `routing.provider` | `crowfly` | Implemented via `@ConditionalOnProperty` | Selects matrix & geometry provider (`crowfly` or `osrm`). |
| `routing.osrm.base-url` | `http://localhost:5000` | [`OsrmProperties.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmProperties.java#L11) | Base HTTP URL of the running OSRM routing server. |
| `routing.osrm.connect-timeout` | `2s` | [`OsrmProperties.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmProperties.java#L12) | Timeout duration when connecting to the OSRM HTTP server. |
| `routing.osrm.request-timeout` | `10s` | [`OsrmProperties.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmProperties.java#L13) | Maximum waiting duration for OSRM API responses. |
| `routing.osrm.max-locations` | `100` | [`OsrmProperties.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/routing/OsrmProperties.java#L14) | Safeguard limit for maximum unique coordinates in a single OSRM Table request. |

---

## 3. Environment Variable Overrides

In production or Docker/Railway deployments, system environment variables automatically override `application.properties` settings:

| Environment Variable | Overrides Property | Example Production Value |
| :--- | :--- | :--- |
| `ROUTING_PROVIDER` | `routing.provider` | `osrm` |
| `ROUTING_OSRM_BASE_URL` | `routing.osrm.base-url` | `https://osrm.mycompany.com` |
| `ROUTING_OSRM_CONNECT_TIMEOUT` | `routing.osrm.connect-timeout` | `5s` |
| `ROUTING_OSRM_REQUEST_TIMEOUT` | `routing.osrm.request-timeout` | `15s` |
| `ROUTING_OSRM_MAX_LOCATIONS` | `routing.osrm.max-locations` | `250` |
| `PORT` or `SERVER_PORT` | `server.port` | `8080` |

### Setting Environment Variables in Windows PowerShell
```powershell
$env:ROUTING_PROVIDER="osrm"
$env:ROUTING_OSRM_BASE_URL="http://localhost:5000"
mvn -pl routing-backend spring-boot:run
```

---

## 4. What Should and Should NOT Be Committed to Git

- **COMMIT**: Default [`application.properties`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/resources/application.properties), `.gitignore`, `.editorconfig`, build scripts.
- **DO NOT COMMIT**: Secret API keys, credentials, local environment override scripts (`.env.local`), compiled target directories (`target/`).
