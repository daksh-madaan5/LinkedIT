# 24. Frontend Deep Dive — Fleet Routing Workspace Architecture

This document details the complete React + Vite + TypeScript frontend architecture for **LinkedIT**, explaining its folder structure, data flow, component hierarchy, and integration with the Spring Boot optimization backend.

---

## 1. Complete Folder Structure

```text
frontend/
├── .env.example                     # Sample environment variable template
├── .gitignore                       # Ignores .env and .env.local
├── index.html                       # HTML template with Google Fonts (Inter, JetBrains Mono)
├── package.json                     # React 19, Vite, Leaflet, Lucide-React dependencies
├── tsconfig.json                    # Base TypeScript compiler configuration
├── tsconfig.app.json                # TS config for application source
├── tsconfig.node.json               # TS config for Vite build scripts
├── vite.config.ts                   # Vite configuration with React and Tailwind plugins
└── src/
    ├── main.tsx                     # React application entry point (DOM root mount)
    ├── App.tsx                      # Master layout orchestrator and state holder
    ├── index.css                    # Design system tokens and custom Leaflet marker styles
    │
    ├── api/
    │   └── optimizationApi.ts       # REST client for POST /api/optimize with error handling
    │
    ├── types/
    │   └── optimization.ts          # TypeScript interfaces strictly matching Java backend DTOs
    │
    ├── utils/
    │   ├── formatting.ts            # Distance (m->km), duration (s->min), time & coordinate formatters
    │   └── mapUtils.ts              # GeoJSON [lng, lat] -> Leaflet [lat, lng] converter & route colors
    │
    ├── data/
    │   └── sampleData.ts            # Pre-configured 9-job Bhubaneswar demo scenario
    │
    └── components/
        ├── layout/
        │   └── AppHeader.tsx        # Top 56px header with logo, navigation tabs, and status badge
        │
        ├── planning/
        │   ├── PlanningSidebar.tsx  # Fixed 300px sidebar containing depot, vehicles, jobs & CTA
        │   ├── DepotSection.tsx     # Central depot coordinates editor (Latitude & Longitude)
        │   ├── VehicleSection.tsx   # Fleet list, selection toggle, and add/edit vehicle modal
        │   ├── JobSection.tsx       # Deliveries list with independent scroll & add/edit modal
        │   └── OptimizeButton.tsx   # Primary 42px blue action button with loading spinner
        │
        ├── map/
        │   └── RoutingMap.tsx       # Leaflet interactive map (markers, polylines, fitBounds, popups)
        │
        └── results/
            ├── ResultsTabs.tsx      # Bottom workspace container (tab switching & filter controls)
            ├── SummaryStrip.tsx     # KPI strip (Total Distance, Duration, Vehicles Used, Assigned)
            ├── OrdersTable.tsx      # Tab 1: Dense logistics table with arrival/departure estimates
            ├── RoutesTable.tsx      # Tab 2: Vehicle-level table with load bars & stop pathways
            └── TimelineView.tsx     # Tab 3: Step-by-step dispatch timeline for each vehicle
```

---

## 2. Component Responsibility Dictionary

| Component / File | Directory | Role & Responsibilities |
| :--- | :--- | :--- |
| [`App.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/App.tsx) | `src/` | Central state container (`depot`, `vehicles`, `jobs`, `response`, `selectedVehicleId`, `isLoading`, `error`). Coordinates API calls and orchestrates child components. |
| [`AppHeader.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/layout/AppHeader.tsx) | `layout/` | Top 56px bar with LinkedIT logo, primary navigation (`Plan & Optimize`, `Live Dispatch`, `Analytics`), live `● Backend Connected` status, and action buttons. |
| [`PlanningSidebar.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/planning/PlanningSidebar.tsx) | `planning/` | Fixed 300px left sidebar hosting depot, fleet, and deliveries with a sticky bottom **Optimize Routes** CTA. |
| [`DepotSection.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/planning/DepotSection.tsx) | `planning/` | 2-column input fields for central depot latitude and longitude coordinates. |
| [`VehicleSection.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/planning/VehicleSection.tsx) | `planning/` | Vehicle fleet manager showing color indicators, capacities, and interactive selection. Contains add/edit modal. |
| [`JobSection.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/planning/JobSection.tsx) | `planning/` | Delivery jobs list with independent scrolling. Contains modal for job ID, coordinates, demand, service duration, and priority. |
| [`OptimizeButton.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/planning/OptimizeButton.tsx) | `planning/` | Primary 42px CTA button. Displays spinner during optimization and prevents duplicate submissions. |
| [`RoutingMap.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/map/RoutingMap.tsx) | `map/` | Vanilla Leaflet map in a `useRef` container. Renders OpenStreetMap tiles, warehouse depot pin, numbered sequence badges (1, 2, 3...), and GeoJSON polylines. |
| [`ResultsTabs.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/results/ResultsTabs.tsx) | `results/` | Bottom dispatch container managing the `SummaryStrip` and switching between `Orders`, `Routes`, and `Timeline` tabs. |
| [`SummaryStrip.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/results/SummaryStrip.tsx) | `results/` | Horizontal status strip displaying Total Distance, Total Duration, Vehicles Used, Assigned Jobs count, and unassigned warnings. |
| [`OrdersTable.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/results/OrdersTable.tsx) | `results/` | High-density logistics table displaying Order ID, Status, Assigned Vehicle, Stop #, Coordinates, Demand, Service Duration, Time Window, Arrival, and Departure. |
| [`RoutesTable.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/results/RoutesTable.tsx) | `results/` | Route-level summary table with vehicle capacities, utilization progress bars, distances, durations, and stop sequence pathways (`Depot → D5 → D8 → D2 → Depot`). |
| [`TimelineView.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/results/TimelineView.tsx) | `results/` | Step-by-step horizontal dispatch timeline cards for each vehicle with arrival and departure timestamps. |

---

## 3. Data & Utility Modules

| File | Role & Key Functions |
| :--- | :--- |
| [`optimizationApi.ts`](file:///d:/Study/SIH/LinkedIT/frontend/src/api/optimizationApi.ts) | Sends `POST /api/optimize` via `fetch()`. Reads `VITE_API_BASE_URL` with fallback to `http://localhost:8080`. Catches network errors and HTTP 502 (`ROUTING_PROVIDER_FAILED`). |
| [`optimization.ts`](file:///d:/Study/SIH/LinkedIT/frontend/src/types/optimization.ts) | TypeScript interfaces strictly mirroring backend Java DTO records (`LocationRequest`, `VehicleRequest`, `DeliveryRequest`, `OptimizationResponse`, `StopResponse`, `RouteGeometry`, etc.). |
| [`formatting.ts`](file:///d:/Study/SIH/LinkedIT/frontend/src/utils/formatting.ts) | Formatters: `formatDistance` (m to km), `formatDuration` (s to min/hours), `formatTimeOfDay` (seconds to HH:MM), `formatServiceTime`, `formatTimeWindow`. |
| [`mapUtils.ts`](file:///d:/Study/SIH/LinkedIT/frontend/src/utils/mapUtils.ts) | `geoJsonToLeafletCoords` (converts GeoJSON `[lng, lat]` $\to$ Leaflet `[lat, lng]`) and `getVehicleColor` (assigns restrained palette colors). |
| [`sampleData.ts`](file:///d:/Study/SIH/LinkedIT/frontend/src/data/sampleData.ts) | Pre-configured 9-delivery Bhubaneswar dataset used when clicking **Load Bhubaneswar Demo**. |

---

## 4. Operational Flow Diagram

```text
 User clicks "Load Bhubaneswar Demo" or adds jobs manually
                   │
                   ▼
 App.tsx updates State: depot, vehicles, jobs
                   │
                   ├─► RoutingMap renders initial pins (Depot + neutral Delivery markers)
                   ├─► OrdersTable shows unoptimized pending orders
                   │
 User clicks "Optimize Routes"
                   │
                   ▼
 optimizationApi.ts sends POST /api/optimize to Spring Boot Backend
                   │
                   ▼
 Backend runs OSRM Table + jsprit optimization + OSRM Route geometry
                   │
                   ▼
 App.tsx receives OptimizationResponse JSON
                   │
                   ├─► RoutingMap renders GeoJSON polylines & numbered stop sequence badges (1, 2, 3...)
                   ├─► SummaryStrip displays total distance, duration, vehicles used, and assignment count
                   ├─► OrdersTable updates with assigned vehicles, stop numbers, arrival and departure times
                   ├─► RoutesTable displays capacity utilization bars and pathway sequence
                   └─► TimelineView renders step-by-step dispatch timeline
```
