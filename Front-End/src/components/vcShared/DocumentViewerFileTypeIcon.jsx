import {
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType as FileBinary,
} from "lucide-react";
import { getFileExtension } from "../../utils/binaryFileHandlers";

/** Small icon keyed by repo path extension (reuse across VC surfaces). */
export default function DocumentViewerFileTypeIcon({
  path,
  className = "size-4 shrink-0",
}) {
  const ext = getFileExtension(path);
  switch (ext) {
    case "pdf":
      return (
        <FileBinary
          aria-hidden
          className={`text-muted dark:text-dark-muted ${className}`}
        />
      );
    case "xlsx":
    case "xls":
    case "csv":
      return (
        <FileSpreadsheet aria-hidden className={`text-green-600 ${className}`} />
      );
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return (
        <FileImage aria-hidden className={`text-purple-600 ${className}`} />
      );
    default:
      return (
        <FileText aria-hidden className={`text-blue-600 ${className}`} />
      );
  }
}
