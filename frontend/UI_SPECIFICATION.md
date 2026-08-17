# LinkedIT Frontend — UI Specification (Map-First Architecture)

A reference document detailing the dimensions, typography, layout, and visual design tokens for the LinkedIT frontend application.

---

## 1. Global Viewport & Map Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ [LinkedIT Card]          [Fit Bounds]                    │
│ • Load Demo                                              │
│ • Planning Inputs                                        │
│ • [▶ Optimize Routes]                                    │
│                                                          │
│                     LEAFLET MAP                          │
│               (Full Viewport 100vw × 100vh)              │
│                                                          │
│                                                          │
│       [ 32.3 km · 1h 44m · 3 vehicles · 9/9 assigned ]   │
└──────────────────────────────────────────────────────────┘
```

| Area / Region | Dimensions | Position | Behavior |
| :--- | :--- | :--- | :--- |
| **Root Viewport (`#root`)** | `100vw × 100vh` | Absolute viewport | Zero margins, zero padding, `overflow: hidden` |
| **Interactive Leaflet Map** | `100% × 100%` | Full viewport | Occupies full browser window with OpenStreetMap tiles |
| **Top-Left Floating Controls** | `w-64` (~256px) | `top-4 left-4`, `z-[1000]` | Compact card for Demo, Planning modal trigger, and Optimize CTA |
| **Top Floating Fit Bounds** | `min-h-[36px]` | `top-4 left-72`, `z-[1000]` | White pill button to fit bounds across all route points |
| **Bottom Floating Summary** | Height ~40px | `bottom-6 left-1/2 -translate-x-1/2`, `z-[1000]` | Dark pill showing Distance, Duration, Vehicles, and Assigned count |
| **Planning Modal Dialog** | `max-w-lg` (~512px), `max-h-[85vh]` | Centered modal, `z-[2000]` | Modal dialog for Depot, Fleet, and Delivery Jobs management |

---

## 2. Component Dimensions & Spacing

### 2.1 Floating Controls Card (`FloatingControls.tsx`)
- **Container**: `width: 256px`, `bg-white`, `border border-slate-200/90`, `rounded-xl`, `p-3.5`, `shadow-lg`
- **Branding Header**: Logo icon `34px × 34px` (`rounded-lg bg-blue-600`), title `text-sm font-bold text-slate-900`, `PRO` badge `text-[9px] font-semibold`.
- **Load Demo Button**: `min-height: 34px`, `bg-blue-50 text-blue-700 border border-blue-200`, `rounded-md`, `text-xs font-semibold`.
- **Planning Button**: `min-height: 34px`, `bg-slate-50 text-slate-700 border border-slate-200`, `rounded-md`, `text-xs font-medium`.
- **Optimize Primary CTA**: `min-height: 38px`, `bg-blue-600 text-white`, `rounded-md`, `text-xs font-bold`, `hover:bg-blue-700`.

### 2.2 Floating Optimization Summary Pill (`FloatingSummary.tsx`)
- **Container**: `bg-slate-900/95 text-white`, `border border-slate-700/80`, `rounded-full`, `px-5 py-2.5`, `shadow-2xl`, `backdrop-blur-xs`
- **Typography**: `text-xs font-mono font-bold`
- **Content**: `Total Distance` (blue icon), `Total Duration` (emerald icon), `Vehicles Used` (amber icon), `Assigned Ratio` (emerald / amber badge).

### 2.3 Planning Modal Dialog (`PlanningModal.tsx`)
- **Container**: `max-w-lg`, `rounded-xl`, `border border-slate-200`, `shadow-2xl`, `bg-white`
- **Header**: `px-4 py-3`, `bg-slate-50 border-b border-slate-200`, title `text-sm font-bold`, subtitle `text-xs text-slate-500 font-mono`
- **Body**: Scrollable `max-h-[60vh]`, `p-4 space-y-3.5` hosting `DepotSection`, `VehicleSection`, and `JobSection`.
- **Footer**: `px-4 py-2.5`, `bg-slate-50 border-t border-slate-200`, "Done" button `bg-blue-600 text-white rounded-md text-xs font-semibold`.

---

## 3. Map Marker Visual Tokens

| Marker Type | Class / Dimensions | Visual Styling |
| :--- | :--- | :--- |
| **Depot Pin** | `.depot-pin` (36px × 36px) | Dark slate `#0f172a` rounded square (8px radius), 2.5px white border, `DEPOT` white badge. |
| **Pre-optimization Job Pin**| `.job-pin` (24px × 24px) | Dark slate `#0f172a` circle, 2px white border, job ID white text. |
| **Optimized Stop Badge** | `.stop-badge` (28px × 28px) | Circle colored with vehicle route color, 2px white border, stop sequence number (1, 2, 3...). |
| **Route Geometry Polyline** | Dynamic SVG polyline | `weight: 5px` (selected) / `3px` (normal), opacity `0.95`, smooth road curvature. |
