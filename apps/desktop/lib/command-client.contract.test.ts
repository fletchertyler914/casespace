import { beforeEach, describe, expect, it, vi } from "vitest";
import { setInvokeForTests } from "@/lib/invoke-bridge";
import { INVOKE_CONTRACTS } from "@/test/command-registry";

describe("commandClient invoke contract (full surface)", () => {
  const mockInvoke = vi.fn();

  beforeEach(() => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue({});
    setInvokeForTests(mockInvoke);
  });

  it.each(INVOKE_CONTRACTS.map((c) => [c.label, c] as const))(
    "%s calls %s",
    async (_label, contract) => {
      await contract.run();
      expect(mockInvoke).toHaveBeenCalled();
      const [command, args] = mockInvoke.mock.calls.at(-1)!;
      expect(command).toBe(contract.command);
      if (contract.matchArgs) {
        expect(contract.matchArgs(args as Record<string, unknown>)).toBe(true);
      }
    },
  );

  it("covers all documented P0 commands", () => {
    expect(INVOKE_CONTRACTS.length).toBeGreaterThanOrEqual(55);
  });
});
