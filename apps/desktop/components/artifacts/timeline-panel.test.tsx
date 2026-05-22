import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { TimelinePanel } from "@/components/artifacts/timeline-panel";
import { renderWithProviders } from "@/test/test-utils";
import { mockTimeline, MOCK_CASE_ID } from "@/test/fixtures/mock-data";

describe("TimelinePanel (FLOW-003)", () => {
  it("renders timeline events", () => {
    renderWithProviders(
      <TimelinePanel
        caseId={MOCK_CASE_ID}
        events={mockTimeline}
        onClose={() => {}}
        onChanged={() => {}}
      />,
    );
    expect(screen.getByText(/Interview conducted/i)).toBeInTheDocument();
  });
});
