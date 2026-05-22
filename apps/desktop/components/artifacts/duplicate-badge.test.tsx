import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { DuplicateBadge } from "@/components/artifacts/duplicate-badge";
import { renderWithProviders } from "@/test/test-utils";

describe("DuplicateBadge", () => {
  it("labels primary duplicates", () => {
    renderWithProviders(<DuplicateBadge isPrimary />);
    expect(screen.getByLabelText("Primary duplicate")).toBeInTheDocument();
  });

  it("labels non-primary duplicates", () => {
    renderWithProviders(<DuplicateBadge isPrimary={false} />);
    expect(screen.getByLabelText("Duplicate file")).toBeInTheDocument();
  });
});
