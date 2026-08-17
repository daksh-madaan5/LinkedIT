// Restrained, professional palette for vehicle route polylines & markers
export const ROUTE_COLORS = [
  '#2563eb', // Blue / Indigo
  '#059669', // Emerald Green
  '#d97706', // Amber / Warm Gold
  '#7c3aed', // Deep Purple
  '#e11d48', // Rose / Crimson
  '#0891b2', // Cyan
  '#4d7c0f', // Olive
  '#c026d3', // Fuchsia
];

export function getVehicleColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

/**
 * GeoJSON stores coordinates as [longitude, latitude].
 * Leaflet requires coordinates as [latitude, longitude].
 * This converts GeoJSON LineString coordinates to Leaflet LatLng Tuples.
 */
export function geoJsonToLeafletCoords(geoJsonCoords: [number, number][]): [number, number][] {
  if (!geoJsonCoords || !Array.isArray(geoJsonCoords)) return [];
  return geoJsonCoords.map(([lng, lat]) => [lat, lng]);
}
