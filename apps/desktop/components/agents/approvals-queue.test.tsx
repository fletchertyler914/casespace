import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AiFindingDraft } from "@repo/types";
import { ApprovalsQueue } from "./approvals-queue";

const findingDraft: AiFindingDraft = {
  id: "draft-1",
  caseId: "case-1",
  title: "Duplicate invoice pattern",
  description: "Three invoices share sequential numbers on p.2.",
  severity: "high",
  linkedFileIds: ["file-a"],
  pageAnchors: ["p.2"],
  status: "pending",
  createdAt: "2026-05-22T00:00:00Z",
};

describe("ApprovalsQueue", () => {
  it("renders AI finding drafts with page anchor and file name", () => {
    render(
      <ApprovalsQueue
        aiDrafts={[{ kind: "finding", draft: findingDraft }]}
        fileNames={{ "file-a": "invoices.pdf" }}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText(/AI finding — Duplicate invoice pattern/)).toBeInTheDocument();
    expect(screen.getByText(/invoices\.pdf · p\.2/)).toBeInTheDocument();
  });

  it("calls approve handler for finding draft", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <ApprovalsQueue
        aiDrafts={[{ kind: "finding", draft: findingDraft }]}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(onApprove).toHaveBeenCalledWith({
      kind: "finding",
      draft: findingDraft,
    });
  });
});
