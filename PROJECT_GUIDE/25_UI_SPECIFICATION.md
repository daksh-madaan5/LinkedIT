# 25. UI Sizing & Layout Specification

This document provides the complete, exact sizing, dimensions, padding, font sizes, colors, and layout metrics for the **LinkedIT** frontend application.

---

## 1. Global Workspace Layout Dimensions & Resizable Split-Panes

```text
┌──────────────────────────────────────────────────────┐
│                    HEADER (56px)                     │
├──────────────┬───────────────────────────────────────┤
│   SIDEBAR    │                 MAP                   │
│   ~320px     │             flexible width            │
├──────────────┴───────────────────────────────────────┤
│              RESULTS PANEL (Full Width, ~280px)      │
└──────────────────────────────────────────────────────┘
```

| Area / Region | Width Limits (Min / Default / Max) | Height Limits (Min / Default / Max) | Padding / Margins | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Top Application Header** | `100vw` (Full width) | `56px` (`h-14` / `h-15`) | `px-5` (20px horizontal) | Fixed at top, zero scroll |
| **Upper Left Planning Sidebar** | **Min: `280px` / Def: `320px` / Max: `450px`** | `calc(100vh - 56px - resultsHeight)` | `p-3` (12px internal) | Horizontally resizable via vertical drag divider |
| **Vertical Resize Divider Handle**| `6px` (`w-1.5`, cursor: `col-resize`) | `calc(100vh - 56px - resultsHeight)` | `0px` | Drag horizontally to resize sidebar vs map |
| **Upper Right Map Area** | `calc(100vw - sidebarWidth)` | `calc(100vh - 56px - resultsHeight)` | `0px` (Edge-to-edge) | Automatically occupies all remaining space in upper row |
| **Horizontal Resize Divider Handle**| `100vw` (Full width across screen) | `6px` (`h-1.5`, cursor: `row-resize`) | `0px` | Drag vertically to resize upper row vs results panel |
| **Bottom Dispatch Workspace** | `100vw` (Full width across screen) | **Min: `180px` / Def: `280px` / Max: `480px`** | `0px` outer, `px-3` inner | Vertically resizable, spans full screen width below sidebar & map |

---

## 2. Header Dimensions ([`AppHeader.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/layout/AppHeader.tsx))

| Element | Width | Height | Font Size & Weight | Styling Details |
| :--- | :--- | :--- | :--- | :--- |
| **Header Container** | `100%` | `56px` | - | Background: `#ffffff`, Border Bottom: `1px solid #e2e8f0` |
| **Logo Badge** | `34px` | `34px` | - | Background: `#2563eb`, Border Radius: `8px` (`rounded-lg`), Icon: `18x18px` |
| **Brand Title ("LinkedIT")** | Auto | Auto | `16px` (`text-base`), Bold (`font-bold`) | Color: `#0f172a`, tracking: tight |
| **PRO Badge** | Auto | `18px` | `10px` (`text-[10px]`), Semibold | Background: `#f1f5f9`, Border: `1px solid #e2e8f0`, `px-1.5 py-0.5` |
| **Subtitle** | Auto | Auto | `11px` (`text-[11px]`), Regular | Color: `#64748b` (`text-slate-500`) |
| **Nav Tab Button (Active)** | Auto | `30px` | `12px` (`text-xs`), Semibold | Background: `#eff6ff`, Text: `#1d4ed8`, Border: `1px solid #bfdbfe` |
| **Nav Tab Button (Disabled)** | Auto | `30px` | `12px` (`text-xs`), Medium | Text: `#94a3b8`, Cursor: `not-allowed`, Badge: `9px font-mono` |
| **Backend Status Badge** | Auto | `26px` | `12px` (`text-xs`), Medium | Background: `#ecfdf5`, Text: `#047857`, Pulse Dot: `8x8px` (`#10b981`) |
| **"Load Bhubaneswar Demo" Button**| Auto | `34px` (`min-h-[34px]`)| `12px` (`text-xs`), Semibold | Background: `#eff6ff`, Text: `#1d4ed8`, Border: `1px solid #bfdbfe`, `px-3 py-1.5` |
| **"Reset" Button** | Auto | `34px` (`min-h-[34px]`)| `12px` (`text-xs`), Medium | Background: `#f8fafc`, Text: `#475569`, Border: `1px solid #e2e8f0`, `px-2.5 py-1.5` |

---

## 3. Left Planning Sidebar Dimensions ([`PlanningSidebar.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/planning/PlanningSidebar.tsx))

| Component / Element | Width | Height | Font Size & Weight | Spacing / Padding |
| :--- | :--- | :--- | :--- | :--- |
| **Sidebar Title Bar** | `100%` | `36px` | `11px` (`text-[11px]`), Bold Uppercase | Padding: `px-3.5 py-2.5`, Border Bottom: `1px solid #e2e8f0` |
| **Section Containers** | `100%` | Auto | - | Background: `#ffffff`, Border: `1px solid #e2e8f0`, Radius: `6px`, `p-3` |
| **Section Headings** | Auto | `16px` | `12px` (`text-xs`), Semibold Uppercase | Color: `#1e293b`, Icon: `14x14px` (`#2563eb`) |
| **Form Labels** | `100%` | Auto | `11px` (`text-[11px]`), Medium | Color: `#475569`, Margin Bottom: `4px` |
| **Coordinate Inputs (Lat / Lng)**| `100%` | `34px` (`h-8.5`) | `12px` (`text-xs`), Font Mono | Background: `#f8fafc`, Border: `1px solid #e2e8f0`, `px-2.5 py-1.5` |
| **Vehicle Row** | `100%` | `34px` | `12px` (`text-xs`), Bold | Padding: `p-2`, Border Radius: `4px`, Color Dot: `10x10px` |
| **Job Row** | `100%` | `30px` | `12px` (`text-xs`), Font Mono | Padding: `px-2 py-1.5`, Border Radius: `4px`, Gap: `8px` |
| **Row Action Buttons (Edit/Del)**| `22px` | `22px` | - | Hover Background: `#f1f5f9` / `#fef2f2`, Icon: `12x12px` |
| **"Add vehicle / delivery" Link** | Auto | `24px` | `12px` (`text-xs`), Semibold | Text: `#2563eb`, Icon: `14x14px`, `px-2 py-1` |
| **Optimize Routes Button** | `100%` | `42px` (`h-10.5`)| `12px` (`text-xs`), Semibold | Background: `#2563eb`, Radius: `6px`, Icon: `14x14px` |
| **Add/Edit Modal Dialog** | Max `340px`| Auto | Heading: `12px` Bold, Inputs: `34px` | Backdrop: `rgba(15,23,42,0.4)`, Padding: `16px` |

---

## 4. Map & Marker Dimensions ([`RoutingMap.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/map/RoutingMap.tsx))

| Element | Width | Height | Border & Radius | Details |
| :--- | :--- | :--- | :--- | :--- |
| **"Fit Bounds" Button** | Auto | `34px` (`min-h-[34px]`)| Border: `1px solid #e2e8f0`, Radius: `6px` | Background: `#ffffff`, Text: `12px font-semibold`, Icon: `14x14px`, Top-Left |
| **Leaflet Zoom Control (+/-)** | `30px` | `60px` (2x30px) | Border: `1px solid #cbd5e1`, Radius: `4px` | Background: `#ffffff`, Top-Right position |
| **Depot Marker Pin** | `36px` | `36px` | Border: `2.5px solid #ffffff`, Radius: `8px` | Background: `#0f172a`, Text: `9px font-mono font-bold #ffffff` ("DEPOT") |
| **Job Marker Pin (Pre-Opt)** | `24px` | `24px` | Border: `2px solid #ffffff`, Radius: `50%` | Background: `#475569`, Text: `10px font-bold #ffffff` (`D1`, `D2`) |
| **Stop Badge (Post-Opt)** | `28px` | `28px` | Border: `2px solid #ffffff`, Radius: `50%` | Background: Vehicle Route Color, Text: `12px font-bold #ffffff` (`1`, `2`, `3`) |
| **Route Polyline (Selected)** | - | Stroke: `5.0px` | - | Opacity: `0.95`, SmoothFactor: `1.0` |
| **Route Polyline (Unselected)**| - | Stroke: `3.0px` | - | Opacity: `0.30`, SmoothFactor: `1.0` |

---

## 5. Bottom Dispatch Workspace Dimensions ([`ResultsTabs.tsx`](file:///d:/Study/SIH/LinkedIT/frontend/src/components/results/ResultsTabs.tsx))

| Component / Area | Width | Height | Font Size & Weight | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace Container** | `100%` | `280px` (`h-[280px]`) | - | Border Top: `1px solid #e2e8f0`, Background: `#f8fafc` |
| **Summary KPI Strip** | `100%` | `50px` | KPI Label: `10px` Bold, Value: `14px` Mono Bold | Background: `#0f172a`, Text: `#ffffff`, Icons: `16x16px` |
| **Tabs Navigation Bar** | `100%` | `40px` (`h-10`) | Tab Text: `12px` (`text-xs`), Semibold | Background: `#f1f5f9`, Border Bottom: `1px solid #e2e8f0` |
| **Tab Button (Active)** | Auto | `32px` | `12px`, Semibold | Background: `#ffffff`, Text: `#1d4ed8`, Border Bottom: `2px solid #2563eb` |
| **Tab Count Badge** | Auto | `16px` | `10px` (`text-[10px]`), Bold Mono | Background: `#e2e8f0` / `#dbeafe`, Text: `#1e293b`, `px-1.5 py-0.2` |
| **Table Header Row** | `100%` | `32px` | `12px` (`text-xs`), Semibold | Background: `#f1f5f9`, Sticky Top: `0px`, Border Bottom: `1px solid #e2e8f0` |
| **Table Data Rows** | `100%` | `34px` – `38px` | `12px` (`text-xs`), Mono/Sans | Padding: `px-3 py-2`, Border Bottom: `1px solid #f1f5f9`, Hover: `#f8fafc` |
| **Capacity Progress Bar** | `100%` | `6px` (`h-1.5`) | `11px` Mono text above | Background: `#e2e8f0`, Progress Fill: Vehicle Color |
| **Timeline Step Pill** | Auto | `34px` | `12px` Bold ID, `10px` Timestamps | Background: `#f8fafc`, Border: `1px solid #e2e8f0`, `px-2.5 py-1.5` |

---

## 6. Color System & Design Tokens

| Token Name | Hex Code | Tailwind Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- |
| **Primary Blue** | `#2563eb` | `bg-blue-600` | Primary action buttons, active tab indicators, branding |
| **Primary Blue Hover** | `#1d4ed8` | `hover:bg-blue-700` | Button hover and active states |
| **Blue Light Surface** | `#eff6ff` | `bg-blue-50` | Active selection highlights, demo load buttons, pills |
| **Dark Slate Surface** | `#0f172a` | `bg-slate-900` | Summary KPI strip, depot marker pin |
| **Workspace Neutral** | `#f8fafc` | `bg-slate-50` | Main application background, sidebar background |
| **Card / Table Surface**| `#ffffff` | `bg-white` | Header, tables, cards, modal backgrounds |
| **Border Neutral** | `#e2e8f0` | `border-slate-200` | Subtle 1px structural dividing borders |
| **Primary Text** | `#0f172a` | `text-slate-900` | Main headings, order IDs, metric values |
| **Secondary Text** | `#64748b` | `text-slate-500` | Labels, coordinates, units, timestamps |
| **Success Emerald** | `#059669` | `text-emerald-600` | Assigned status badge, backend connected indicator |
| **Warning Amber** | `#d97706` | `text-amber-600` | Unassigned deliveries badge |
| **Error Red** | `#dc2626` | `text-red-600` | Error alert notification banner |

### Vehicle Route Color Palette

| Vehicle Index | Color Name | Hex Code |
| :--- | :--- | :--- |
| `0` (e.g. V1) | **Royal Blue** | `#2563eb` |
| `1` (e.g. V2) | **Emerald Green** | `#059669` |
| `2` (e.g. V3) | **Warm Amber** | `#d97706` |
| `3` (e.g. V4) | **Deep Purple** | `#7c3aed` |
| `4` (e.g. V5) | **Crimson Rose** | `#e11d48` |
| `5` (e.g. V6) | **Dark Cyan** | `#0891b2` |
| `6` (e.g. V7) | **Olive Lime** | `#4d7c0f` |
| `7` (e.g. V8) | **Fuchsia** | `#c026d3` |
