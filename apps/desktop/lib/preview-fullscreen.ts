/** Element fullscreen with webkit prefix; false when API unavailable (e.g. some Tauri webviews). */
export async function tryEnterElementFullscreen(el: HTMLElement): Promise<boolean> {
  const target = el as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
  };
  const request =
    target.requestFullscreen?.bind(target) ??
    target.webkitRequestFullscreen?.bind(target);
  if (!request) return false;
  try {
    await request();
    return true;
  } catch {
    return false;
  }
}

export async function tryExitFullscreen(): Promise<void> {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Native fullscreen may be unsupported or already exited.
  }
}

export function elementSupportsFullscreen(el: HTMLElement): boolean {
  const target = el as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
  };
  return (
    typeof target.requestFullscreen === "function" ||
    typeof target.webkitRequestFullscreen === "function"
  );
}
