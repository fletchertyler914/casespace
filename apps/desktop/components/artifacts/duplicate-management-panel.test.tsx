import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { DuplicateManagementPanel } from "@/components/artifacts/duplicate-management-panel";
import { renderWithProviders } from "@/test/test-utils";
import {
  mockDuplicateGroups,
  mockFiles,
  MOCK_CASE_ID,
} from "@/test/fixtures/mock-data";

describe("DuplicateManagementPanel", () => {
  it("shows duplicate group stats and file names", () => {
    renderWithProviders(
      <DuplicateManagementPanel
        caseId={MOCK_CASE_ID}
        groups={mockDuplicateGroups}
        files={mockFiles}
        onClose={() => {}}
        onChanged={() => {}}
      />,
    );
    expect(screen.getByText(/duplicate files/i)).toBeInTheDocument();
    expect(screen.getByText(/\(2 files\)/i)).toBeInTheDocument();
    expect(screen.getByText("alpha.pdf")).toBeInTheDocument();
    expect(screen.getByText("beta.txt")).toBeInTheDocument();
  });
});
