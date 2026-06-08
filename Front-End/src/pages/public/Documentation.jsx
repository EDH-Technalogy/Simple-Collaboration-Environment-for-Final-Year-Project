import {
  Check,
  Clipboard,
  Download,
  FileCode2,
  Search,
  TerminalSquare,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BlogShell } from "../blog/BlogShell";
import { FILE } from "../../services/RouteConfig";

const SECTIONS = ["overview", "windows", "quick", "commands", "workflows"];

const WINDOWS_SETUP =
  "mkdir C:\\Tools\\vic\ncopy .\\vic.exe C:\\Tools\\vic\\vic.exe\n# Add C:\\Tools\\vic to your user PATH\nvic --help";

const QUICK_START =
  'vic init my-project\ncd my-project\nvic auth login http://localhost:3000\nvic add .\nvic status\nvic diff --staged\nvic commit -m "Initial commit"\nvic log';

const COMMANDS = [
  {
    id: "init",
    syntax: "vic init [directory]",
    examples: ["vic init", "vic init my-project"],
  },
  {
    id: "authLogin",
    syntax: "vic auth login <server-url>",
    examples: ["vic auth login http://localhost:3000"],
  },
  {
    id: "authLogout",
    syntax: "vic auth logout <server-url>",
    examples: ["vic auth logout http://localhost:3000"],
  },
  {
    id: "add",
    syntax: "vic add <path>...",
    examples: ["vic add main.go", "vic add cmd internal", "vic add ."],
  },
  {
    id: "status",
    syntax: "vic status",
    examples: ["vic status"],
  },
  {
    id: "diff",
    syntax: "vic diff [--staged] [paths...]",
    examples: ["vic diff", "vic diff --staged", "vic diff cmd/status.go"],
  },
  {
    id: "commit",
    syntax: 'vic commit -m "<message>"',
    examples: ['vic commit -m "Add profile page"'],
  },
  {
    id: "log",
    syntax: "vic log",
    examples: ["vic log"],
  },
  {
    id: "branch",
    syntax: "vic branch [-a|-r|-d] [name]",
    examples: [
      "vic branch",
      "vic branch feature/login",
      "vic branch -d old-feature",
      "vic branch -r",
      "vic branch -a",
    ],
  },
  {
    id: "checkout",
    syntax: "vic checkout [-b] <branch|commit>",
    examples: [
      "vic checkout main",
      "vic checkout origin/main",
      "vic checkout -b feature/auth main",
    ],
  },
  {
    id: "merge",
    syntax: "vic merge <branch>",
    examples: [
      "vic merge feature-x",
      "vic merge --continue",
      "vic merge --abort",
    ],
  },
  {
    id: "remote",
    syntax: "vic remote add/list/get-url/set-token",
    examples: [
      "vic remote add origin http://localhost:3000/api/repos/acme/demo",
      "vic remote list",
      "vic remote get-url origin",
      "vic remote set-token origin <token>",
    ],
  },
  {
    id: "clone",
    syntax: "vic clone <url> [directory]",
    examples: [
      "vic clone http://localhost:3000/api/repos/acme/demo",
      "vic clone http://localhost:3000/api/repos/acme/demo demo-local",
    ],
  },
  {
    id: "fetch",
    syntax: "vic fetch <remote>",
    examples: ["vic fetch origin"],
  },
  {
    id: "pull",
    syntax: "vic pull <remote> <branch>",
    examples: ["vic pull origin main"],
  },
  {
    id: "push",
    syntax: "vic push <remote> <branch>",
    examples: ["vic push origin main"],
  },
  {
    id: "watch",
    syntax: "vic watch",
    examples: ["vic watch"],
  },
];

const WORKFLOWS = [
  {
    id: "newProject",
    code: 'vic init my-project\ncd my-project\nvic auth login http://localhost:3000\nvic add .\nvic commit -m "Initial commit"\nvic remote add origin http://localhost:3000/api/repos/acme/my-project\nvic push origin main',
  },
  {
    id: "existingProject",
    code: "vic auth login http://localhost:3000\nvic clone http://localhost:3000/api/repos/acme/demo\ncd demo\nvic status",
  },
  {
    id: "dailyWork",
    code: 'vic pull origin main\nvic checkout -b feature/profile main\nvic add .\nvic diff --staged\nvic commit -m "Add profile page"\nvic push origin feature/profile',
  },
  {
    id: "mergeConflict",
    code: "vic checkout main\nvic merge feature/profile\n# edit conflicted files\nvic add resolved-file.txt\nvic merge --continue\nvic push origin main",
  },
];

function CodeBlock({ label, code }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
      <div className="flex items-center justify-between gap-3 border-b border-light-divider px-3 py-2 dark:border-dark-divider">
        <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2.5 text-[11px] font-semibold text-primary transition-colors hover:border-(--color-light-input-border-focus) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary dark:hover:border-(--color-dark-input-border-focus)"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Clipboard className="size-3.5" />
          )}
          {copied ? t("publicDocs.copied") : t("publicDocs.copy")}
        </button>
      </div>
      <pre
        className="overflow-x-auto p-4 text-xs leading-6 text-primary dark:text-dark-primary"
        dir="ltr"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SectionTitle({ icon, eyebrow, title, description }) {
  const IconComponent = icon;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-light-app-tertiary text-(--color-chart-blue-primary) dark:bg-dark-app-tertiary dark:text-(--color-chart-blue-secondary)">
        <IconComponent className="size-5" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary dark:text-dark-primary">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-secondary dark:text-dark-secondary">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function Documentation() {
  const { t } = useTranslation();
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const sectionLabels = useMemo(
    () =>
      SECTIONS.map((id) => ({
        id,
        label: t(`publicDocs.sections.${id}`),
      })),
    [t],
  );

  useEffect(() => {
    const observers = SECTIONS.map((id) => {
      const node = document.getElementById(`doc-${id}`);
      if (!node) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-28% 0px -60% 0px", threshold: 0 },
      );
      observer.observe(node);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((command) =>
      [
        command.id,
        command.syntax,
        command.examples.join(" "),
        t(`publicDocs.commands.${command.id}.title`),
        t(`publicDocs.commands.${command.id}.summary`),
        t(`publicDocs.commands.${command.id}.usage`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, t]);

  const startVicDownload = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(8);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(92, 8 + Math.round(elapsed / 18));
      setDownloadProgress(next);
    }, 120);
    window.setTimeout(() => {
      window.clearInterval(timer);
      setDownloadProgress(100);
      const link = document.createElement("a");
      link.href = FILE.CLI_APPLICATION.DOWNLOAD_RAW("vic.exe");
      link.download = "vic.exe";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 900);
    }, 1400);
  };

  return (
    <BlogShell variant="feed">
      <div className="py-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-2  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
                {t("publicDocs.sidebar")}
              </p>
              {sectionLabels.map((item, index) => (
                <a
                  key={item.id}
                  href={`#doc-${item.id}`}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    active === item.id
                      ? "bg-light-app-tertiary text-(--color-chart-blue-primary) dark:bg-dark-app-tertiary dark:text-(--color-chart-blue-secondary)"
                      : "text-secondary hover:bg-light-app-tertiary dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
                  }`}
                >
                  <span className="text-[11px] opacity-70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 space-y-8">
            <section
              id="doc-overview"
              className="scroll-mt-28 overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg)  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
            >
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="p-5 md:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted dark:text-dark-muted">
                    {t("publicDocs.eyebrow")}
                  </p>
                  <h1 className="font-blog-display mt-3 max-w-3xl text-3xl font-bold tracking-tight text-primary dark:text-dark-primary sm:text-5xl">
                    {t("publicDocs.title")}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary dark:text-dark-secondary sm:text-base">
                    {t("publicDocs.subtitle")}
                  </p>
                </div>
                <div className="border-t border-light-divider bg-light-app-tertiary p-5 dark:border-dark-divider dark:bg-dark-app-tertiary lg:border-s lg:border-t-0">
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    {t("publicDocs.windowsCard.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-secondary dark:text-dark-secondary">
                    {t("publicDocs.windowsCard.body")}
                  </p>
                  <div className="mt-4 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 text-xs font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
                    vic-windows-amd64.exe
                  </div>
                  <button
                    type="button"
                    onClick={startVicDownload}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 text-sm font-semibold text-white transition-colors hover:opacity-95 dark:bg-dark-primary dark:text-dark-shell"
                  >
                    <Download className="size-4" strokeWidth={1.8} />
                    {isDownloading ? "Preparing download" : "Download vic.exe"}
                  </button>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section
              id="doc-windows"
              className="scroll-mt-28 space-y-4 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
            >
              <SectionTitle
                icon={Download}
                eyebrow={t("publicDocs.sections.windows")}
                title={t("publicDocs.windows.title")}
                description={t("publicDocs.windows.description")}
              />
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      vic.exe
                    </p>
                    <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                      Download the latest Windows executable from file-service.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startVicDownload}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 text-sm font-semibold text-white transition-colors hover:opacity-95 dark:bg-dark-primary dark:text-dark-shell"
                  >
                    <Download className="size-4" strokeWidth={1.8} />
                    {isDownloading ? "Downloading" : "Download"}
                  </button>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-dark-card-bg">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
              <CodeBlock label="PowerShell" code={WINDOWS_SETUP} />
            </section>

            <section
              id="doc-quick"
              className="scroll-mt-28 space-y-4 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
            >
              <SectionTitle
                icon={TerminalSquare}
                eyebrow={t("publicDocs.sections.quick")}
                title={t("publicDocs.quick.title")}
                description={t("publicDocs.quick.description")}
              />
              <CodeBlock
                label={t("publicDocs.quick.label")}
                code={QUICK_START}
              />
            </section>

            <section id="doc-commands" className="scroll-mt-28 space-y-4">
              <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <SectionTitle
                    icon={Search}
                    eyebrow={t("publicDocs.sections.commands")}
                    title={t("publicDocs.commandsTitle")}
                    description={t("publicDocs.commandsDescription")}
                  />
                  <div className="relative md:w-80">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted dark:text-dark-muted" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("publicDocs.search")}
                      className="h-9 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) pe-3 ps-9 text-sm text-primary outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-dark-primary dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {filteredCommands.map((command) => (
                  <article
                    key={command.id}
                    className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
                      <div>
                        <p
                          className="font-mono text-sm font-semibold text-(--color-chart-blue-primary) dark:text-(--color-chart-blue-secondary)"
                          dir="ltr"
                        >
                          {command.syntax}
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-primary dark:text-dark-primary">
                          {t(`publicDocs.commands.${command.id}.title`)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-secondary dark:text-dark-secondary">
                          {t(`publicDocs.commands.${command.id}.summary`)}
                        </p>
                        <p className="mt-3 rounded-xl bg-light-app-tertiary px-3 py-2 text-sm leading-6 text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                          {t(`publicDocs.commands.${command.id}.usage`)}
                        </p>
                      </div>
                      <CodeBlock
                        label={t("publicDocs.example")}
                        code={command.examples.join("\n")}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="doc-workflows"
              className="scroll-mt-28 space-y-4 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
            >
              <SectionTitle
                icon={FileCode2}
                eyebrow={t("publicDocs.sections.workflows")}
                title={t("publicDocs.workflowsTitle")}
                description={t("publicDocs.workflowsDescription")}
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {WORKFLOWS.map((workflow) => (
                  <CodeBlock
                    key={workflow.id}
                    label={t(`publicDocs.workflows.${workflow.id}`)}
                    code={workflow.code}
                  />
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>
    </BlogShell>
  );
}
