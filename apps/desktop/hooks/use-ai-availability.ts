"use client";

import { useEffect, useState } from "react";
import type { AiSettings } from "@repo/types";
import { commandClient } from "@/lib/command-client";

export function useAiAvailability() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void commandClient.getAiSettings().then((res) => {
      if (cancelled) return;
      setSettings(res.ok && res.data ? res.data : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    settings,
    aiAvailable: Boolean(settings?.apiKeySet),
  };
}
