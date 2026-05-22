import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BillingConfigDialog } from "@/components/billing/billing-config-dialog";
import { renderWithProviders } from "@/test/test-utils";
import { commandClient } from "@/lib/command-client";

vi.mock("@/lib/command-client", () => ({
  commandClient: {
    getCaseBillingConfig: vi.fn(),
    setCaseBillingConfig: vi.fn(),
  },
}));

describe("BillingConfigDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commandClient.getCaseBillingConfig).mockResolvedValue({
      ok: true,
      data: {
        caseId: "c1",
        billingType: "fixed_price",
        fixedPrice: 0,
        payRate: 0,
        rateUnit: "hourly",
      },
    });
    vi.mocked(commandClient.setCaseBillingConfig).mockResolvedValue({
      ok: true,
      data: {
        caseId: "c1",
        billingType: "fixed_price",
        fixedPrice: 5000,
        payRate: 0,
        rateUnit: "hourly",
      },
    });
  });

  it("requires fixed price when fixed billing selected", async () => {
    renderWithProviders(
      <BillingConfigDialog open onOpenChange={() => {}} caseId="c1" />,
    );
    await waitFor(() => screen.getByText("Billing configuration"));
    const fixedInput = screen.getByLabelText(/Fixed price/i);
    await userEvent.clear(fixedInput);
    await userEvent.click(screen.getByRole("button", { name: /^Save$/i }));
    expect(
      screen.getByText(/Fixed price must be zero or greater/i),
    ).toBeInTheDocument();
  });
});
