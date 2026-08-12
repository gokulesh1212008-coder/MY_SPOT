import { describe, it, expect } from "vitest";
import { computePrice, refundTier, refundAmount, roundTo, DEFAULT_PRICING } from "./pricing";

const h = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * 3600_000);

describe("computePrice", () => {
  it("rounds up to 30-minute increments and applies fees", () => {
    const p = computePrice(100, h(0), h(2.25), DEFAULT_PRICING); // 2h15m → 2.5h
    expect(p.minutes).toBe(150);
    expect(p.baseAmount).toBe(250);
    expect(p.feeAmount).toBe(12.5);
    expect(p.taxAmount).toBeCloseTo(47.25, 2);
    expect(p.convenienceFee).toBe(10);
    expect(p.totalAmount).toBeCloseTo(319.75, 2);
  });

  it("computes owner payout after commission", () => {
    const p = computePrice(100, h(0), h(1), DEFAULT_PRICING);
    expect(p.ownerAmount).toBe(85); // 100 - 15%
    expect(p.commissionAmount).toBe(15);
  });

  it("returns zero amounts for invalid ranges", () => {
    const p = computePrice(100, h(2), h(1), DEFAULT_PRICING);
    expect(p.baseAmount).toBe(0);
    expect(p.totalAmount).toBe(10); // only the flat convenience fee
  });
});

describe("roundTo", () => {
  it("rounds to nearest 30 minutes", () => {
    expect(roundTo(0)).toBe(0);
    expect(roundTo(15)).toBe(30);
    expect(roundTo(31)).toBe(60);
    expect(roundTo(120)).toBe(120);
  });
});

describe("refund tiers", () => {
  it("full refund ≥ 24h before start", () => {
    expect(refundTier(new Date(), h(26), DEFAULT_PRICING)).toBe("FULL");
  });
  it("half refund between 24h and 2h", () => {
    expect(refundTier(new Date(), h(12), DEFAULT_PRICING)).toBe("HALF");
    expect(refundTier(new Date(), h(3), DEFAULT_PRICING)).toBe("HALF");
  });
  it("no refund inside 2h", () => {
    expect(refundTier(new Date(), h(1), DEFAULT_PRICING)).toBe("NONE");
    expect(refundTier(new Date(), h(-1), DEFAULT_PRICING)).toBe("NONE");
  });
  it("calculates refund amounts", () => {
    expect(refundAmount("FULL", 320)).toBe(320);
    expect(refundAmount("HALF", 320)).toBe(160);
    expect(refundAmount("NONE", 320)).toBe(0);
  });
});
