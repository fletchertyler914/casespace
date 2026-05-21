"use client";

import { Music } from "lucide-react";

interface AudioFilePreviewProps {
  src: string;
  fileName: string;
}

export function AudioFilePreview({ src, fileName }: AudioFilePreviewProps) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-6 rounded-lg border border-border/40 bg-card/60 p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Music className="h-8 w-8" />
          </div>
          <p
            className="break-words text-sm font-medium text-foreground"
            title={fileName}
          >
            {fileName}
          </p>
        </div>
        <audio
          src={src}
          controls
          preload="metadata"
          className="w-full"
          aria-label={fileName}
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    </div>
  );
}
