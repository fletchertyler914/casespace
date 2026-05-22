import { describe, expect, it } from "vitest";
import { syntaxLanguageFromFileName } from "./code-language";

describe("syntaxLanguageFromFileName", () => {
  it("maps common extensions", () => {
    expect(syntaxLanguageFromFileName("app.tsx")).toBe("tsx");
    expect(syntaxLanguageFromFileName("main.rs")).toBe("rust");
    expect(syntaxLanguageFromFileName("Dockerfile")).toBe("docker");
  });

  it("falls back to text for unknown extensions", () => {
    expect(syntaxLanguageFromFileName("data.xyz")).toBe("text");
  });
});
