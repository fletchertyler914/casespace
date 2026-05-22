import { describe, expect, it } from "vitest";
import { redactForLlm } from "./redaction.js";

describe("redactForLlm", () => {
  it("redacts emails and paths", () => {
    const out = redactForLlm(
      "Contact user@example.com at /Users/secret/file.pdf for $5000",
    );
    expect(out).not.toContain("user@example.com");
    expect(out).not.toContain("/Users/secret");
    expect(out).toContain("[REDACTED_EMAIL]");
  });
});
