export interface LocationRequest {
  id: string;
  latitude: number;
  longitude: number;
}

export interface VehicleRequest {
  id: string;
  capacity: number;
  startLocation?: LocationRequest | null;
  endLocation?: LocationRequest | null;
}

export interface TimeWindowRequest {
  start: number; // seconds
  end: number;   // seconds
}

export interface DeliveryRequest {
  id: string;
  latitude: number;
  longitude: number;
  demand: number;
  serviceDuration: number; // seconds
  priority?: number | null; // 1 to 10
  timeWindow?: TimeWindowRequest | null;
}

export interface OptimizationRequest {
  depot: LocationRequest;
  vehicles: VehicleRequest[];
  jobs: DeliveryRequest[];
}

export interface StopResponse {
  jobId: string;
  sequence: number;
  latitude: number;
  longitude: number;
  arrivalTime: number;   // seconds
  departureTime: number; // seconds
  remainingLoad: number;
}

export interface RouteGeometry {
  type: string; // "LineString"
  coordinates: [number, number][]; // [longitude, latitude] in GeoJSON
}

export interface RouteResponse {
  vehicleId: string;
  stops: StopResponse[];
  distance: number;      // metres
  duration: number;      // seconds
  initialLoad: number;
  deliveredLoad: number;
  geometry: RouteGeometry;
}

export interface OptimizationSummary {
  totalDistance: number;  // metres
  totalDuration: number;  // seconds
  vehiclesUsed: number;   // Exact backend field name
  totalJobs: number;
  assignedJobs: number;
  unassignedJobs: number;
  objectiveCost: number;
}

export interface OptimizationResponse {
  routes: RouteResponse[];
  unassignedJobs: string[];
  summary: OptimizationSummary;
}

export interface ApiErrorResponse {
  code: 'INVALID_REQUEST' | 'INVALID_JSON' | 'ROUTING_PROVIDER_FAILED' | 'OPTIMIZATION_FAILED';
  errors: string[];
}
