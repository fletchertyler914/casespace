export type InvokeFn = <T>(
  command: string,
  args?: Record<string, unknown>,
) => Promise<T>;

declare global {
  interface Window {
    /** Set by Playwright `addInitScript` for browser E2E without Tauri. */
    __CASESPACE_MOCK_INVOKE__?: InvokeFn;
  }
}

let testInvoke: InvokeFn | null = null;

/** Replace invoke for Vitest (pass `null` to reset). */
export function setInvokeForTests(fn: InvokeFn | null): void {
  testInvoke = fn;
}

async function resolveInvoke(): Promise<InvokeFn> {
  if (testInvoke) {
    return testInvoke;
  }
  if (typeof window !== "undefined" && window.__CASESPACE_MOCK_INVOKE__) {
    return window.__CASESPACE_MOCK_INVOKE__;
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke as InvokeFn;
}

export async function invoke<T>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const fn = await resolveInvoke();
  return fn<T>(command, args);
}
