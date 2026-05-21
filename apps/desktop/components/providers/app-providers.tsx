"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={150}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
