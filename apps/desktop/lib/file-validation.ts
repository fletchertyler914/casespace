export function extractExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return "";
  return fileName.slice(i);
}

export function getFilenameWithoutExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return fileName;
  return fileName.slice(0, i);
}

export function validateFilename(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Name cannot be empty" };
  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return { valid: false, error: "Name cannot contain path separators" };
  }
  if (trimmed === "." || trimmed === "..") {
    return { valid: false, error: "Invalid name" };
  }
  return { valid: true };
}

/** Count files across source paths (folders via backend, files as 1 each). */
export async function countSourceFiles(paths: string[]): Promise<number> {
  const { commandClient } = await import("@/lib/command-client");
  let total = 0;
  for (const path of paths) {
    const res = await commandClient.countDirectoryFiles(path);
    total += res.ok && res.data != null ? Number(res.data) : 1;
  }
  return total;
}
