import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { FindingsPanel } from "@/components/artifacts/findings-panel";
import { renderWithProviders } from "@/test/test-utils";
import { mockFiles, mockFindings, MOCK_CASE_ID } from "@/test/fixtures/mock-data";

describe("FindingsPanel (FLOW-003)", () => {
  it("renders findings with severity", () => {
    renderWithProviders(
      <FindingsPanel
        caseId={MOCK_CASE_ID}
        files={mockFiles}
        findings={mockFindings}
        onClose={() => {}}
        onChanged={() => {}}
      />,
    );
    expect(screen.getByText("Key finding")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
