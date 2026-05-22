import type { CaseBillingConfig, TimeEntry, TimeSegment } from "@repo/types";

function segmentSeconds(seg: TimeSegment, nowMs: number): number {
  if (seg.durationSeconds > 0) return seg.durationSeconds;
  const start = new Date(seg.startedAt).getTime();
  const end = seg.endedAt ? new Date(seg.endedAt).getTime() : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function amountForSeconds(seconds: number, rate: number, unit: string): number {
  switch (unit) {
    case "daily":
      return rate * (seconds / 86400);
    case "weekly":
      return rate * (seconds / (86400 * 7));
    case "monthly":
      return rate * (seconds / (86400 * 30));
    default:
      return rate * (seconds / 3600);
  }
}

export function segmentBillableAmount(
  seg: TimeSegment,
  config: CaseBillingConfig,
  nowMs = Date.now(),
): number {
  const raw = segmentSeconds(seg, nowMs);
  const discount = Math.min(100, Math.max(0, seg.discountPercent ?? 0));
  const billableSecs = Math.floor((raw * (100 - discount)) / 100);
  const rate = seg.rateOverride ?? config.payRate;
  return amountForSeconds(billableSecs, rate, config.rateUnit);
}

export function entryBillableAmount(
  entry: TimeEntry,
  config: CaseBillingConfig,
  nowMs = Date.now(),
): number {
  if (config.billingType === "fixed_price") {
    return config.fixedPrice ?? 0;
  }
  const segments = entry.segments ?? [];
  return segments
    .filter((s) => s.endedAt)
    .reduce((sum, seg) => sum + segmentBillableAmount(seg, config, nowMs), 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
