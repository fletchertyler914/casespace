"use client";

import type { OpenDialogOptions } from "@tauri-apps/plugin-dialog";

export async function selectPaths(
  options: OpenDialogOptions,
): Promise<string[]> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open(options);
    if (!selected) return [];
    return Array.isArray(selected) ? selected : [selected];
  } catch {
    return [];
  }
}

export async function openInShell(path: string): Promise<void> {
  try {
    const { openPath } = await import("@tauri-apps/plugin-opener");
    await openPath(path);
  } catch {
    // ignore; opener unavailable outside Tauri shell
  }
}
