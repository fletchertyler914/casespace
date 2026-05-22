/** v1-style status colors (solid dot, not text badge). */
const STATUS_DOT_CLASS = {
  unreviewed: "bg-amber-500 dark:bg-amber-400",
  in_review: "bg-blue-500 dark:bg-blue-400",
  reviewed: "bg-green-500 dark:bg-green-400",
  flagged: "bg-yellow-500 dark:bg-yellow-400",
  excluded: "bg-muted-foreground/60",
} as const;

const DEFAULT_DOT = STATUS_DOT_CLASS.unreviewed;

export function getFileStatusDotClass(status: string | undefined): string {
  const key = status as keyof typeof STATUS_DOT_CLASS;
  if (key in STATUS_DOT_CLASS) {
    return STATUS_DOT_CLASS[key];
  }
  return DEFAULT_DOT;
}

export function getFileStatusLabel(status: string | undefined): string {
  return (status ?? "unreviewed").replace(/_/g, " ");
}
