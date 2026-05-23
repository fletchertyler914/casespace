import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReportDraft } from "@repo/types";
import { ReportWorkspace } from "./report-workspace";
import { renderWithProviders } from "@/test/test-utils";
import {
  MOCK_CASE_ID,
  mockCaseSummary,
  mockFiles,
  mockFindings,
  mockNotes,
  mockTimeline,
} from "@/test/fixtures/mock-data";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    getReportDraft: vi.fn(),
    generateAndSaveReportDraft: vi.fn(),
    listReportSnapshots: vi.fn(),
    calculateBillingAmount: vi.fn(),
    countApprovedAiFindings: vi.fn(),
    updateReportSection: vi.fn(),
    regenerateReport: vi.fn(),
    runReportComplianceScan: vi.fn(),
    exportReportMarkdown: vi.fn(),
    exportReportDocx: vi.fn(),
    getAiSettings: vi.fn(),
  },
}));

const mockDraft: ReportDraft = {
  id: "draft-1",
  caseId: MOCK_CASE_ID,
  templateId: "cfe-long",
  document: {
    templateId: "cfe-long",
    caseId: MOCK_CASE_ID,
    generatedAt: "2026-01-01T00:00:00Z",
    sections: [
      {
        id: "executive",
        heading: "Executive Summary",
        text: "Initial executive summary.",
        citations: [],
        standardsTags: [],
      },
      {
        id: "findings",
        heading: "Findings",
        text: "Initial findings with evidence.",
        citations: [{ kind: "finding", id: "finding-1", label: "Finding: Key" }],
        standardsTags: ["ACFE-EVIDENCE"],
      },
    ],
    compliance: [],
    markdown: "# Report",
  },
  sectionStatus: { executive: "aiDrafted", findings: "aiDrafted" },
  generatedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function renderWorkspace() {
  return renderWithProviders(
    <ReportWorkspace
      caseId={MOCK_CASE_ID}
      caseSummary={mockCaseSummary}
      files={mockFiles}
      notes={mockNotes}
      findings={mockFindings}
      timeline={mockTimeline}
      navigatorOpen
      onExpandNavigator={() => {}}
    />,
  );
}

describe("ReportWorkspace customer flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.getReportDraft).mockResolvedValue({ ok: true, data: null });
    vi.mocked(commandClient.listReportSnapshots).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(commandClient.calculateBillingAmount).mockResolvedValue({
      ok: true,
      data: {
        caseId: MOCK_CASE_ID,
        amount: 100,
        totalSeconds: 3600,
        totalMinutes: 60,
        billingType: "hourly",
      },
    });
    vi.mocked(commandClient.countApprovedAiFindings).mockResolvedValue({
      ok: true,
      data: 1,
    });
    vi.mocked(commandClient.getAiSettings).mockResolvedValue({
      ok: true,
      data: {
        apiKeySet: true,
        apiKeySource: "keychain",
        model: "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1/chat/completions",
      },
    });
    vi.mocked(commandClient.generateAndSaveReportDraft).mockResolvedValue({
      ok: true,
      data: mockDraft,
    });
    vi.mocked(commandClient.updateReportSection).mockImplementation(
      async (_caseId, _templateId, sectionId, text, status) => ({
        ok: true,
        data: {
          ...mockDraft,
          document: {
            ...mockDraft.document,
            sections: mockDraft.document.sections.map((s) =>
              s.id === sectionId ? { ...s, text } : s,
            ),
          },
          sectionStatus: { ...mockDraft.sectionStatus, [sectionId]: status },
        },
      }),
    );
    vi.mocked(commandClient.regenerateReport).mockResolvedValue({
      ok: true,
      data: mockDraft,
    });
    vi.mocked(commandClient.runReportComplianceScan).mockResolvedValue({
      ok: true,
      data: {
        ok: false,
        items: [
          { id: "reviewed", label: "All sections reviewed", passed: false },
        ],
      },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("shows empty state and generates first draft (Flow A)", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(commandClient.getReportDraft).toHaveBeenCalled();
    });
    expect(screen.getByText(/Build your examination report/i)).toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole("button", { name: /Generate first draft/i })[0]!,
    );
    await waitFor(() => {
      expect(commandClient.generateAndSaveReportDraft).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "cfe-long",
      );
    });
  });

  it("loads persisted draft sections (Flow B)", async () => {
    vi.mocked(commandClient.getReportDraft).mockResolvedValue({
      ok: true,
      data: mockDraft,
    });
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Executive Summary" })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Findings" })).toBeInTheDocument();
  });

  it("mark reviewed updates section status (Flow B)", async () => {
    vi.mocked(commandClient.getReportDraft).mockResolvedValue({
      ok: true,
      data: mockDraft,
    });
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Executive Summary" })).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByRole("button", { name: /Mark reviewed/i })[0]!);
    await waitFor(() => {
      expect(commandClient.updateReportSection).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "cfe-long",
        "executive",
        expect.any(String),
        "reviewed",
      );
    });
  });

  it("regenerate section invokes scoped regen (Flow B)", async () => {
    vi.mocked(commandClient.getReportDraft).mockResolvedValue({
      ok: true,
      data: mockDraft,
    });
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Findings" })).toBeInTheDocument();
    });
    const regenButtons = screen.getAllByRole("button", { name: /^Regenerate$/i });
    await userEvent.click(regenButtons[0]!);
    await waitFor(() => {
      expect(commandClient.regenerateReport).toHaveBeenCalledWith(
        MOCK_CASE_ID,
        "cfe-long",
        expect.objectContaining({ scope: "section" }),
      );
    });
  });

  it("finalize checklist blocks export when incomplete (Flow E)", async () => {
    const reviewedDraft: ReportDraft = {
      ...mockDraft,
      sectionStatus: { executive: "reviewed", findings: "reviewed" },
    };
    vi.mocked(commandClient.getReportDraft).mockResolvedValue({
      ok: true,
      data: reviewedDraft,
    });
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Finalize & export/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: /Finalize & export/i }));
    await waitFor(() => {
      expect(commandClient.runReportComplianceScan).toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: /Export DOCX/i })).toBeDisabled();
  });
});
