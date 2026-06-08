import { CheckCircle2, Download, FileArchive, Upload } from "lucide-react";
import { useState } from "react";
import SettingsSectionCard from "./SettingsSectionCard";
import { useUploadVicExecutable } from "../services/useApi";
import { FILE } from "../services/RouteConfig";

function HealthPill({ label, value }) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(4rem,auto)] items-start gap-x-2 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
      <CheckCircle2 className="size-4 shrink-0" strokeWidth={1.8} />
      <span className="font-semibold">{label}</span>
      <span className="col-span-2 min-w-0 break-all font-mono leading-5 opacity-80">
        {value}
      </span>
    </div>
  );
}

export default function CliApplicationSettingsTab() {
  const [vicFile, setVicFile] = useState(null);
  const [lastUpload, setLastUpload] = useState(null);
  const uploadVicExecutable = useUploadVicExecutable({
    onSuccess: (data) => {
      setLastUpload(data);
      setVicFile(null);
    },
  });

  const submitVicExecutable = () => {
    if (!vicFile || !vicFile.name.toLowerCase().endsWith(".exe")) return;
    uploadVicExecutable.mutate({ file: vicFile });
  };
  const canUpload =
    Boolean(vicFile) &&
    vicFile.name.toLowerCase().endsWith(".exe") &&
    !uploadVicExecutable.isPending;

  const startDownloadCheck = () => {
    const link = document.createElement("a");
    link.href = FILE.CLI_APPLICATION.DOWNLOAD_RAW("vic.exe");
    link.download = "vic.exe";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={FileArchive}
        title="CLI application"
        description="Upload the Windows vic.exe file that public documentation users can download."
        action={
          <button
            type="button"
            onClick={submitVicExecutable}
            disabled={!canUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-dark-shell dark:hover:bg-emerald-400"
          >
            <Upload className="h-4 w-4" />
            {uploadVicExecutable.isPending ? "Uploading..." : "Upload to file-service"}
          </button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-(--color-light-input-border) bg-(--color-light-input-bg) p-5 text-center transition-colors hover:border-(--color-light-input-border-focus) dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:hover:border-(--color-dark-input-border-focus)">
            <Upload className="size-8 text-muted dark:text-dark-muted" strokeWidth={1.8} />
            <span className="mt-3 text-sm font-semibold text-primary dark:text-dark-primary">
              {vicFile?.name || "Choose vic.exe"}
            </span>
            <span className="mt-1 text-xs text-muted dark:text-dark-muted">
              Only Windows executable files are accepted.
            </span>
            {vicFile && !vicFile.name.toLowerCase().endsWith(".exe") ? (
              <span className="mt-2 text-xs font-semibold text-error">
                Please choose a .exe file.
              </span>
            ) : null}
            <input
              type="file"
              accept=".exe,application/octet-stream"
              onChange={(event) => setVicFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-sm font-semibold text-primary dark:text-dark-primary">
              File-service readiness
            </p>
            <div className="mt-3 grid gap-2">
              <HealthPill label="Bucket" value="cli-applications" />
              <HealthPill label="Object" value="latest/vic.exe" />
              <HealthPill
                label="Public"
                value="/file/cli-application/raw/vic.exe"
              />
            </div>
            {lastUpload ? (
              <p className="mt-3 text-xs leading-5 text-emerald-700 dark:text-emerald-300">
                Last upload is ready. Documentation downloads this file as{" "}
                <span className="font-mono">vic.exe</span>.
              </p>
            ) : null}
            <button
              type="button"
              onClick={startDownloadCheck}
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15"
            >
              <Download className="size-4" strokeWidth={1.8} />
              Test public download
            </button>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
