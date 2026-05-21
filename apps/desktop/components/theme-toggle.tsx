"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const icon =
    theme === "system" ? (
      <Monitor className="h-4 w-4" />
    ) : resolvedTheme === "light" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  const label =
    theme === "system"
      ? `System (${resolvedTheme}) \u2014 click for light`
      : theme === "light"
        ? "Light \u2014 click for dark"
        : "Dark \u2014 click for system";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
