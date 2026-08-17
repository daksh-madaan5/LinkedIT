# 11. Data Models — Request, Response & jsprit Mapping

This document provides a field-by-field reference dictionary for all request and response Data Transfer Objects (DTOs) in `routing-backend` and maps them directly to `jsprit-core` domain models.

---

## 1. Request DTO Dictionary

### A. `OptimizationRequest`
Path: [`OptimizationRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/OptimizationRequest.java)

| Field | Type | Required? | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `depot` | `LocationRequest` | **Required** | Central origin location for vehicles without custom start/end locations. | `{"id": "DEPOT-1", "latitude": 20.2961, "longitude": 85.8245}` |
| `vehicles` | `List<VehicleRequest>` | **Required** | Fleet of available delivery vehicles ($\ge 1$). | `[{"id": "V1", "capacity": 50}]` |
| `jobs` | `List<DeliveryRequest>` | **Required** | List of customer delivery locations ($\ge 1$). | `[{"id": "D1", "latitude": 20.305, "longitude": 85.817, "demand": 18}]` |

### B. `VehicleRequest`
Path: [`VehicleRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/VehicleRequest.java)

| Field | Type | Required? | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | **Required** | Globally unique vehicle identifier. | `"V1"` |
| `capacity` | `int` | **Required** | Non-divisible carrying capacity ($> 0$). | `50` |
| `startLocation` | `LocationRequest` | Optional | Custom start location. If `null`, defaults to central depot. | `{"id": "START-1", "latitude": 20.30, "longitude": 85.81}` |
| `endLocation` | `LocationRequest` | Optional | Custom end location. If `null`, defaults to central depot. | `{"id": "END-1", "latitude": 20.29, "longitude": 85.82}` |

### C. `DeliveryRequest`
Path: [`DeliveryRequest.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/request/DeliveryRequest.java)

| Field | Type | Required? | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | **Required** | Globally unique delivery job identifier. | `"D1"` |
| `latitude` | `Double` | **Required** | Latitude coordinate ($-90 \le \text{lat} \le 90$). | `20.3050` |
| `longitude` | `Double` | **Required** | Longitude coordinate ($-180 \le \text{lng} \le 180$). | `85.8170` |
| `demand` | `int` | **Required** | Load capacity consumed ($\ge 0$). | `18` |
| `serviceDuration` | `double` | **Required** | Time spent unloading goods at stop in seconds ($\ge 0$). | `240.0` (4 mins) |
| `priority` | `Integer` | Optional | Delivery priority ($1 = \text{highest}, 10 = \text{lowest}$). | `2` |
| `timeWindow` | `TimeWindowRequest` | Optional | Time window restriction for arrival. | `{"start": 3600.0, "end": 7200.0}` |

---

## 2. Response DTO Dictionary

### A. `OptimizationResponse`
Path: [`OptimizationResponse.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/OptimizationResponse.java)

| Field | Type | Description |
| :--- | :--- | :--- |
| `routes` | `List<RouteResponse>` | List of active vehicle routes assigned delivery jobs. |
| `unassignedJobs` | `List<String>` | Sorted list of job IDs that could not be assigned due to constraints. |
| `summary` | `OptimizationSummary` | Aggregate optimization metrics across all routes. |

### B. `RouteResponse`
Path: [`RouteResponse.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/RouteResponse.java)

| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `vehicleId` | `String` | None | ID of the vehicle assigned to this route. |
| `stops` | `List<StopResponse>` | None | Ordered list of delivery stops along the route. |
| `distance` | `double` | Metres ($m$) | Total distance traveled on this route. |
| `duration` | `double` | Seconds ($s$) | Total route duration including travel time, waiting time, and unloading service times. |
| `initialLoad` | `int` | Units | Total load placed onto vehicle at start of route. |
| `deliveredLoad` | `int` | Units | Total load delivered along the route. |
| `geometry` | `RouteGeometry` | GeoJSON | Polyline coordinates for rendering route on a map. |

### C. `StopResponse`
Path: [`StopResponse.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/dto/response/StopResponse.java)

| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `jobId` | `String` | None | ID of the job serviced at this stop. |
| `sequence` | `int` | 1-indexed | 1-based order index of stop along route. |
| `latitude` | `double` | WGS84 Deg | Latitude of stop. |
| `longitude` | `double` | WGS84 Deg | Longitude of stop. |
| `arrivalTime` | `double` | Seconds | Elapsed time when vehicle arrives at stop. |
| `departureTime` | `double` | Seconds | Elapsed time when vehicle finishes service and departs stop (`arrivalTime + serviceDuration + waitingTime`). |
| `remainingLoad` | `int` | Units | Vehicle load remaining right after servicing this stop. |

---

## 3. Application DTO to jsprit Domain Model Mapping Table

| LinkedIT DTO Field | jsprit Domain Model Method | Code Location |
| :--- | :--- | :--- |
| `LocationRequest depot` | `Location.Builder.newInstance().setId(id).setCoordinate(Coordinate.newInstance(lng, lat))` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L70-L74) |
| `VehicleRequest.capacity` | `VehicleTypeImpl.Builder.addCapacityDimension(0, capacity)` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L36) |
| `VehicleRequest.startLocation` | `VehicleImpl.Builder.setStartLocation(startLocation)` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L43) |
| `VehicleRequest.endLocation` | `VehicleImpl.Builder.setEndLocation(endLocation)` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L44) |
| `DeliveryRequest.demand` | `Delivery.Builder.addSizeDimension(0, demand)` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L53) |
| `DeliveryRequest.serviceDuration` | `Delivery.Builder.setServiceTime(serviceDuration)` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L54) |
| `DeliveryRequest.priority` | `Delivery.Builder.setPriority(priority)` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L55) |
| `DeliveryRequest.timeWindow` | `Delivery.Builder.setTimeWindow(TimeWindow.newInstance(start, end))` | [`JspritProblemMapper.java`](file:///d:/Study/SIH/LinkedIT/routing-backend/src/main/java/com/linkedit/routing/optimization/JspritProblemMapper.java#L57) |
