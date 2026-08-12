import { describe, it, expect } from "vitest";
import { haversineKm, formatDistance } from "./geo";

describe("haversineKm", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineKm(18.922, 72.8347, 18.922, 72.8347)).toBeLessThan(0.001);
  });

  it("computes a plausible distance between two Mumbai points", () => {
    const km = haversineKm(18.922, 72.8347, 19.1176, 72.906); // Colaba → Powai
    expect(km).toBeGreaterThan(20);
    expect(km).toBeLessThan(30);
  });
});

describe("formatDistance", () => {
  it("formats meters and kilometers", () => {
    expect(formatDistance(0.4)).toBe("400 m");
    expect(formatDistance(3.25)).toBe("3.3 km");
  });
});
