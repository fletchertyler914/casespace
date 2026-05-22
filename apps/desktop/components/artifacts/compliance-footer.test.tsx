import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceFooter } from "./compliance-footer";

describe("ComplianceFooter", () => {
  it("renders verified compliance checks", () => {
    render(
      <ComplianceFooter
        checks={[
          {
            id: "ACFE-III.C.2",
            label: "No guilt/innocence opinion",
            status: "verified",
          },
        ]}
      />,
    );
    expect(screen.getByText("Standards Compliance")).toBeInTheDocument();
    expect(screen.getByText("No guilt/innocence opinion")).toBeInTheDocument();
  });
});
