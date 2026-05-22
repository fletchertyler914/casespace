"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  elementSupportsFullscreen,
  tryEnterElementFullscreen,
  tryExitFullscreen,
} from "@/lib/preview-fullscreen";

interface ImageFilePreviewProps {
  src: string;
  alt: string;
}

export function ImageFilePreview({ src, alt }: ImageFilePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (fullscreen || expandedPreview) {
      setExpandedPreview(false);
      setFullscreen(false);
      await tryExitFullscreen();
      return;
    }
    if (elementSupportsFullscreen(el)) {
      const entered = await tryEnterElementFullscreen(el);
      if (entered) {
        setFullscreen(true);
        return;
      }
    }
    setExpandedPreview(true);
  }, [expandedPreview, fullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreen(active);
      if (!active) setExpandedPreview(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex min-h-[280px] flex-col bg-muted/20",
        expandedPreview &&
          !fullscreen &&
          "fixed inset-0 z-[200] min-h-0 bg-background",
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-end gap-0.5 border-b border-border/40 px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Zoom out"
          onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Zoom in"
          onClick={() => setScale((s) => Math.min(4, s + 0.25))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Rotate"
          onClick={() => setRotation((r) => (r + 90) % 360)}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={
            fullscreen || expandedPreview ? "Exit fullscreen" : "Fullscreen"
          }
          onClick={() => void toggleFullscreen()}
        >
          {fullscreen || expandedPreview ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-none object-contain transition-transform duration-150"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            maxHeight: fullscreen ? "100vh" : "calc(100vh - 12rem)",
          }}
        />
      </div>
    </div>
  );
}
