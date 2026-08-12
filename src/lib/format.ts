export function formatMoney(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${h} hr ${m} min`;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
