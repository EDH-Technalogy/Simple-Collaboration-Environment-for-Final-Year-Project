import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  LayoutGrid,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  Cloud,
  ArrowUpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CARD =
  "rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";
const CARD_SHADOW =
  "shadow-[0_22px_50px_-14px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_55px_-12px_rgba(0,0,0,0.55)]";

const integration = [
  {
    Icon: MessageSquare,
    wrap: "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
  },
  {
    Icon: LayoutGrid,
    wrap: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
  },
  {
    Icon: Cloud,
    wrap: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    Icon: Mail,
    wrap: "bg-rose-100 text-rose-700 dark:bg-rose-950/65 dark:text-rose-300",
  },
  {
    Icon: FileText,
    wrap: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/65 dark:text-emerald-300",
  },
];

function cardMotion(delay) {
  return {
    initial: { opacity: 0, y: 18, rotate: 0 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1], delay },
  };
}

export default function PublicLandingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden  bg-light-app-bg  dark:bg-dark-shell">
      {/* Fine dot texture + grid (reference: soft lattice) */}

      {/* Warm pink / apricot bloom behind collage */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-28 top-20 size-[min(95vw,620px)] rounded-full bg-gradient-to-br from-rose-200/70 via-orange-100/55 to-purple-100/35 blur-[100px] dark:from-fuchsia-500/18 dark:via-orange-500/14 dark:to-rose-500/08"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-20%] right-[10%] size-[340px] rounded-full bg-gradient-to-tl from-amber-100/65 to-transparent blur-3xl dark:from-amber-600/14"
      />

      <div className="relative   mx-auto flex justify-center max-w-[1320px] gap-12 px-4 pb-20 pt-10 sm:px-6  lg:pt-14 rtl:font-persian">
        {/* ── Right column — layered floating UI (matches reference collage) ── */}
        <div className=" relative aspect-[1.05] w-full max-w-[540px] min-h-[360px] sm:aspect-[4/3] sm:min-h-[420px] lg:mx-0 lg:mr-[-8px] xl:mr-[-16px]">
          {/* Ambient slab behind stacks */}
          <div
            aria-hidden
            className={`absolute left-[6%] top-[14%] h-[74%] w-[88%] rounded-[2rem] ${CARD_SHADOW} bg-gradient-to-br from-rose-50/85 via-white/30 to-orange-50/65 dark:from-rose-950/25 dark:via-transparent dark:to-orange-950/20`}
          />

          {/* Top-left · sparkle Q + answer */}
          <motion.div
            {...cardMotion(0.04)}
            className={`absolute left-0 top-[2%] z-30 w-[86%] max-w-[390px] -rotate-[2deg] ${CARD} ${CARD_SHADOW} p-4 sm:p-5`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400">
                <Sparkles
                  className="size-[18px]"
                  strokeWidth={1.85}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-primary dark:text-dark-primary">
                  {t("publicHome.hero.card.sparkleQuestion")}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-secondary dark:text-dark-secondary">
                  {t("publicHome.hero.card.sparkleAnswer")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Top-right · small angled bubble */}
          <motion.div
            {...cardMotion(0.1)}
            className={`absolute right-[-2%] top-[8%] z-40 w-[46%] min-w-[148px] max-w-[200px] rotate-[4deg] ${CARD} ${CARD_SHADOW} p-3`}
          >
            <div className="flex gap-2">
              <span
                className="size-10 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-800/70 dark:to-rose-900/60"
                aria-hidden
              />
              <div className="min-w-0">
                <Sparkles
                  className="mb-1 size-[14px] text-violet-500 dark:text-violet-400"
                  strokeWidth={1.85}
                />
                <p className="text-[11px] font-medium leading-snug text-primary dark:text-dark-primary">
                  {t("publicHome.hero.card.smallBubble")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Middle · portrait + promo line */}
          <motion.div
            {...cardMotion(0.05)}
            className={`absolute right-[6%] top-[38%] z-20 flex w-[88%] max-w-[372px] -translate-x-3 items-center gap-3 rounded-2xl border border-(--color-light-card-border) bg-gradient-to-r from-white to-(--color-light-app-tertiary) p-2.5 pr-4 shadow-md dark:border-(--color-dark-card-border) dark:from-(--color-dark-card-bg) dark:to-(--color-dark-app-tertiary)`}
          >
            <div
              className="relative h-[4.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl bg-(--color-light-app-tertiary) dark:bg-(--color-dark-app-tertiary)"
              aria-hidden
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-300/85 via-transparent to-purple-400/65 dark:from-orange-900/40 dark:to-purple-900/30" />
              <div className="absolute inset-2 rounded-lg bg-neutral-950/85 dark:bg-white/85" />
            </div>
            <p className="text-[12px] font-semibold leading-snug text-secondary dark:text-dark-secondary sm:text-sm">
              {t("publicHome.hero.card.promoStrip")}
            </p>
          </motion.div>

          {/* Mid-low · suggestion block */}
          <motion.div
            {...cardMotion(0.13)}
            className={`absolute left-[4%] top-[54%] z-[25] w-[54%] min-w-[158px] max-w-[238px] -rotate-[1deg] ${CARD} px-4 py-3 shadow-md`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              {t("publicHome.hero.card.suggestions")}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-secondary dark:text-dark-secondary">
              {t("publicHome.hero.card.aiReply")}
            </p>
          </motion.div>

          {/* Search row */}
          <motion.div
            {...cardMotion(0.07)}
            className={`absolute left-[3%] top-[71%] z-[35] w-[92%] max-w-[400px] rotate-[1.5deg] ${CARD} ${CARD_SHADOW} p-3`}
          >
            <div className="flex gap-2">
              <div className="flex min-h-10 flex-1 items-center rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 py-2 text-[12px] text-muted shadow-inner dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-dark-muted">
                <Search
                  className="me-2 size-[15px] shrink-0 opacity-70"
                  aria-hidden
                />
                <span>{t("publicHome.hero.card.searchBar")}</span>
              </div>
              <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-neutral-950 px-3.5 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-neutral-950 sm:gap-1.5 sm:px-4">
                {t("publicHome.hero.card.askAi")}
                <ArrowRight className="size-3 sm:size-3.5" aria-hidden />
              </span>
            </div>
          </motion.div>

          {/* Bottom · reader question + faux chat */}
          <motion.div
            {...cardMotion(0.16)}
            className={`absolute bottom-[-6%] right-[-6%] z-40 w-[92%] max-w-[400px] sm:bottom-[-2%] ${CARD} ${CARD_SHADOW} p-4 sm:p-5`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              {t("publicHome.hero.card.promptTitle")}
            </p>
            <p className="mt-2 text-sm font-semibold text-primary dark:text-dark-primary">
              {t("publicHome.hero.card.promptQuestion")}
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-app-tertiary) py-2.5 text-center text-[12px] font-semibold text-primary transition-colors hover:bg-(--color-light-card-bg) dark:border-dark-input-border dark:bg-(--color-dark-app-tertiary) dark:text-dark-primary dark:hover:bg-(--color-dark-card-hover)"
            >
              {t("publicHome.hero.card.promptAction")}
            </button>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex min-h-10 flex-1 items-center rounded-full border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 text-[12px] text-muted dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-dark-muted">
                {t("publicHome.hero.card.promptInput")}
              </div>
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                aria-hidden
              >
                <ArrowUpCircle className="size-5" strokeWidth={1.75} />
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
