export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

/** Demo presets (Mumbai) so search works without a geocoder API key. */
export const CITIES: Place[] = [
  { name: "Gateway of India, Mumbai", lat: 18.922, lng: 72.8347 },
  { name: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295 },
  { name: "Andheri East, Mumbai", lat: 19.1136, lng: 72.8697 },
  { name: "Powai, Mumbai", lat: 19.1176, lng: 72.906 },
  { name: "Colaba, Mumbai", lat: 18.9067, lng: 72.8147 },
  { name: "Thane, Mumbai", lat: 19.2183, lng: 72.9781 },
];

export const DEFAULT_CENTER = CITIES[0];
