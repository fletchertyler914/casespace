"use client";

interface VideoFilePreviewProps {
  src: string;
  fileName: string;
}

export function VideoFilePreview({ src, fileName }: VideoFilePreviewProps) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center bg-background p-4">
      <video
        src={src}
        controls
        preload="metadata"
        className="h-full max-h-full w-full max-w-full rounded-md bg-black object-contain shadow-md"
        aria-label={fileName}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}
