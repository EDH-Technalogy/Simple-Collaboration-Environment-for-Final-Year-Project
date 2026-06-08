import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gooeyToast } from "goey-toast";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { postLoginPath } from "../lib/roles";
import { useTheme } from "../context/themContext";
import {
  useLogin,
  useResendVerificationEmail,
  useSignup,
  useVerifyEmail,
} from "../services/useApi";
import Field from "../components/Field";
import GoogleSignInButton from "../components/GoogleSignInButton";

const USERNAME_RE = /^[A-Za-z0-9]{3,50}$/;
const PERSON_NAME_RE = /^[\p{L}]{2,50}$/u;
const AFGHAN_PHONE_RE = /^07\d{8}$/;
const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
const AUTH_BACKGROUND =
  "min-h-screen bg-linear-to-br from-sky-50 via-white to-emerald-50 text-primary dark:from-sky-500/12 dark:via-dark-card-bg dark:to-emerald-500/10 dark:text-dark-primary";
const AUTH_CHROME =
  "border border-sky-200/80 bg-white/85 text-secondary shadow-sm backdrop-blur dark:border-sky-500/20 dark:bg-dark-card-bg/85 dark:text-dark-secondary";

const ICON_PATHS = {
  user:
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  mail:
    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone:
    "M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.35 1.89.66 2.78a2 2 0 01-.45 2.11L8.09 9.84a16 16 0 006.07 6.07l1.23-1.23a2 2 0 012.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0122 16.92z",
  lock:
    "M6 10V8a6 6 0 1112 0v2M5 10h14v12H5zM12 15v3",
};

function SignupActionIcon({ loading }) {
  if (loading) {
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
  return <ArrowRight className="size-4" strokeWidth={2} aria-hidden />;
}

function Requirement({ met, children }) {
  return (
    <li
      className={
        met
          ? "flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300"
          : "flex items-center gap-1.5 text-muted dark:text-dark-muted"
      }
    >
      <CheckCircle2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function OtpCodeInput({ value, onChange, disabled = false }) {
  const inputsRef = useRef([]);
  const digits = useMemo(() => {
    const raw = String(value ?? "").replace(/\D/g, "").slice(0, 6);
    return Array.from({ length: 6 }, (_, index) => raw[index] ?? "");
  }, [value]);

  const setDigit = (index, nextValue) => {
    const clean = String(nextValue ?? "").replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6);
      onChange(next);
      inputsRef.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = clean;
    onChange(next.join(""));
    if (clean && index < 5) inputsRef.current[index + 1]?.focus();
  };

  return (
    <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          value={digit}
          disabled={disabled}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              inputsRef.current[index - 1]?.focus();
            }
            if (event.key === "ArrowLeft" && index > 0) {
              inputsRef.current[index - 1]?.focus();
            }
            if (event.key === "ArrowRight" && index < 5) {
              inputsRef.current[index + 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text");
            setDigit(index, pasted);
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Verification code digit ${index + 1}`}
          className="aspect-square w-full rounded-2xl border border-(--color-light-input-border) bg-(--color-light-input-bg) text-center font-mono text-2xl font-semibold text-primary shadow-sm outline-none transition-all placeholder:text-(--color-light-input-placeholder) focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:focus:border-sky-400 dark:focus:ring-sky-400/15"
        />
      ))}
    </div>
  );
}

export default function Signup() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
    },
  });
  const [done, setDone] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [otp, setOtp] = useState("");
  const { mutate: signupMutate, isPending: signingUp } = useSignup();
  const { mutate: verifyEmailMutate, isPending: verifyingOtp } = useVerifyEmail();
  const { mutate: resendOtpMutate, isPending: resendingOtp } = useResendVerificationEmail();
  const { mutate: loginMutate, isPending: loggingInAfterVerify } = useLogin();
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const password = useWatch({ control, name: "password" }) || "";
  const passwordChecks = {
    length: password.length >= 8 && password.length <= 128,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(postLoginPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const submit = (data) => {
    const normalizedEmail = String(data.email ?? "").trim().toLowerCase();
    signupMutate(
      {
        ...data,
        username: String(data.username ?? "").trim(),
        email: normalizedEmail,
        first_name: String(data.first_name ?? "").trim(),
        last_name: String(data.last_name ?? "").trim(),
        phone_number: String(data.phone_number ?? "").trim(),
      },
      {
        onSuccess: () => {
          setPendingEmail(normalizedEmail);
          setPendingPassword(data.password);
          setOtp("");
        },
      },
    );
  };

  const submitOtp = (event) => {
    event.preventDefault();
    const code = otp.trim();
    if (!pendingEmail || !/^\d{6}$/.test(code)) {
      gooeyToast.error(t("signup.otp.validation"));
      return;
    }
    verifyEmailMutate(
      { email: pendingEmail, otp_code: code },
      {
        onSuccess: () => {
          loginMutate(
            {
              email: pendingEmail,
              password: pendingPassword,
              remember_me: false,
            },
            {
              onSuccess: (sessionUser) => {
                login(sessionUser);
                setDone(true);
                const dest = postLoginPath(sessionUser);
                setTimeout(() => navigate(dest, { replace: true }), 900);
              },
            },
          );
        },
      },
    );
  };

  const resendOtp = () => {
    if (!pendingEmail) return;
    setOtp("");
    resendOtpMutate(pendingEmail, {
      onSuccess: () => setOtp(""),
    });
  };

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

      <main className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-20 md:px-6 lg:grid-cols-[minmax(340px,0.9fr)_minmax(440px,1.1fr)] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
              <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
              {t("signup.eyebrow")}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary dark:text-dark-primary">
              {t("signup.heading")}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-secondary dark:text-dark-secondary">
              {t("signup.description")}
            </p>

            <div className="mt-8 grid gap-3">
              {[
                {
                  icon: UserRound,
                  title: t("signup.identityTitle"),
                  text: t("signup.identityText"),
                },
                {
                  icon: ShieldCheck,
                  title: t("signup.securityTitle"),
                  text: t("signup.securityText"),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
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
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="border-b border-light-divider px-5 py-5 dark:border-dark-divider sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                    {t("signup.secureEyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-primary dark:text-dark-primary">
                    {t("signup.heading")}
                  </h2>
                  <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
                    {t("signup.subtext")}
                  </p>
                </div>
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 sm:flex">
                  <UserRound className="size-5" strokeWidth={1.8} />
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
                    {t("signup.accountCreated")}
                  </p>
                  <p className="mt-1 text-sm text-muted dark:text-dark-muted">
                    {t("signup.redirecting")}
                  </p>
                </div>
              ) : pendingEmail ? (
                <form onSubmit={submitOtp} className="space-y-5">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                    <p className="font-semibold">{t("signup.otp.title")}</p>
                    <p className="mt-1">
                      {t("signup.otp.description", { email: pendingEmail })}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                      {t("signup.otp.label")}
                    </label>
                    <OtpCodeInput
                      value={otp}
                      onChange={setOtp}
                      disabled={verifyingOtp || loggingInAfterVerify}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyingOtp || loggingInAfterVerify}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-dark-primary dark:text-dark-shell"
                  >
                    {verifyingOtp || loggingInAfterVerify
                      ? t("signup.otp.verifying")
                      : t("signup.otp.verify")}
                    <SignupActionIcon loading={verifyingOtp || loggingInAfterVerify} />
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted dark:text-dark-muted">
                    <button
                      type="button"
                      onClick={() => setPendingEmail("")}
                      className="font-semibold text-secondary underline underline-offset-2 transition-colors hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                    >
                      {t("signup.otp.changeEmail")}
                    </button>
                    <button
                      type="button"
                      disabled={resendingOtp}
                      onClick={resendOtp}
                      className="font-semibold text-secondary underline underline-offset-2 transition-colors hover:text-primary disabled:opacity-50 dark:text-dark-secondary dark:hover:text-dark-primary"
                    >
                      {resendingOtp ? t("signup.otp.sending") : t("signup.otp.resend")}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <GoogleSignInButton
                    intent="signup"
                    disabled={signingUp}
                    onAuthSuccess={(sessionUser) => {
                      login(sessionUser);
                      setDone(true);
                      const dest = postLoginPath(sessionUser);
                      setTimeout(() => navigate(dest, { replace: true }), 900);
                    }}
                    onAuthFailure={(msg) => {
                      const title =
                        msg?.trim?.() || t("apiErrors.google_authentication_failed");
                      gooeyToast.error(title);
                    }}
                  />
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-light-divider dark:bg-dark-divider" />
                    <span className="text-[11px] font-medium text-muted dark:text-dark-muted">
                      {t("signup.orContinueWithEmail")}
                    </span>
                    <div className="h-px flex-1 bg-light-divider dark:bg-dark-divider" />
                  </div>

                  <form
                    onSubmit={handleSubmit(submit)}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        register={register("first_name", {
                          setValueAs: (value) => String(value ?? "").trim(),
                          required: t("signup.validation.firstNameRequired"),
                          minLength: {
                            value: 2,
                            message: t("signup.validation.nameMin"),
                          },
                          maxLength: {
                            value: 50,
                            message: t("signup.validation.firstNameMax"),
                          },
                          pattern: {
                            value: PERSON_NAME_RE,
                            message: t("signup.validation.namePattern"),
                          },
                        })}
                        label={t("signup.firstName")}
                        placeholder="John"
                        error={errors.first_name?.message}
                        autoComplete="given-name"
                        iconD={ICON_PATHS.user}
                      />
                      <Field
                        register={register("last_name", {
                          setValueAs: (value) => String(value ?? "").trim(),
                          required: t("signup.validation.lastNameRequired"),
                          minLength: {
                            value: 2,
                            message: t("signup.validation.nameMin"),
                          },
                          maxLength: {
                            value: 50,
                            message: t("signup.validation.lastNameMax"),
                          },
                          pattern: {
                            value: PERSON_NAME_RE,
                            message: t("signup.validation.namePattern"),
                          },
                        })}
                        label={t("signup.lastName")}
                        placeholder="Doe"
                        error={errors.last_name?.message}
                        autoComplete="family-name"
                        iconD={ICON_PATHS.user}
                      />
                    </div>

                    <Field
                      register={register("username", {
                        setValueAs: (value) => String(value ?? "").trim(),
                        required: t("signup.validation.usernameRequired"),
                        minLength: {
                          value: 3,
                          message: t("signup.validation.usernameMin"),
                        },
                        maxLength: {
                          value: 50,
                          message: t("signup.validation.usernameMax"),
                        },
                        pattern: {
                          value: USERNAME_RE,
                          message: t("signup.validation.usernamePattern"),
                        },
                      })}
                      label={t("signup.username")}
                      placeholder="john.doe"
                      error={errors.username?.message}
                      autoComplete="username"
                      iconD={ICON_PATHS.user}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label={t("login.emailAddress")}
                        type="email"
                        register={register("email", {
                          required: t("signup.validation.emailRequired"),
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: t("signup.validation.emailInvalid"),
                          },
                        })}
                        placeholder="john.doe@example.com"
                        error={errors.email?.message}
                        autoComplete="email"
                        iconD={ICON_PATHS.mail}
                      />
                      <Field
                        register={register("phone_number", {
                          setValueAs: (value) => String(value ?? "").trim(),
                          required: t("signup.validation.phoneRequired"),
                          pattern: {
                            value: AFGHAN_PHONE_RE,
                            message: t("signup.validation.phonePattern"),
                          },
                        })}
                        label={t("signup.phoneNumber")}
                        placeholder="0791234567"
                        error={errors.phone_number?.message}
                        autoComplete="tel"
                        iconD={ICON_PATHS.phone}
                      />
                    </div>

                    <Field
                      label={t("login.password")}
                      type="password"
                      placeholder="SecurePass123!"
                      register={register("password", {
                        required: t("signup.validation.passwordRequired"),
                        minLength: {
                          value: 8,
                          message: t("signup.validation.passwordMin"),
                        },
                        maxLength: {
                          value: 128,
                          message: t("signup.validation.passwordMax"),
                        },
                        pattern: {
                          value: PASSWORD_RE,
                          message: t("signup.validation.passwordPattern"),
                        },
                      })}
                      error={errors.password?.message}
                      autoComplete="new-password"
                      iconD={ICON_PATHS.lock}
                    />

                    <ul className="grid gap-1.5 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-3 text-[11px] dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary sm:grid-cols-2">
                      <Requirement met={passwordChecks.length}>
                        {t("signup.passwordReq.length")}
                      </Requirement>
                      <Requirement met={passwordChecks.upper}>
                        {t("signup.passwordReq.upper")}
                      </Requirement>
                      <Requirement met={passwordChecks.lower}>
                        {t("signup.passwordReq.lower")}
                      </Requirement>
                      <Requirement met={passwordChecks.number}>
                        {t("signup.passwordReq.number")}
                      </Requirement>
                      <Requirement met={passwordChecks.special}>
                        {t("signup.passwordReq.special")}
                      </Requirement>
                    </ul>

                    <button
                      type="submit"
                      disabled={signingUp}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-dark-primary dark:text-dark-shell"
                    >
                      {t("signup.createAccount")}
                      <SignupActionIcon loading={signingUp} />
                    </button>
                  </form>

                  <p className="mt-5 text-center text-xs text-muted dark:text-dark-muted">
                    {t("signup.haveAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="font-semibold text-secondary underline underline-offset-2 transition-colors hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                    >
                      {t("signup.signIn")}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
