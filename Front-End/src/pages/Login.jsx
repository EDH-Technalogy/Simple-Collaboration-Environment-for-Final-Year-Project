import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { gooeyToast } from "goey-toast";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Home,
  KeyRound,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { postLoginPath } from "../lib/roles";
import { useTheme } from "../context/themContext";
import { useLogin } from "../services/useApi";
import Field from "../components/Field";
import Checkbox from "../components/Checkbox";
import GoogleSignInButton from "../components/GoogleSignInButton";

const AUTH_BACKGROUND =
  "min-h-screen bg-linear-to-br from-sky-50 via-white to-emerald-50 text-primary dark:from-sky-500/12 dark:via-dark-card-bg dark:to-emerald-500/10 dark:text-dark-primary";
const AUTH_CHROME =
  "border border-sky-200/80 bg-white/85 text-secondary shadow-sm backdrop-blur dark:border-sky-500/20 dark:bg-dark-card-bg/85 dark:text-dark-secondary";
const ICON_PATHS = {
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock: "M6 10V8a6 6 0 1112 0v2M5 10h14v12H5zM12 15v3",
};

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function LoginActionIcon({ loading }) {
  return loading ? (
    <Spinner />
  ) : (
    <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
  );
}

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const [remember, setRemember] = useState(false);
  const [done, setDone] = useState(false);
  const [routeStage, setRouteStage] = useState("idle");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const { mutate: apiLogin, isPending: loading } = useLogin({
    toastSuccess: t("login.toast.signInSuccess"),
  });
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(postLoginPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const submit = (data) => {
    apiLogin(data, {
      onSuccess: (sessionUser) => {
        login(sessionUser);
        setDone(true);
        const dest = postLoginPath(sessionUser);
        setTimeout(() => navigate(dest, { replace: true }), 1200);
      },
    });
  };

  const goSignup = () => {
    setRouteStage("signup");
    setTimeout(() => navigate("/signup"), 260);
  };

  const pageLeaving = routeStage === "signup";

  return (
    <div className={AUTH_BACKGROUND}>
      <div className="fixed left-4 top-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className={`${AUTH_CHROME} inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors hover:text-primary dark:hover:text-dark-primary`}
        >
          <Home className="size-3.5" strokeWidth={2} aria-hidden />
          {t("login.publicStories")}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className={`${AUTH_CHROME} fixed right-4 top-4 z-50 inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:text-primary dark:hover:text-dark-primary`}
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="size-4" strokeWidth={1.8} aria-hidden />
        ) : (
          <Sun className="size-4" strokeWidth={1.8} aria-hidden />
        )}
      </button>

      <main
        className={`mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-20 transition-all duration-300 ease-out md:px-6 lg:grid-cols-[minmax(440px,1.1fr)_minmax(340px,0.9fr)] lg:px-8 ${
          pageLeaving ? "-translate-x-6 opacity-0" : "translate-x-0 opacity-100"
        }`}
      >
        <section className="w-full">
          <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm transition-all duration-300 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="border-b border-light-divider px-5 py-5 dark:border-dark-divider sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                    {t("login.signIn")}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary dark:text-dark-primary">
                    {t("login.heading")}
                  </h1>
                  <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
                    {t("login.subtext")}
                  </p>
                </div>
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 sm:flex">
                  <KeyRound className="size-5" strokeWidth={1.8} />
                </span>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7">
              {done ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 className="size-7" strokeWidth={1.8} />
                  </span>
                  <p className="mt-4 text-base font-semibold text-primary dark:text-dark-primary">
                    {t("login.signedIn")}
                  </p>
                  <p className="mt-1 text-sm text-muted dark:text-dark-muted">
                    {t("login.redirecting")}
                  </p>
                </div>
              ) : (
                <>
                  <GoogleSignInButton
                    intent="signin"
                    disabled={loading}
                    onAuthSuccess={(sessionUser) => {
                      gooeyToast.success(t("login.toast.signInSuccess"));
                      login(sessionUser);
                      setDone(true);
                      const dest = postLoginPath(sessionUser);
                      setTimeout(
                        () => navigate(dest, { replace: true }),
                        900,
                      );
                    }}
                    onAuthFailure={(msg) => {
                      const fallback = t("login.toast.signInFailed");
                      const title = msg?.trim?.() ? msg.trim() : fallback;
                      gooeyToast.error(title);
                    }}
                  />
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-light-divider dark:bg-dark-divider" />
                    <span className="text-[11px] font-medium text-muted dark:text-dark-muted">
                      {t("login.orContinueWithEmail")}
                    </span>
                    <div className="h-px flex-1 bg-light-divider dark:bg-dark-divider" />
                  </div>

                  <form
                    onSubmit={handleSubmit(submit)}
                    noValidate
                    className="space-y-4"
                  >
                    <Field
                      label={t("login.emailAddress")}
                      type="email"
                      placeholder="you@school.edu"
                      register={register("email", {
                        required: `${t("login.emailAddress")} is required`,
                      })}
                      error={errors.email?.message}
                      autoComplete="email"
                      iconD={ICON_PATHS.mail}
                    />

                    <Field
                      label={t("login.password")}
                      type="password"
                      placeholder="••••••••"
                      register={register("password", {
                        required: `${t("login.password")} is required`,
                      })}
                      error={errors.password?.message}
                      autoComplete="current-password"
                      iconD={ICON_PATHS.lock}
                    />

                    <div className="flex items-center justify-between gap-3">
                      <Checkbox
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        id="remember"
                        label={t("login.rememberMe")}
                      />
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="border-none bg-transparent text-[11px] font-semibold text-secondary underline underline-offset-2 transition-colors hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                      >
                        {t("login.forgotPassword")}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-dark-primary dark:text-dark-shell"
                    >
                      {t("login.signIn")}
                      <LoginActionIcon loading={loading} />
                    </button>
                  </form>

                  <p className="mt-5 text-center text-xs text-muted dark:text-dark-muted">
                    {t("login.noAccount")}{" "}
                    <button
                      type="button"
                      onClick={goSignup}
                      className="border-none bg-transparent font-semibold text-secondary underline underline-offset-2 transition-colors hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                    >
                      {t("login.signupFree")}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <section
          className={`hidden transition-all   delay-75 duration-300 ease-out lg:block ${
            pageLeaving
              ? "translate-x-6 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div className="ml-auto max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
              {t("login.heading")}
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-primary dark:text-dark-primary">
              {t("login.subtext")}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-secondary dark:text-dark-secondary">
              {t("login.sideDescription")}
            </p>

            <div className="mt-8 grid gap-3">
              {[
                {
                  icon: UserRoundCheck,
                  title: t("login.identityTitle"),
                  text: t("login.identityText"),
                },
                {
                  icon: ShieldCheck,
                  title: t("login.securityTitle"),
                  text: t("login.securityText"),
                },
                {
                  icon: FileCheck2,
                  title: t("login.continuityTitle"),
                  text: t("login.continuityText"),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                      <item.icon className="size-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-sky-200/80 bg-sky-50/80 p-4 dark:border-sky-500/20 dark:bg-sky-500/10">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 dark:bg-dark-card-bg dark:text-sky-300">
                  <LockKeyhole className="size-5" strokeWidth={1.8} />
                </span>
                <p className="text-xs leading-5 text-secondary dark:text-dark-secondary">
                  {t("login.switchHint")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
