import { commandClient } from "@/lib/command-client";
import { openInShell } from "@/lib/tauri-dialog";

/** Validate path against case roots, then open in the system default app. */
export async function openCaseFile(
  caseId: string,
  filePath: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await commandClient.openFile(caseId, filePath);
  if (!res.ok || !res.data) {
    return { ok: false, message: res.error?.message ?? "Cannot open file" };
  }
  await openInShell(res.data);
  return { ok: true };
}
