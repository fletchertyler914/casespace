import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getFileIcon(fileName: string): LucideIcon {
  const lower = fileName.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/.test(lower)) return FileImage;
  if (/\.(mp4|mov|avi|mkv|webm)$/.test(lower)) return FileVideo;
  if (/\.(xlsx?|csv)$/.test(lower)) return FileSpreadsheet;
  if (/\.(txt|md|json|xml|html?|log)$/.test(lower)) return FileText;
  return File;
}
