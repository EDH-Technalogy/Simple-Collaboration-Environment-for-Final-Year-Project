import { createElement } from "react";
import { normalizeArticleBlock } from "../lib/adminArticleMap";
import { cn } from "../lib/utils";

/**
 * Render blog article blocks from API safely (TEXT/HEADING/QUOTE/CODE/DIVIDER/IMAGE/VIDEO/EMBED…).
 * Aligns with blog-service `ArticleBlockType` (`ContentBlockResponse`).
 */
export default function ArticleBlocksReader({ blocks, className, dir }) {
  const ordered = [...(blocks ?? [])]
    .map((b) => normalizeArticleBlock(b))
    .filter(Boolean)
    .sort((a, b) => {
      const oa = a?.order ?? 0;
      const ob = b?.order ?? 0;
      return oa - ob;
    });

  if (!ordered.length) {
    return (
      <p
        className={cn(
          "text-sm text-muted dark:text-dark-muted",
          className,
        )}
      />
    );
  }

  return (
    <div
      dir={dir}
      className={cn(
        "space-y-6 text-[17px] leading-8 text-primary dark:text-dark-primary",
        className,
      )}
    >
      {ordered.map((block, idx) => {
        const key = `${block?.type}-${block?.order ?? idx}-${idx}`;
        const d = block?.data ?? {};
        const bt = String(block?.type ?? "").toUpperCase();

        switch (bt) {
          case "TEXT":
            return (
              <p
                key={key}
                className="whitespace-pre-wrap font-normal text-secondary dark:text-dark-secondary"
              >
                {d.text ?? ""}
              </p>
            );

          case "HEADING": {
            const lvl = Math.min(Math.max(Number(d.level) || 2, 1), 6);
            const tagName = `h${lvl}`;
            return createElement(
              tagName,
              {
                key,
                className: cn(
                  "tracking-tight text-primary dark:text-dark-primary",
                  lvl === 1 &&
                    "text-3xl font-bold md:text-4xl mt-12 first:mt-0",
                  lvl === 2 &&
                    "text-2xl font-bold md:text-3xl mt-10 first:mt-0",
                  lvl >= 3 && "text-xl font-semibold mt-8 first:mt-0",
                ),
              },
              d.text ?? "",
            );
          }

          case "QUOTE":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-(--color-light-input-border-focus) py-1 pl-5 text-xl italic text-secondary dark:border-(--color-dark-input-border-focus) dark:text-dark-secondary"
              >
                {d.text ?? ""}
              </blockquote>
            );

          case "CODE":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 text-sm text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary"
              >
                <code>{d.code ?? ""}</code>
              </pre>
            );

          case "DIVIDER":
            return (
              <hr
                key={key}
                className="border-light-divider dark:border-dark-divider"
              />
            );

          case "IMAGE":
            if (d.url) {
              return (
                <figure key={key} className="my-8">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open article image"
                    className="block cursor-zoom-in"
                  >
                    <img
                      src={d.url}
                      alt={d.alt ?? ""}
                      className="aspect-video w-full rounded-xl border border-(--color-light-card-border) object-cover dark:border-(--color-dark-card-border)"
                    />
                  </a>
                </figure>
              );
            }
            return null;

          case "VIDEO":
            if (d.url) {
              return (
                <div key={key} className="aspect-video overflow-hidden rounded-xl bg-black">
                  <video controls className="h-full w-full" src={d.url}>
                    <track kind="captions" />
                  </video>
                </div>
              );
            }
            return null;

          case "EMBED":
            return (
              <div
                key={key}
                className="rounded-xl border border-(--color-light-card-border) p-4 text-sm text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted"
              >
                {d.provider ?? "embed"}
                {": "}
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline underline-offset-2 dark:text-dark-primary"
                  >
                    {d.url}
                  </a>
                ) : (
                  ""
                )}
              </div>
            );

          default:
            return (
              <p
                key={key}
                className="text-sm text-muted dark:text-dark-muted"
              >
                {block?.type}: unsupported block
              </p>
            );
        }
      })}
    </div>
  );
}
