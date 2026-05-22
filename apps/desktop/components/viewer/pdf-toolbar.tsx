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
    <div
      className={`flex items-center gap-0.5 [&_.rpv-core__minimal-button]:!m-0 ${className ?? ""}`}
    >
      {children}
    </div>
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
      className="rpv-toolbar grid h-9 w-full grid-cols-[auto_1fr_auto] items-center gap-1 border-b border-border/40 px-2"
      role="toolbar"
      aria-label="PDF controls"
    >
      <ToolbarGroup className="justify-start">
        <ShowSearchPopover />
        <ZoomOut />
        <Zoom />
        <ZoomIn />
      </ToolbarGroup>

      <ToolbarGroup className="justify-center">
        <GoToPreviousPage />
        <span className="inline-flex h-8 items-center gap-1 px-1 text-xs tabular-nums text-muted-foreground">
          <CurrentPageInput />
          <span className="select-none" aria-hidden>
            /
          </span>
          <NumberOfPages />
        </span>
        <GoToNextPage />
      </ToolbarGroup>

      <ToolbarGroup className="justify-end">
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
