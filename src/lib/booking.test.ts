import { describe, it, expect } from "vitest";
import { isOverlapping, isValidRange, withinOperatingHours, withinMaxDuration, bookingRef } from "./booking";

const d = (day: number, hour: number) => new Date(2026, 0, 10 + day, hour, 0, 0);

describe("isOverlapping", () => {
  it("detects overlap in both directions", () => {
    expect(isOverlapping(d(0, 10), d(0, 12), d(0, 11), d(0, 13))).toBe(true);
    expect(isOverlapping(d(0, 10), d(0, 12), d(0, 9), d(0, 11))).toBe(true);
  });
  it("allows back-to-back bookings", () => {
    expect(isOverlapping(d(0, 10), d(0, 12), d(0, 12), d(0, 14))).toBe(false);
    expect(isOverlapping(d(0, 12), d(0, 14), d(0, 10), d(0, 12))).toBe(false);
  });
  it("treats identical slots as overlapping", () => {
    expect(isOverlapping(d(0, 10), d(0, 12), d(0, 10), d(0, 12))).toBe(true);
  });
});

describe("isValidRange", () => {
  it("requires end after start", () => {
    expect(isValidRange(d(0, 10), d(0, 12))).toBe(true);
    expect(isValidRange(d(0, 12), d(0, 10))).toBe(false);
  });
});

describe("withinOperatingHours", () => {
  it("accepts bookings inside the window", () => {
    expect(withinOperatingHours(d(0, 8), d(0, 10), 6, 23)).toBe(true);
  });
  it("rejects bookings outside the window", () => {
    expect(withinOperatingHours(d(0, 5), d(0, 7), 6, 23)).toBe(false);
    expect(withinOperatingHours(d(0, 22), d(1, 0), 6, 23)).toBe(false);
  });
  it("accepts 24-hour spaces", () => {
    expect(withinOperatingHours(d(0, 22), d(1, 0), 0, 24)).toBe(false); // crosses midnight: treated as not same-day
    expect(withinOperatingHours(d(0, 10), d(0, 12), 0, 24)).toBe(true);
  });
});

describe("withinMaxDuration", () => {
  it("enforces the max booking length", () => {
    expect(withinMaxDuration(d(0, 8), d(0, 12), 10)).toBe(true);
    expect(withinMaxDuration(d(0, 8), d(1, 8), 10)).toBe(false);
  });
});

describe("bookingRef", () => {
  it("generates MSP-prefixed references", () => {
    expect(bookingRef()).toMatch(/^MSP-\d{6}$/);
  });
});
