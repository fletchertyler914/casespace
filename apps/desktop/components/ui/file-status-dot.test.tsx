import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileStatusDot } from "@/components/ui/file-status-dot";

describe("FileStatusDot", () => {
  it("exposes status in title when showTitle is set", () => {
    render(<FileStatusDot status="in_review" showTitle />);
    expect(screen.getByTitle("in review")).toBeInTheDocument();
  });
});
