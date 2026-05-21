"use client";

import type { ReactNode } from "react";
import { RotateDirection } from "@react-pdf-viewer/core";
import type { ToolbarProps, ToolbarSlot } from "@react-pdf-viewer/default-layout";

function ToolbarGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`}>{children}</div>
  );
}

function CaseSpacePdfToolbar({ slots }: { slots: ToolbarSlot }) {
  const {
    CurrentPageInput,
    GoToNextPage,
    GoToPreviousPage,
    NumberOfPages,
    Zoom,
    ZoomIn,
    ZoomOut,
    ShowSearchPopover,
    Download,
    Print,
    Rotate,
  } = slots;

  return (
    <div
      className="rpv-toolbar flex h-10 w-full items-center gap-1 px-2"
      role="toolbar"
      aria-label="PDF controls"
    >
      <ToolbarGroup className="shrink-0">
        <ShowSearchPopover />
      </ToolbarGroup>

      <ToolbarGroup className="min-w-0 flex-1 justify-center">
        <ZoomOut />
        <Zoom />
        <ZoomIn />
      </ToolbarGroup>

      <ToolbarGroup className="shrink-0">
        <GoToPreviousPage />
        <span className="flex items-center gap-1 px-1 text-xs tabular-nums text-muted-foreground">
          <CurrentPageInput />
          <span aria-hidden>/</span>
          <NumberOfPages />
        </span>
        <GoToNextPage />
        <span className="mx-1 h-5 w-px bg-border/50" aria-hidden />
        <Rotate direction={RotateDirection.Forward} />
        <Download />
        <Print />
      </ToolbarGroup>
    </div>
  );
}

/** Toolbar without open/fullscreen/theme — app theme drives the reader chrome. */
export function renderCaseSpacePdfToolbar(
  Toolbar: (props: ToolbarProps) => React.ReactElement,
) {
  return (
    <Toolbar>
      {(toolbarSlot) => <CaseSpacePdfToolbar slots={toolbarSlot} />}
    </Toolbar>
  );
}
