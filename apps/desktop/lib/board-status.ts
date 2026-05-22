/** Swimlane configuration aligned with v2 backend statuses and v1 UX labels. */

export const BOARD_STATUSES = [
  {
    value: "unreviewed",
    label: "Unreviewed",
    headerClass: "text-muted-foreground",
  },
  {
    value: "in_review",
    label: "In Progress",
    headerClass: "text-blue-400",
  },
  {
    value: "reviewed",
    label: "Reviewed",
    headerClass: "text-green-400",
  },
  {
    value: "flagged",
    label: "Flagged",
    headerClass: "text-yellow-400",
  },
  {
    value: "excluded",
    label: "Excluded",
    headerClass: "text-green-500",
  },
] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number]["value"];

export function normalizeBoardStatus(status: string): BoardStatus {
  if (BOARD_STATUSES.some((s) => s.value === status)) {
    return status as BoardStatus;
  }
  return "unreviewed";
}

export function boardStatusLabel(status: string): string {
  return (
    BOARD_STATUSES.find((s) => s.value === status)?.label ??
    status.replace(/_/g, " ")
  );
}
