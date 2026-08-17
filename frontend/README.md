# LinkedIT Frontend

A minimal, professional, full-featured React + Vite + TypeScript web application for vehicle route optimization.

---

## 1. Workspace Layout Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│ LinkedIT [PRO]   Plan & Optimize   Live Dispatch   Analytics           │
├─────────────────┬──────────────────────────────────────────────────────┤
│                 │                                                      │
│ PLANNING        │                  INTERACTIVE MAP                     │
│ SIDEBAR         │                  (Leaflet / OSM)                     │
│ (~320px)        │                                                      │
│                 │                                                      │
│ [▶ Optimize]    ├──────────────────────────────────────────────────────┤
│                 │ ORDERS | ROUTES | TIMELINE            [Search orders]│
│                 │ Data table with status pills, coordinates & times    │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 2. Component Structure

```text
frontend/src/
├── api/
│   └── optimizationApi.ts       # POST /api/optimize backend client
├── assets/
│   └── vite.svg
├── components/
│   ├── layout/
│   │   └── AppHeader.tsx        # Top header with branding & actions
│   ├── map/
│   │   └── RoutingMap.tsx       # Leaflet map with resize observer
│   ├── planning/
│   │   ├── DepotSection.tsx     # Depot coordinates form
│   │   ├── VehicleSection.tsx   # Fleet list & add/edit modal
│   │   ├── JobSection.tsx       # Delivery jobs list & add/edit modal
│   │   └── PlanningSidebar.tsx  # Resizable planning sidebar
│   └── results/
│       ├── OrdersTable.tsx      # Orders data table with search filtering
│       ├── RoutesTable.tsx      # Vehicle routes summary table
│       ├── TimelineView.tsx     # Stop sequence schedule visualization
│       ├── SummaryStrip.tsx     # Operational KPI summary strip
│       └── ResultsTabs.tsx      # Bottom resizable dispatch workspace
├── data/
│   └── sampleData.ts            # Bhubaneswar demo dataset
├── types/
│   └── optimization.ts          # Optimization DTO TypeScript interfaces
├── utils/
│   ├── formatting.ts            # Metric formatters
│   └── mapUtils.ts              # GeoJSON coordinate & vehicle color utilities
├── App.tsx                      # Root workspace application component
├── index.css                    # Sofia Pro design tokens and marker styling
└── main.tsx                     # React entrypoint
```

---

## 3. Running Locally

```powershell
cd frontend
npm run dev
# App will run at http://localhost:5173
```
