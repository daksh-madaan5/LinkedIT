export function formatDistance(metres: number): string {
  if (metres == null || isNaN(metres)) return '0 m';
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(1)} km`;
  }
  return `${Math.round(metres)} m`;
}

export function formatDuration(seconds: number): string {
  if (seconds == null || isNaN(seconds)) return '0 min';
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${minutes} min`;
}

export function formatTimeOfDay(secondsFromMidnight: number): string {
  if (secondsFromMidnight == null || isNaN(secondsFromMidnight)) return '--:--';
  const totalMinutes = Math.floor(secondsFromMidnight / 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(hours)}:${pad(mins)}`;
}

export function formatCoordinates(lat: number, lng: number): string {
  if (lat == null || lng == null) return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function formatServiceTime(seconds: number): string {
  if (seconds == null || isNaN(seconds) || seconds === 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const remSec = Math.round(seconds % 60);
  if (mins > 0 && remSec > 0) return `${mins}m ${remSec}s`;
  if (mins > 0) return `${mins}m`;
  return `${remSec}s`;
}

export function formatTimeWindow(start?: number | null, end?: number | null): string {
  if (start == null && end == null) return '-';
  const startStr = start != null ? formatTimeOfDay(start) : '00:00';
  const endStr = end != null ? formatTimeOfDay(end) : '23:59';
  return `${startStr} – ${endStr}`;
}
