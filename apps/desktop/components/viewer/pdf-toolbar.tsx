"use client";

import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  Printer,
  Search,
} from "lucide-react";
import type { ToolbarProps, ToolbarSlot } from "@react-pdf-viewer/default-layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewerChromeDivider } from "@/components/viewer/viewer-chrome";
import { cn } from "@/lib/utils";

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200] as const;

function PdfIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function CaseSpacePdfToolbar({ slots }: { slots: ToolbarSlot }) {
  const {
    CurrentPageLabel,
    Download: DownloadSlot,
    GoToNextPage,
    GoToPreviousPage,
    Print,
    ShowSearchPopover,
    Zoom,
    ZoomIn,
    ZoomOut,
  } = slots;

  return (
    <div
      className={cn(
        "casespace-pdf-toolbar grid h-9 w-full shrink-0 items-center",
        "grid-cols-3 gap-2 border-b border-border/40 bg-background px-3",
      )}
      role="toolbar"
      aria-label="PDF controls"
      data-testid="pdf-toolbar"
    >
      <div className="flex items-center gap-0.5 justify-self-start">
        <ShowSearchPopover>
          {({ onClick }) => (
            <PdfIconButton label="Search document" onClick={onClick}>
              <Search className="h-4 w-4" />
            </PdfIconButton>
          )}
        </ShowSearchPopover>

        <ViewerChromeDivider />

        <GoToPreviousPage>
          {({ isDisabled, onClick }) => (
            <PdfIconButton
              label="Previous page"
              disabled={isDisabled}
              onClick={onClick}
            >
              <ChevronLeft className="h-4 w-4" />
            </PdfIconButton>
          )}
        </GoToPreviousPage>

        <CurrentPageLabel>
          {({ currentPage, numberOfPages }) => {
            const displayPage =
              numberOfPages > 0 ? Math.max(1, currentPage) : currentPage;
            return (
              <span
                className="min-w-[3rem] select-none text-center text-xs tabular-nums text-muted-foreground"
                aria-live="polite"
              >
                {displayPage} / {Math.max(numberOfPages, 0)}
              </span>
            );
          }}
        </CurrentPageLabel>

        <GoToNextPage>
          {({ isDisabled, onClick }) => (
            <PdfIconButton
              label="Next page"
              disabled={isDisabled}
              onClick={onClick}
            >
              <ChevronRight className="h-4 w-4" />
            </PdfIconButton>
          )}
        </GoToNextPage>
      </div>

      <div className="flex items-center gap-0.5 justify-self-center">
        <ZoomOut>
          {({ onClick }) => (
            <PdfIconButton label="Zoom out" onClick={onClick}>
              <Minus className="h-4 w-4" />
            </PdfIconButton>
          )}
        </ZoomOut>

        <Zoom>
          {({ scale, onZoom }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 min-w-[3.5rem] shrink-0 px-2 tabular-nums text-xs font-medium text-muted-foreground hover:text-foreground"
                  aria-label="Zoom level"
                >
                  {Math.round(scale * 100)}%
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[5rem]">
                {ZOOM_PRESETS.map((pct) => (
                  <DropdownMenuItem
                    key={pct}
                    className="tabular-nums"
                    onClick={() => onZoom(pct / 100)}
                  >
                    {pct}%
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Zoom>

        <ZoomIn>
          {({ onClick }) => (
            <PdfIconButton label="Zoom in" onClick={onClick}>
              <Plus className="h-4 w-4" />
            </PdfIconButton>
          )}
        </ZoomIn>
      </div>

      <div className="flex items-center gap-0.5 justify-self-end">
        <Print>
          {({ onClick }) => (
            <PdfIconButton label="Print" onClick={onClick}>
              <Printer className="h-4 w-4" />
            </PdfIconButton>
          )}
        </Print>

        <DownloadSlot>
          {({ onClick }) => (
            <PdfIconButton label="Download" onClick={onClick}>
              <Download className="h-4 w-4" />
            </PdfIconButton>
          )}
        </DownloadSlot>
      </div>
    </div>
  );
}

export function renderCaseSpacePdfToolbar(
  Toolbar: (props: ToolbarProps) => React.ReactElement,
) {
  return (
    <Toolbar>
      {(toolbarSlot) => <CaseSpacePdfToolbar slots={toolbarSlot} />}
    </Toolbar>
  );
}
