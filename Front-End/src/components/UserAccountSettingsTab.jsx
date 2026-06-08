import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, UploadCloud, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import Button from "./Button";
import Field from "./Field";
import GlobalModal from "./GlobalModal";
import SettingsSectionCard from "./SettingsSectionCard";
import { useAuth } from "../context/AuthContext";
import { resolveProfilePhotoUrl, pickProfilePictureRaw } from "../lib/profileMedia";
import { buildPersonInitials } from "../lib/profileMedia";
import { useChangePassword, useUploadAccountProfilePicture } from "../services/useApi";

export default function UserAccountSettingsTab() {
  const { t } = useTranslation();
  const { user, refreshSession } = useAuth();
  const queryClient = useQueryClient();

  const profileField = useMemo(() => pickProfilePictureRaw(user ?? {}), [user]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwModalOpen, setPwModalOpen] = useState(false);

  const userId = user?.id != null ? String(user.id) : "";

  const uploadMutation = useUploadAccountProfilePicture({
    showSuccessToast: true,
    toastSuccess: t("settings.account.profileUploadSuccess"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await refreshSession?.();
      setSelectedFile(null);
      setLocalPreviewUrl("");
    },
  });

  const changePasswordMutation = useChangePassword({
    toastSuccess: t("settings.account.passwordChangeSuccess"),
    onSuccess: async () => {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwModalOpen(false);
    },
  });

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const onPickFile = useCallback(
    (e) => {
      const file = e.target.files?.[0] ?? null;
      if (!file) {
        setSelectedFile(null);
        return;
      }
      const okType = ["image/png", "image/jpeg"].includes(file.type);
      if (!okType) {
        gooeyToast.error(t("settings.account.photo.invalidType"));
        e.target.value = "";
        return;
      }
      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        gooeyToast.error(t("settings.account.photo.tooLarge", { mb: 2 }));
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    },
    [t],
  );

  const uploadProfilePhoto = useCallback(() => {
    if (!userId || !selectedFile) return;
    uploadMutation.mutate({
      userId,
      role: user?.role,
      user_type: user?.user_type,
      file: selectedFile,
    });
  }, [uploadMutation, selectedFile, userId, user?.role, user?.user_type]);

  const submitPassword = useCallback(() => {
    if (!userId) return;
    changePasswordMutation.mutate({
      userId,
      current_password: currentPw,
      new_password: newPw,
      confirm_password: confirmPw,
    });
  }, [userId, currentPw, newPw, confirmPw, changePasswordMutation]);

  const photoPreview = localPreviewUrl || resolveProfilePhotoUrl({ ...user, profilePicture: profileField });
  const initials = buildPersonInitials(user ?? {});

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={UserCircle}
        title={t("settings.account.title")}
        description={t("settings.account.description")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--color-light-card-border) bg-light-app-secondary text-lg font-bold uppercase text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-app-secondary) dark:text-dark-primary">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <dl className="min-w-0 flex-1 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <dt className="text-[11px] font-semibold text-(--color-light-text-muted) dark:text-dark-text-muted">
                {t("settings.account.fields.username")}
              </dt>
              <dd className="font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {user?.username ?? user?.user_name ?? "—"}
              </dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-[11px] font-semibold text-(--color-light-text-muted) dark:text-dark-text-muted">
                {t("settings.account.fields.email")}
              </dt>
              <dd className="break-all font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {user?.email ?? "—"}
              </dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-[11px] font-semibold text-(--color-light-text-muted) dark:text-dark-text-muted">
                {t("settings.account.fields.role")}
              </dt>
              <dd className="capitalize font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {user?.role ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 max-w-xl">
          <div className="space-y-2">
            <label
              htmlFor="account-profile-picture-file"
              className="block text-[11px] font-semibold text-(--color-light-text-muted) dark:text-dark-text-muted"
            >
              {t("settings.account.fields.profilePhoto")}
            </label>
            <input
              id="account-profile-picture-file"
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={onPickFile}
              className="block w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3.5 py-2 text-sm text-(--color-light-text-primary) file:me-3 file:rounded-lg file:border-0 file:bg-light-app-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-(--color-light-card-hover) focus-visible:border-(--color-light-input-border-focus) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:file:bg-(--color-dark-app-secondary) dark:file:text-dark-primary dark:hover:file:bg-(--color-dark-card-hover) dark:focus-visible:border-dark-input-border-focus dark:focus-visible:ring-blue-400/15"
            />
            <p className="text-[11px] leading-relaxed text-(--color-light-text-muted) dark:text-dark-text-muted">
              {t("settings.account.fields.profilePhotoHint", { mb: 2 })}
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-(--color-light-text-muted) dark:text-dark-text-muted">
            {t("settings.account.photo.note")}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            type="button"
            loading={uploadMutation.isPending}
            disabled={!userId || !selectedFile}
            onClick={uploadProfilePhoto}
          >
            <span className="inline-flex items-center gap-2">
              <UploadCloud className="size-4" aria-hidden />
              {t("settings.account.actions.uploadProfilePhoto")}
            </span>
          </Button>
          {selectedFile ? (
            <Button
              variant="tertiary"
              type="button"
              disabled={uploadMutation.isPending}
              onClick={() => {
                setSelectedFile(null);
                setLocalPreviewUrl("");
              }}
            >
              {t("settings.account.actions.clearSelected")}
            </Button>
          ) : null}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={KeyRound}
        title={t("settings.account.passwordTitle")}
        description={t("settings.account.passwordDescription")}
      >
        <div className="mt-4">
          <Button
            variant="secondary"
            type="button"
            disabled={!userId}
            onClick={() => setPwModalOpen(true)}
          >
            {t("settings.account.actions.openPasswordModal")}
          </Button>
        </div>
      </SettingsSectionCard>

      <GlobalModal
        open={pwModalOpen}
        setOpen={setPwModalOpen}
        isClose
        title={t("settings.account.passwordModal.title")}
        subtitle={t("settings.account.passwordModal.subtitle")}
        footer={
          <>
            <Button
              variant="tertiary"
              type="button"
              disabled={changePasswordMutation.isPending}
              onClick={() => setPwModalOpen(false)}
            >
              {t("settings.account.actions.cancel")}
            </Button>
            <Button
              variant="primary"
              type="button"
              loading={changePasswordMutation.isPending}
              disabled={!userId || !currentPw || !newPw || newPw !== confirmPw}
              onClick={submitPassword}
            >
              {t("settings.account.actions.changePassword")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Field
            id="account-current-password"
            label={t("settings.account.fields.currentPassword")}
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />
          <Field
            id="account-new-password"
            label={t("settings.account.fields.newPassword")}
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
          <Field
            id="account-confirm-password"
            label={t("settings.account.fields.confirmPassword")}
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </GlobalModal>
    </div>
  );
}
