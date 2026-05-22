"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SplashScreen } from "@/components/splash-screen";

const SPLASH_SESSION_KEY = "casespace.splashShown";

export function AppProviders({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem(SPLASH_SESSION_KEY);
      if (!shown) {
        setShowSplash(true);
        const timer = window.setTimeout(() => handleSplashComplete(), 1200);
        return () => window.clearTimeout(timer);
      }
    } catch {
      setShowSplash(false);
    }
  }, []);

  function handleSplashComplete() {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setShowSplash(false);
  }

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={150}>
        <ErrorBoundary>
          <SplashScreen
            isVisible={showSplash}
            onAnimationComplete={handleSplashComplete}
          />
          {children}
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
