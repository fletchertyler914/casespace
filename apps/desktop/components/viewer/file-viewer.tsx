"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { CaseFile } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { commandClient } from "@/lib/command-client";
import {
  arrayBufferFromBase64,
  dataUrlFromBase64,
} from "@/lib/binary-from-base64";
import {
  getFilePreviewKind,
  isUnsupportedPreview,
  mediaMimeType,
  type FilePreviewKind,
} from "@/lib/file-preview";
import { openCaseFile } from "@/lib/open-file";
import { AudioFilePreview } from "./audio-file-preview";
import { CsvFilePreview } from "./csv-file-preview";
import { DocxFilePreview } from "./docx-file-preview";
import { ExternalFilePreview } from "./external-file-preview";
import { ImageFilePreview } from "./image-file-preview";
import { TextFilePreview } from "./text-file-preview";
import { VideoFilePreview } from "./video-file-preview";
import { XlsxFilePreview } from "./xlsx-file-preview";

const PdfFilePreview = dynamic(
  () =>
    import("./pdf-file-preview").then((m) => ({
      default: m.PdfFilePreview,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-6 h-[480px] w-[calc(100%-3rem)]" />,
  },
);

const TEXT_LIMIT = 512_000;

type SheetRow = Array<string | number | null | undefined>;

interface FileViewerProps {
  caseId: string;
  file: CaseFile;
  className?: string;
}

function blobUrlFromBase64(base64: string, mime: string): string {
  const buffer = arrayBufferFromBase64(base64);
  return URL.createObjectURL(new Blob([buffer], { type: mime }));
}

function ViewerFallback({
  fileName,
  onOpenExternal,
  opening,
  message,
}: {
  fileName: string;
  onOpenExternal: () => void;
  opening?: boolean;
  message?: string;
}) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">In-app preview failed</p>
        <p className="max-w-md break-words text-xs text-muted-foreground">
          {message ??
            `We couldn't render ${fileName} in the workspace. You can still open it in your default app.`}
        </p>
      </div>
      <Button onClick={onOpenExternal} disabled={opening}>
        {opening ? "Opening…" : "Open externally"}
      </Button>
    </div>
  );
}

export const FileViewer = memo(function FileViewer({
  caseId,
  file,
  className,
}: FileViewerProps) {
  const kind: FilePreviewKind = getFilePreviewKind(file.fileName);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [docxHtml, setDocxHtml] = useState("");
  const [xlsxRows, setXlsxRows] = useState<SheetRow[]>([]);
  const [xlsxSheet, setXlsxSheet] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [opening, setOpening] = useState(false);

  const openExternal = useCallback(async () => {
    setOpening(true);
    const result = await openCaseFile(caseId, file.filePath);
    setOpening(false);
    if (!result.ok) {
      setError(result.message ?? "Failed to open file");
    }
  }, [caseId, file.filePath]);

  useEffect(() => {
    let cancelled = false;
    let createdBlobUrl: string | null = null;

    async function loadBinary(): Promise<ArrayBuffer | null> {
      const res = await commandClient.readFileBase64(caseId, file.filePath);
      if (cancelled) return null;
      if (!res.ok || !res.data) {
        setError(res.error?.message ?? "Failed to read file");
        return null;
      }
      return arrayBufferFromBase64(res.data);
    }

    async function load() {
      setLoading(true);
      setError("");
      setText("");
      setImageSrc("");
      setPdfUrl("");
      setDocxHtml("");
      setXlsxRows([]);
      setXlsxSheet("");
      setMediaUrl("");

      if (isUnsupportedPreview(kind)) {
        setLoading(false);
        return;
      }

      if (kind === "image") {
        const res = await commandClient.readFileBase64(caseId, file.filePath);
        if (cancelled) return;
        if (!res.ok || !res.data) {
          setError(res.error?.message ?? "Image preview failed");
          setLoading(false);
          return;
        }
        setImageSrc(dataUrlFromBase64(res.data, mediaMimeType(file.fileName)));
        setLoading(false);
        return;
      }

      if (kind === "pdf") {
        const res = await commandClient.readFileBase64(caseId, file.filePath);
        if (cancelled) return;
        if (!res.ok || !res.data) {
          setError(res.error?.message ?? "PDF preview failed");
          setLoading(false);
          return;
        }
        setPdfUrl(dataUrlFromBase64(res.data, "application/pdf"));
        setLoading(false);
        return;
      }

      if (kind === "video" || kind === "audio") {
        const res = await commandClient.readFileBase64(caseId, file.filePath);
        if (cancelled) return;
        if (!res.ok || !res.data) {
          setError(res.error?.message ?? "Media preview failed");
          setLoading(false);
          return;
        }
        // Use blob URL for media so the <video>/<audio> element can seek
        // efficiently without re-decoding a multi-MB base64 string.
        createdBlobUrl = blobUrlFromBase64(
          res.data,
          mediaMimeType(file.fileName),
        );
        setMediaUrl(createdBlobUrl);
        setLoading(false);
        return;
      }

      if (kind === "docx") {
        const buffer = await loadBinary();
        if (cancelled || !buffer) {
          setLoading(false);
          return;
        }
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.default.convertToHtml({
            arrayBuffer: buffer,
          });
          if (cancelled) return;
          setDocxHtml(result.value);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Word preview failed");
        }
        setLoading(false);
        return;
      }

      if (kind === "xlsx") {
        const buffer = await loadBinary();
        if (cancelled || !buffer) {
          setLoading(false);
          return;
        }
        try {
          const XLSX = await import("xlsx-js-style");
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            setError("No sheets found in spreadsheet");
            setLoading(false);
            return;
          }
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            setError("Worksheet not found");
            setLoading(false);
            return;
          }
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as SheetRow[];
          if (cancelled) return;
          setXlsxSheet(sheetName);
          setXlsxRows(data);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Spreadsheet preview failed",
          );
        }
        setLoading(false);
        return;
      }

      // text, code, markdown, csv
      const res = await commandClient.readFileText(caseId, file.filePath);
      if (cancelled) return;
      if (!res.ok || res.data === undefined) {
        setError(res.error?.message ?? "Preview failed");
        setLoading(false);
        return;
      }
      setText(res.data.slice(0, TEXT_LIMIT));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [caseId, file.filePath, file.fileName, kind]);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isUnsupportedPreview(kind)) {
    return (
      <ExternalFilePreview
        fileName={file.fileName}
        onOpenExternal={openExternal}
        opening={opening}
      />
    );
  }

  if (
    error &&
    !text &&
    !imageSrc &&
    !pdfUrl &&
    !docxHtml &&
    !mediaUrl &&
    xlsxRows.length === 0
  ) {
    return (
      <ViewerFallback
        fileName={file.fileName}
        onOpenExternal={openExternal}
        opening={opening}
        message={error}
      />
    );
  }

  if (kind === "image" && imageSrc) {
    return <ImageFilePreview src={imageSrc} alt={file.fileName} />;
  }

  if (kind === "pdf" && pdfUrl) {
    return (
      <div className={className ?? "h-full min-h-0"}>
        <ErrorBoundary
          fallback={
            <ViewerFallback
              fileName={file.fileName}
              onOpenExternal={openExternal}
              opening={opening}
              message="PDF viewer failed to render this document."
            />
          }
        >
          <PdfFilePreview fileUrl={pdfUrl} />
        </ErrorBoundary>
      </div>
    );
  }

  if (kind === "video" && mediaUrl) {
    return <VideoFilePreview src={mediaUrl} fileName={file.fileName} />;
  }

  if (kind === "audio" && mediaUrl) {
    return <AudioFilePreview src={mediaUrl} fileName={file.fileName} />;
  }

  if (kind === "docx" && docxHtml) {
    return <DocxFilePreview html={docxHtml} />;
  }

  if (kind === "xlsx" && !error) {
    return <XlsxFilePreview rows={xlsxRows} sheetName={xlsxSheet} />;
  }

  if (kind === "csv" && text) {
    return <CsvFilePreview content={text} fileName={file.fileName} />;
  }

  if ((kind === "markdown" || kind === "text" || kind === "code") && text) {
    return (
      <TextFilePreview
        content={text}
        variant={kind === "markdown" ? "markdown" : "plain"}
        monospace={kind !== "markdown"}
      />
    );
  }

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      No preview available for this file.
    </div>
  );
});
