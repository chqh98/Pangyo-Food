const EARTH_RADIUS = 6371000;

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
}

export interface Rect {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** 중심점에서 반경을 덮는 사각형 */
export function boundingRect(lat: number, lng: number, radius: number): Rect {
  const dLat = (radius / EARTH_RADIUS) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  return { minLng: lng - dLng, minLat: lat - dLat, maxLng: lng + dLng, maxLat: lat + dLat };
}

export function splitRect(r: Rect): Rect[] {
  const midLng = (r.minLng + r.maxLng) / 2;
  const midLat = (r.minLat + r.maxLat) / 2;
  return [
    { minLng: r.minLng, minLat: r.minLat, maxLng: midLng, maxLat: midLat },
    { minLng: midLng, minLat: r.minLat, maxLng: r.maxLng, maxLat: midLat },
    { minLng: r.minLng, minLat: midLat, maxLng: midLng, maxLat: r.maxLat },
    { minLng: midLng, minLat: midLat, maxLng: r.maxLng, maxLat: r.maxLat },
  ];
}

/** 도보 시간(분), 분당 약 70m */
export const walkMinutes = (meters: number) => Math.max(1, Math.round(meters / 70));
