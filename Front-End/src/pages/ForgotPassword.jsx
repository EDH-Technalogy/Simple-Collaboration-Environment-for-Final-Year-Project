import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import IC from "../components/IC";
import Field from "../components/Field";
import Button from "../components/Button";
import { useForgotPassword, useResetPassword } from "../services/useApi";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token")?.trim() ?? "";
  const isResetMode = resetToken.length > 0;
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      email: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const { mutateAsync: sendResetLink, isPending: isSendingResetLink } =
    useForgotPassword({
      toastSuccess: "forgotPassword.toast.success",
    });
  const { mutateAsync: resetPassword, isPending: isResettingPassword } =
    useResetPassword({
      toastSuccess: "forgotPassword.toast.resetSuccess",
      onSuccess: () => setDone(true),
    });

  const isPending = isSendingResetLink || isResettingPassword;
  const newPassword = watch("new_password");

  const passwordRules = {
    required: t("forgotPassword.validation.passwordRequired"),
    minLength: {
      value: 8,
      message: t("signup.validation.passwordMin"),
    },
    maxLength: {
      value: 128,
      message: t("signup.validation.passwordMax"),
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      message: t("signup.validation.passwordPattern"),
    },
  };

  const confirmPasswordRules = {
    required: t("forgotPassword.validation.confirmPasswordRequired"),
    validate: (value) =>
      value === newPassword || t("forgotPassword.validation.passwordMismatch"),
  };

  const submitForgotPassword = async (data) => {
    const email = String(data.email ?? "")
      .trim()
      .toLowerCase();
    await sendResetLink(email);
    setDone(true);
  };

  const submitResetPassword = async (data) => {
    await resetPassword({
      reset_token: resetToken,
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    });
  };

  const submit = isResetMode ? submitResetPassword : submitForgotPassword;

  const title = isResetMode
    ? t("forgotPassword.resetTitle")
    : t("forgotPassword.title");
  const subtext = isResetMode
    ? t("forgotPassword.resetSubtext")
    : t("forgotPassword.subtext");
  const successTitle = isResetMode
    ? t("forgotPassword.resetDoneTitle")
    : t("login.resetSent");
  const successText = isResetMode
    ? t("forgotPassword.resetDoneText")
    : t("login.checkInbox");
  const submitLabel = isResetMode
    ? t("forgotPassword.updatePassword")
    : t("login.sendResetLink");
  const pendingLabel = isResetMode
    ? t("forgotPassword.updating")
    : t("forgotPassword.sending");

  return (
    <div className="flex min-h-screen flex-col bg-shell px-4 py-10 dark:bg-dark-app">
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="fixed top-4 left-4 z-50 cursor-pointer rounded-lg border-none bg-transparent text-xs font-semibold text-secondary underline-offset-4 hover:underline dark:text-dark-secondary"
      >
        {t("login.backToSignIn")}
      </button>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-4 right-4 z-50 cursor-pointer rounded-lg border-none bg-transparent text-xs font-semibold text-secondary underline-offset-4 hover:underline rtl:left-4 rtl:right-auto dark:text-dark-secondary"
      >
        {t("login.publicStories")}
      </button>

      <div className="mx-auto mt-14 w-full max-w-md rounded-2xl border border-light-divider bg-(--color-light-card-bg) p-4 shadow-md md:p-5 dark:border-dark-divider dark:bg-(--color-dark-card-bg)">
        {!done ? (
          <>
            <h1 className="text-xl font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {title}
            </h1>
            <p className="mt-2 text-[13px] text-secondary dark:text-dark-secondary">
              {subtext}
            </p>

            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={handleSubmit(submit)}
            >
              {isResetMode ? (
                <>
                  <Field
                    type="password"
                    label={t("forgotPassword.newPassword")}
                    placeholder={t("forgotPassword.newPasswordPlaceholder")}
                    register={register("new_password", passwordRules)}
                    error={errors?.new_password?.message}
                    autoComplete="new-password"
                  />
                  <Field
                    type="password"
                    label={t("forgotPassword.confirmPassword")}
                    placeholder={t("forgotPassword.confirmPasswordPlaceholder")}
                    register={register("confirm_password", confirmPasswordRules)}
                    error={errors?.confirm_password?.message}
                    autoComplete="new-password"
                  />
                </>
              ) : (
                <Field
                  type="email"
                  label={t("login.emailAddress")}
                  placeholder={t("forgotPassword.emailPlaceholder")}
                  register={register("email", {
                    required: t("forgotPassword.validation.emailRequired"),
                  })}
                  error={errors?.email?.message}
                  autoComplete="email"
                />
              )}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isPending}
                className="h-9 w-full justify-center rounded-xl text-xs!"
              >
                {isPending ? (
                  <>
                    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                    {pendingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col gap-3 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-success/40 bg-success/10 dark:bg-success/15">
              <Icon d={IC.check} className="size-4 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {successTitle}
            </h2>
            <p className="text-[13px] text-muted dark:text-dark-muted">
              {successText}
            </p>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="h-9 rounded-xl justify-center!"
              onClick={() => navigate("/login")}
            >
              {t("login.backToSignIn")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
