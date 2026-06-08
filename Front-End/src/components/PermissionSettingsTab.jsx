import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Field from "./Field";
import GlobalModal from "./GlobalModal";
import Select from "./Select";
import SettingsSectionCard from "./SettingsSectionCard";
import RepoOverviewStatCard from "./repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "./repo/repoOverviewStatPalettes";
import {
  useCreatePermission,
  usePermissionsByClient,
} from "../services/useApi";

const PERMISSIONS_CLIENT_ID =
  import.meta.env.VITE_PERMISSIONS_CLIENT_ID ?? "file-service";

function permissionResource(permission) {
  return String(
    permission?.resource ??
      permission?.resource_name ??
      permission?.resourceName ??
      "GENERAL",
  ).trim();
}

function permissionAction(permission) {
  return String(
    permission?.action ?? permission?.operation ?? permission?.verb ?? "ACCESS",
  ).trim();
}

function isSystemPermission(permission) {
  return Boolean(
    permission?.is_system_permission ??
      permission?.isSystemPermission ??
      permission?.system,
  );
}

export default function PermissionSettingsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = usePermissionsByClient(PERMISSIONS_CLIENT_ID);

  const permissions = useMemo(() => {
    const list = data?.permissions ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        permissionResource(p).toLowerCase().includes(q) ||
        permissionAction(p).toLowerCase().includes(q),
    );
  }, [data, filter]);

  const total = data?.total ?? permissions.length;

  const createMutation = useCreatePermission({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["permissions", "client", PERMISSIONS_CLIENT_ID],
      });
      setCreateOpen(false);
    },
  });

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    resource: "",
    action: "",
    is_system_permission: "false",
  });

  const resetDraft = () => {
    setDraft({
      name: "",
      description: "",
      resource: "",
      action: "",
      is_system_permission: "false",
    });
  };

  const handleCreate = () => {
    if (!draft.name.trim() || !draft.resource.trim() || !draft.action.trim()) {
      return;
    }
    createMutation.mutate({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      client_id: PERMISSIONS_CLIENT_ID,
      resource: draft.resource.trim().toUpperCase(),
      action: draft.action.trim().toUpperCase(),
      is_system_permission: draft.is_system_permission === "true",
    });
    resetDraft();
  };

  const closeModal = (openFlag) => {
    if (!openFlag) {
      setCreateOpen(false);
      resetDraft();
    }
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={KeyRound}
        title={t("settings.permissions.title")}
        description={t("settings.permissions.apiDescription")}
        action={
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            {t("settings.permissions.actions.openCreateModal")}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:gap-4">
          <RepoOverviewStatCard
            icon={KeyRound}
            label={t("settings.permissions.summary.totalPermissions")}
            value={isLoading ? "—" : total}
            hint={t("settings.permissions.existing.title")}
            palette={REPO_OVERVIEW_STAT_PALETTES[0]}
          />
          <RepoOverviewStatCard
            icon={ShieldCheck}
            label={t("settings.permissions.clientIdLabel")}
            palette={REPO_OVERVIEW_STAT_PALETTES[2]}
          >
            <p className="font-mono text-lg font-semibold tracking-tight text-primary dark:text-dark-primary">
              {PERMISSIONS_CLIENT_ID}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-secondary dark:text-dark-secondary">
              {t("settings.permissions.apiListHint")}
            </p>
          </RepoOverviewStatCard>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={KeyRound}
        title={t("settings.permissions.existing.title")}
        description={t("settings.permissions.apiListHint")}
      >
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Field
            register={{}}
            label={t("settings.permissions.filterLabel")}
            placeholder={t("settings.permissions.filterPlaceholder")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-3 text-xs text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
            <span className="font-semibold text-primary dark:text-dark-primary">
              {isLoading ? "—" : permissions.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-primary dark:text-dark-primary">
              {isLoading ? "—" : total}
            </span>{" "}
            permissions
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
          {isLoading && (
            <p className="p-4 text-sm text-muted dark:text-dark-muted">
              {t("settings.permissions.loading")}
            </p>
          )}
          {!isLoading && permissions.length ? (
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-light-divider bg-light-app-tertiary text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-dark-divider dark:bg-dark-app-tertiary dark:text-dark-muted">
                  <th className="px-4 py-3 text-left">Permission</th>
                  <th className="px-4 py-3 text-left">Resource</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-divider dark:divide-dark-divider">
                {permissions.map((item) => {
                  const resource = permissionResource(item);
                  const action = permissionAction(item);
                  const systemPermission = isSystemPermission(item);

                  return (
                    <tr
                      key={item.id ?? item.name}
                      className="text-primary transition-colors hover:bg-light-app-tertiary/80 dark:text-dark-primary dark:hover:bg-dark-app-tertiary/80"
                    >
                      <td className="max-w-[360px] px-4 py-3">
                        <p className="font-semibold">{item.name}</p>
                        {item.description ? (
                          <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                            {item.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                          {resource}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                          {action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            systemPermission
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          }`}
                        >
                          {systemPermission
                            ? t("settings.permissions.systemYes")
                            : t("settings.permissions.systemNo")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
          {!isLoading && !permissions.length && (
            <p className="p-4 text-sm text-muted dark:text-dark-muted">
              {t("settings.permissions.empty")}
            </p>
          )}
        </div>
      </SettingsSectionCard>

      <GlobalModal
        variant="center"
        open={createOpen}
        setOpen={closeModal}
        isClose
        title={t("settings.permissions.modal.title")}
        subtitle={t("settings.permissions.apiCreateHint")}
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => closeModal(false)}
            >
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createMutation.isPending}
              onClick={handleCreate}
            >
              {t("settings.permissions.create.action")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(36rem,92vw)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            register={{}}
            label={t("settings.permissions.fields.permissionName")}
            placeholder={t("settings.permissions.placeholders.permissionName")}
            value={draft.name}
            onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
          />
          <Field
            register={{}}
            label={t("settings.permissions.fields.resource")}
            placeholder={t("settings.permissions.placeholders.resource")}
            value={draft.resource}
            onChange={(e) =>
              setDraft((c) => ({ ...c, resource: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.permissions.fields.action")}
            placeholder={t("settings.permissions.placeholders.action")}
            value={draft.action}
            onChange={(e) =>
              setDraft((c) => ({ ...c, action: e.target.value }))
            }
          />
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.permissions.fields.systemPermission")}
            </span>
            <Select
              value={draft.is_system_permission}
              onChange={(v) =>
                setDraft((c) => ({ ...c, is_system_permission: v }))
              }
              options={[
                { value: "false", label: t("settings.permissions.systemNo") },
                { value: "true", label: t("settings.permissions.systemYes") },
              ]}
            />
          </div>
          <div className="md:col-span-2">
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
        </div>
      </GlobalModal>
    </div>
  );
}
