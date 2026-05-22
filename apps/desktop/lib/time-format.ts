import type { TimeEntry } from "@repo/types";

export function formatDurationSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

export function formatDurationShort(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatEntryDate(entryDate: string): string {
  return new Date(entryDate).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayUtcDayStart(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00+00:00`;
}

export function entryDisplaySeconds(entry: TimeEntry, nowMs: number): number {
  if (entry.segments?.length) {
    return entry.segments.reduce((sum, seg) => {
      const raw =
        seg.durationSeconds > 0
          ? seg.durationSeconds
          : Math.max(
              0,
              Math.floor(
                ((seg.endedAt ? new Date(seg.endedAt).getTime() : nowMs) -
                  new Date(seg.startedAt).getTime()) /
                  1000,
              ),
            );
      const discount = Math.min(100, Math.max(0, seg.discountPercent ?? 0));
      return sum + Math.floor((raw * (100 - discount)) / 100);
    }, 0);
  }
  return entry.totalSeconds;
}

export function isTodayEntry(entry: TimeEntry): boolean {
  const day = entry.entryDate.slice(0, 10);
  const today = todayUtcDayStart().slice(0, 10);
  return day === today;
}
