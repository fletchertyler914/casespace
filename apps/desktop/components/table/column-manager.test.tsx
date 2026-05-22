import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnManager } from "@/components/table/column-manager";
import { renderWithProviders } from "@/test/test-utils";
import { DEFAULT_COLUMN_CONFIG } from "@/lib/mapping/types";

describe("ColumnManager", () => {
  it("toggles column visibility", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ColumnManager config={DEFAULT_COLUMN_CONFIG} onChange={onChange} />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]!);
    expect(onChange).toHaveBeenCalled();
  });
});
