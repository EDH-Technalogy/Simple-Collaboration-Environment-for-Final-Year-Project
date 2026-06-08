import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Field from "./Field";
import GlobalModal from "./GlobalModal";
import SettingsSectionCard from "./SettingsSectionCard";
import RepoOverviewStatCard from "./repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "./repo/repoOverviewStatPalettes";
import { useCreateRole, useDeleteRole, useRoles } from "../services/useApi";

const PROTECTED_ROLE_PATTERNS = [
  "admin",
  "administrator",
  "platform",
  "default-role",
  "uma_authorization",
];

function roleNameOf(role) {
  return String(role?.name ?? role?.roleKey ?? role?.id ?? "UNKNOWN_ROLE");
}

function roleDescriptionOf(role) {
  return String(role?.description ?? "").trim();
}

function roleIdentifierOf(role, roleName) {
  return String(role?.id ?? role?.roleId ?? role?.key ?? roleName);
}

function isProtectedRole(roleName) {
  const normalized = String(roleName).toLowerCase();
  return PROTECTED_ROLE_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
}

export default function RoleSettingsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading } = useRoles();

  const roles = useMemo(() => data?.roles ?? [], [data]);
  const total = data?.total ?? roles.length;

  const createMutation = useCreateRole({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setCreateOpen(false);
    },
  });
  const deleteMutation = useDeleteRole({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetDraft = () => setDraft({ name: "", description: "" });

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    createMutation.mutate({
      name: draft.name.trim().toUpperCase().replace(/\s+/g, "_"),
      description: draft.description.trim() || undefined,
    });
    resetDraft();
  };

  const closeCreateModal = (openFlag) => {
    if (!openFlag) {
      setCreateOpen(false);
      resetDraft();
    }
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={UsersRound}
        title={t("settings.roles.title")}
        description={t("settings.roles.apiDescription")}
        action={
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            {t("settings.roles.actions.openCreateModal")}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:gap-4">
          <RepoOverviewStatCard
            icon={UsersRound}
            label={t("settings.roles.summary.existingRoles")}
            value={isLoading ? "—" : total}
            hint={t("settings.roles.existing.title")}
            palette={REPO_OVERVIEW_STAT_PALETTES[0]}
          />
          <RepoOverviewStatCard
            icon={ShieldCheck}
            label={t("settings.roles.title")}
            palette={REPO_OVERVIEW_STAT_PALETTES[3]}
          >
            <p className="text-sm leading-6 text-secondary dark:text-dark-secondary">
              {t("settings.roles.assignHint")}
            </p>
          </RepoOverviewStatCard>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={UsersRound}
        title={t("settings.roles.existing.title")}
        description={t("settings.roles.apiListHint")}
      >
        <div className="mb-4 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-3 text-xs text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
          <span className="font-semibold text-primary dark:text-dark-primary">
            {isLoading ? "—" : roles.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-primary dark:text-dark-primary">
            {isLoading ? "—" : total}
          </span>{" "}
          roles returned from the identity service
        </div>
        <div className="max-h-[520px] overflow-auto rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
          {isLoading && (
            <p className="p-4 text-sm text-muted dark:text-dark-muted">
              {t("settings.roles.loading")}
            </p>
          )}
          {!isLoading && roles.length ? (
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-light-divider bg-light-app-tertiary text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-dark-divider dark:bg-dark-app-tertiary dark:text-dark-muted">
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Identifier</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-divider dark:divide-dark-divider">
                {roles.map((role) => {
                  const roleName = roleNameOf(role);
                  const roleDescription = roleDescriptionOf(role);
                  const roleIdentifier = roleIdentifierOf(role, roleName);
                  const protectedRole = isProtectedRole(roleName);

                  return (
                    <tr
                      key={roleName}
                      className="text-primary transition-colors hover:bg-light-app-tertiary/80 dark:text-dark-primary dark:hover:bg-dark-app-tertiary/80"
                    >
                      <td className="max-w-[380px] px-4 py-3">
                        <p className="font-semibold">{roleName}</p>
                        {roleDescription ? (
                          <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                            {roleDescription}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex max-w-[220px] rounded-full bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                          <span className="truncate">{roleIdentifier}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            protectedRole
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                          }`}
                        >
                          {protectedRole ? "Protected" : "Custom"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Trash2
                          className="h-4 w-4 cursor-pointer hover:text-red-500"
                          strokeWidth={2}
                          aria-hidden
                          onClick={() => setDeleteTarget(roleName)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
          {!isLoading && !roles.length && (
            <p className="p-4 text-sm text-muted dark:text-dark-muted">
              {t("settings.roles.empty")}
            </p>
          )}
        </div>
      </SettingsSectionCard>

      <GlobalModal
        variant="center"
        open={createOpen}
        setOpen={closeCreateModal}
        isClose
        title={t("settings.roles.modal.title")}
        subtitle={t("settings.roles.apiCreateHint")}
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => closeCreateModal(false)}
            >
              {t("settings.roles.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createMutation.isPending}
              onClick={handleCreate}
            >
              {t("settings.roles.create.action")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(28rem,92vw)]"
      >
        <div className="grid gap-4">
          <Field
            register={{}}
            label={t("settings.roles.fields.apiRoleName")}
            placeholder={t("settings.roles.placeholders.apiRoleName")}
            value={draft.name}
            onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
          />
          <Field
            register={{}}
            label={t("settings.roles.fields.description")}
            placeholder={t("settings.roles.placeholders.description")}
            value={draft.description}
            onChange={(e) =>
              setDraft((c) => ({ ...c, description: e.target.value }))
            }
          />
        </div>
      </GlobalModal>

      <GlobalModal
        variant="center"
        open={Boolean(deleteTarget)}
        setOpen={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        isClose
        title={t("settings.roles.deleteConfirmTitle")}
        subtitle={t("settings.roles.deleteConfirmMessage", {
          name: deleteTarget ?? "",
        })}
        className="max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setDeleteTarget(null)}
            >
              {t("settings.roles.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              {t("settings.roles.delete")}
            </Button>
          </>
        }
      >
        <span className="sr-only">role delete</span>
      </GlobalModal>
    </div>
  );
}
