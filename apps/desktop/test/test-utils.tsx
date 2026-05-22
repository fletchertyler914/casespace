import type { ReactElement, ReactNode } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { AppProviders } from "@/components/providers/app-providers";

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppProviders>{children}</AppProviders>
    ),
  });
}
