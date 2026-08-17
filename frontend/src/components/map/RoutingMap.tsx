import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationRequest, DeliveryRequest, OptimizationResponse } from '../../types/optimization';
import { geoJsonToLeafletCoords, getVehicleColor } from '../../utils/mapUtils';
import { Maximize2, PanelLeft } from 'lucide-react';

interface RoutingMapProps {
  depot: LocationRequest;
  jobs: DeliveryRequest[];
  response: OptimizationResponse | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
  shouldFitBoundsTrigger: number;
  isSidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  isResizing?: boolean;
}

export const RoutingMap: React.FC<RoutingMapProps> = ({
  depot,
  jobs,
  response,
  selectedVehicleId,
  onSelectVehicle,
  shouldFitBoundsTrigger,
  isSidebarOpen = true,
  onOpenSidebar,
  isResizing = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map ONCE
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = depot.latitude || 20.2961;
    const initialLng = depot.longitude || 85.8245;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Subtle Leaflet zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Resize observer for automatic map invalidation on layout changes
    let rafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      });
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Ensure Leaflet recalculates dimensions immediately on sidebar open/close
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize({ animate: false });
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize({ animate: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  // Render Map Markers and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];

    // 1. Render Depot Marker
    if (depot && depot.latitude && depot.longitude) {
      const depotLatLng: [number, number] = [depot.latitude, depot.longitude];
      boundsPoints.push(depotLatLng);

      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div class="depot-pin">
            <div class="depot-badge font-mono">DEPOT</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const depotMarker = L.marker(depotLatLng, { icon: depotIcon }).addTo(layerGroup);
      depotMarker.bindPopup(`
        <div style="padding: 6px 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: #0f172a; font-weight: 700;">${depot.name || 'Depot Origin'}</strong>
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px; border: 1px solid #bfdbfe; font-family: monospace;">
            ID: ${depot.id}
          </div>
          ${
            depot.address
              ? `<div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.3;">${depot.address}</div>`
              : ''
          }
          <div style="font-size: 10px; font-family: monospace; color: #64748b; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            ${depot.latitude.toFixed(4)}, ${depot.longitude.toFixed(4)}
          </div>
        </div>
      `);
    }

    // Vehicle color lookup
    const vehicleColorMap = new Map<string, string>();
    if (response && response.routes) {
      response.routes.forEach((route, idx) => {
        vehicleColorMap.set(route.vehicleId, getVehicleColor(idx));
      });
    }

    // Job stop sequence & vehicle info map
    const jobStopMap = new Map<string, { sequence: number; vehicleId: string; color: string }>();
    if (response && response.routes) {
      response.routes.forEach((route) => {
        const color = vehicleColorMap.get(route.vehicleId) || '#2563eb';
        route.stops.forEach((stop) => {
          jobStopMap.set(stop.jobId, {
            sequence: stop.sequence,
            vehicleId: route.vehicleId,
            color,
          });
        });
      });
    }

    // 2. Render Delivery Markers
    jobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return;
      const jobLatLng: [number, number] = [job.latitude, job.longitude];
      boundsPoints.push(jobLatLng);

      const stopInfo = jobStopMap.get(job.id);
      let jobIcon: L.DivIcon;

      if (stopInfo) {
        // Optimized stop sequence marker
        const isSelected = !selectedVehicleId || selectedVehicleId === stopInfo.vehicleId;
        jobIcon = L.divIcon({
          className: 'custom-stop-marker',
          html: `
            <div class="stop-badge" style="
              background-color: ${stopInfo.color};
              opacity: ${isSelected ? 1 : 0.4};
              transform: ${isSelected ? 'scale(1.08)' : 'scale(0.92)'};
            ">
              ${stopInfo.sequence}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      } else {
        // Unassigned / Pre-optimization dark marker
        jobIcon = L.divIcon({
          className: 'custom-job-marker',
          html: `
            <div class="job-pin">
              <span class="job-id">${job.id}</span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      }

      const marker = L.marker(jobLatLng, { icon: jobIcon }).addTo(layerGroup);

      const popupContent = stopInfo ? `
        <div style="padding: 4px; font-family: sans-serif; font-size: 11px;">
          <strong style="color: #0f172a; font-size: 12px;">Job ${job.id}</strong> (Stop #${stopInfo.sequence})<br/>
          <span style="color: ${stopInfo.color}; font-weight: 600;">Vehicle: ${stopInfo.vehicleId}</span><br/>
          <span>Demand: <strong>${job.demand} units</strong></span>
        </div>
      ` : `
        <div style="padding: 4px; font-family: sans-serif; font-size: 11px;">
          <strong style="color: #0f172a; font-size: 12px;">Delivery ${job.id}</strong><br/>
          <span>Demand: <strong>${job.demand} units</strong></span><br/>
          <span style="color: #64748b;">${job.latitude.toFixed(4)}, ${job.longitude.toFixed(4)}</span>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // 3. Render Route Polylines from GeoJSON
    if (response && response.routes) {
      response.routes.forEach((route) => {
        if (!route.geometry || !route.geometry.coordinates) return;

        const leafletCoords = geoJsonToLeafletCoords(route.geometry.coordinates);
        if (leafletCoords.length < 2) return;

        leafletCoords.forEach((pt) => boundsPoints.push(pt));

        const color = vehicleColorMap.get(route.vehicleId) || '#2563eb';
        const isSelected = !selectedVehicleId || selectedVehicleId === route.vehicleId;

        const polyline = L.polyline(leafletCoords, {
          color: color,
          weight: isSelected ? 5 : 3,
          opacity: isSelected ? 0.95 : 0.3,
          smoothFactor: 1,
        }).addTo(layerGroup);

        polyline.on('click', () => {
          onSelectVehicle(selectedVehicleId === route.vehicleId ? null : route.vehicleId);
        });

        polyline.bindTooltip(
          `Vehicle ${route.vehicleId}: ${(route.distance / 1000).toFixed(1)} km, ${Math.round(route.duration / 60)} min`,
          { sticky: true }
        );
      });
    }
  }, [depot, jobs, response, selectedVehicleId, onSelectVehicle]);

  // Controlled fitBounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || shouldFitBoundsTrigger <= 0) return;

    const boundsPoints: L.LatLngExpression[] = [];
    if (depot && depot.latitude && depot.longitude) {
      boundsPoints.push([depot.latitude, depot.longitude]);
    }
    jobs.forEach((j) => {
      if (j.latitude && j.longitude) boundsPoints.push([j.latitude, j.longitude]);
    });

    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  }, [shouldFitBoundsTrigger]);

  const handleFitClick = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const boundsPoints: L.LatLngExpression[] = [];
    if (depot && depot.latitude && depot.longitude) {
      boundsPoints.push([depot.latitude, depot.longitude]);
    }
    jobs.forEach((j) => {
      if (j.latitude && j.longitude) boundsPoints.push([j.latitude, j.longitude]);
    });
    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top-Left Controls (Planning Inputs Toggle + Fit Bounds) */}
      <div className="absolute top-3.5 left-3.5 z-[1000] flex items-center gap-2">
        {!isSidebarOpen && onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="bg-white border border-slate-200 text-slate-800 hover:text-slate-900 hover:bg-slate-50 px-2.5 py-1.5 rounded-md shadow-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer h-8.5"
            title="Open Planning Inputs sidebar"
          >
            <PanelLeft className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Planning Inputs</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleFitClick}
          className="bg-white border border-slate-200 text-slate-800 hover:text-slate-900 hover:bg-slate-50 px-2.5 py-1.5 rounded-md shadow-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer h-8.5"
          title="Fit map to encompass all route locations"
        >
          <Maximize2 className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          <span>Fit Bounds</span>
        </button>
      </div>

      {/* Resize Drag Transparent Overlay */}
      {isResizing && <div className="absolute inset-0 z-[1500] bg-transparent pointer-events-auto" />}
    </div>
  );
};
