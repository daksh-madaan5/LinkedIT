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

export function formatTime12Hour(secondsFromMidnight?: number | null): string {
  if (secondsFromMidnight == null || isNaN(secondsFromMidnight) || secondsFromMidnight < 0) {
    return '-';
  }
  const totalMinutes = Math.floor(secondsFromMidnight / 60);
  const totalHours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;

  const period = totalHours >= 12 ? 'PM' : 'AM';
  let hour12 = totalHours % 12;
  if (hour12 === 0) hour12 = 12;

  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hour12}:${paddedMins} ${period}`;
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
  const startStr = start != null ? formatTime12Hour(start) : '12:00 AM';
  const endStr = end != null ? formatTime12Hour(end) : '11:59 PM';
  return `${startStr} – ${endStr}`;
}

