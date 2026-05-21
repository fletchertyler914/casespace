"use client";

interface ImageFilePreviewProps {
  src: string;
  alt: string;
}

export function ImageFilePreview({ src, alt }: ImageFilePreviewProps) {
  return (
    <div className="flex min-h-[280px] items-center justify-center p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[calc(100vh-12rem)] max-w-full object-contain"
      />
    </div>
  );
}
