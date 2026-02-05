export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface CoordinateWithTimestamp extends Coordinate {
  timestamp: number;
  accuracy?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds - duration in seconds
 * @returns formatted string like "5:32" or "1:05:32"
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format distance in kilometers to human-readable string
 * @param km - distance in kilometers
 * @returns formatted string like "2.54 km"
 */
export function formatDistance(km: number): string {
  return `${km.toFixed(2)} km`;
}

/**
 * Calculate average speed
 * @param distanceKm - distance in kilometers
 * @param durationSeconds - duration in seconds
 * @returns speed in km/h
 */
export function calculateSpeed(distanceKm: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  return distanceKm / (durationSeconds / 3600);
}
