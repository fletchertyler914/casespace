export function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const trimmed = dateStr.trim();
  const pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = trimmed.match(pattern);
  if (!match) return false;
  const [, monthStr, dayStr, yearStr] = match;
  if (!monthStr || !dayStr || !yearStr) return false;
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export function parseDate(dateStr: string): Date | null {
  if (!isValidDateFormat(dateStr)) return null;
  const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, monthStr, dayStr, yearStr] = match;
  if (!monthStr || !dayStr || !yearStr) return null;
  return new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10),
  );
}

export function getDateErrorMessage(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return "";
  if (!isValidDateFormat(dateStr)) {
    return "Invalid date format. Use MM/DD/YYYY (e.g., 11/20/2025)";
  }
  return "";
}
