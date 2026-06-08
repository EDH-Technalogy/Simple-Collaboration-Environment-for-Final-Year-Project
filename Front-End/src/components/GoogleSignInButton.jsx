import { Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "../services/useApi";
import { hasGoogleOAuthClientId } from "../lib/googleOAuth";

function GoogleMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function GoogleButtonShell({ intent, busy, disabled, onClick, title }) {
  const label =
    intent === "signup" ? "Sign up with Google" : "Sign in with Google";

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      title={title}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 dark:border-slate-700 dark:bg-dark-card-bg dark:text-slate-100 dark:hover:border-dark-border-subtle dark:hover:bg-dark-card-shadow"
      data-google-auth={intent}
      aria-busy={busy}
    >
      {busy ? (
        <Loader2
          className="size-5 animate-spin text-muted dark:text-dark-muted"
          strokeWidth={2}
          aria-hidden
        />
      ) : (
        <GoogleMark />
      )}
      <span>{label}</span>
    </button>
  );
}

function ConfiguredGoogleButton({
  intent,
  disabled,
  onAuthSuccess,
  onAuthFailure,
}) {
  const { mutate, isPending } = useGoogleAuth({
    showSuccessToast: false,
    showErrorToast: false,
  });

  const loginWithGoogle = useGoogleLogin({
    flow: "implicit",
    scope: "openid profile email",
    onSuccess: (tokenResponse) => {
      const accessToken = tokenResponse?.access_token;
      if (!accessToken) {
        onAuthFailure?.("Google did not return an access token.");
        return;
      }

      mutate(
        { access_token: accessToken },
        {
          onSuccess: (data) => onAuthSuccess?.(data),
          onError: (err) =>
            onAuthFailure?.(err.message || "Google sign-in failed."),
        },
      );
    },
    onError: () => {
      onAuthFailure?.(
        intent === "signup"
          ? "Google sign-up was cancelled or failed."
          : "Google sign-in was cancelled or failed.",
      );
    },
  });

  return (
    <GoogleButtonShell
      intent={intent}
      busy={isPending}
      disabled={disabled}
      onClick={() => loginWithGoogle()}
    />
  );
}

export default function GoogleSignInButton({
  intent = "signin",
  disabled = false,
  onAuthSuccess,
  onAuthFailure,
}) {
  if (!hasGoogleOAuthClientId()) {
    return (
      <GoogleButtonShell
        intent={intent}
        busy={false}
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID to enable Google authentication."
      />
    );
  }

  return (
    <ConfiguredGoogleButton
      intent={intent}
      disabled={disabled}
      onAuthSuccess={onAuthSuccess}
      onAuthFailure={onAuthFailure}
    />
  );
}
