"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

interface SplashScreenProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export function SplashScreen({ isVisible, onAnimationComplete }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animatingIn, setAnimatingIn] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const t = window.setTimeout(() => setAnimatingIn(true), 10);
      return () => window.clearTimeout(t);
    }
    setAnimatingIn(false);
    const t = window.setTimeout(() => {
      setShouldRender(false);
      onAnimationComplete?.();
    }, 300);
    return () => window.clearTimeout(t);
  }, [isVisible, onAnimationComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-background",
        "transition-opacity duration-300 ease-in-out",
        animatingIn && isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className={cn(
            "relative transition-all duration-500 ease-out",
            animatingIn && isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <Image
            src="/casespace-owl-icon.png"
            alt="CaseSpace"
            width={128}
            height={128}
            priority
            className="relative h-24 w-24 object-contain drop-shadow-lg md:h-32 md:w-32"
          />
        </div>
        <div
          className={cn(
            "transition-all delay-100 duration-300",
            animatingIn && isVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}
