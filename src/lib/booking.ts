/** Statuses that occupy a space's time slot and must block new/overlapping bookings. */
export const BLOCKING_STATUSES = [
  "PAYMENT_PENDING",
  "CONFIRMED",
  "ACTIVE",
  "CHECKED_IN",
] as const;

export function isOverlapping(existingStart: Date, existingEnd: Date, start: Date, end: Date): boolean {
  return existingStart.getTime() < end.getTime() && existingEnd.getTime() > start.getTime();
}

export function isValidRange(start: Date, end: Date): boolean {
  return start.getTime() < end.getTime();
}

/** A booking must fit inside the space's operating hours window [openHour, closeHour). */
export function withinOperatingHours(
  start: Date,
  end: Date,
  openHour: number,
  closeHour: number
): boolean {
  if (closeHour <= openHour) return false; // 24h window represented as open=0, close=24
  const startHour = start.getHours();
  const endHour = end.getHours();
  const sameDay = start.toDateString() === end.toDateString();
  return startHour >= openHour && endHour <= closeHour && sameDay;
}

/** Approximate maximum booking length guard (configurable via settings.maxBookingHours). */
export function withinMaxDuration(start: Date, end: Date, maxHours: number): boolean {
  return (end.getTime() - start.getTime()) / 3600000 <= maxHours;
}

export function bookingRef(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return `MSP-${String(n).padStart(6, "0")}`;
}
