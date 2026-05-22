"use client";

import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "./pdf-viewer-theme.css";
import { useTheme } from "@/components/providers/theme-provider";
import { renderCaseSpacePdfToolbar } from "./pdf-toolbar";

interface PdfFilePreviewProps {
  fileUrl: string;
}

export function PdfFilePreview({ fileUrl }: PdfFilePreviewProps) {
  const { resolvedTheme } = useTheme();
  const pdfTheme = resolvedTheme === "dark" ? "dark" : "light";

  // CRITICAL: defaultLayoutPlugin() registers internal hooks. It must be
  // called inline during render — NOT inside useMemo — otherwise React
  // sees a different hook count between renders and throws error #300.
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    renderToolbar: renderCaseSpacePdfToolbar,
  });

  return (
    <div
      className="pdf-preview-root h-full min-h-0 w-full"
      data-pdf-theme={pdfTheme}
    >
      <Worker workerUrl="/pdf.worker.min.js">
        <Viewer
          fileUrl={fileUrl}
          plugins={[defaultLayoutPluginInstance]}
          theme={pdfTheme}
          defaultScale={SpecialZoomLevel.PageFit}
        />
      </Worker>
    </div>
  );
}
