import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCheck,
  ArrowUpDown,
  BadgeCheck,
  CalendarDays,
  Columns3,
  EyeOff,
  Filter,
  Hash,
  LayoutGrid,
  LayoutList,
  ListChecks,
  Lock,
  MailCheck,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  UserSquare2,
} from "lucide-react";
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "../../components/DropdownMenu";
import IC from "../../components/IC";
import Icon from "../../components/Icon";
import Select from "../../components/Select";
import Table from "../../components/Table";
import TableBody from "../../components/TableBody";
import TableColumn from "../../components/TableColumn";
import TableHeader from "../../components/TableHeader";
import TableRow from "../../components/TableRow";
import Pagination from "../../components/Pagination";
import PersonAvatar from "../../components/PersonAvatar";
import Checkbox from "../../components/Checkbox";
import Button from "../../components/Button";
import Field from "../../components/Field";
import GlobalModal from "../../components/GlobalModal";
import SensitiveActionModal from "../../components/SensitiveActionModal";
import TableToolbar from "../../components/TableToolbar";
import StatusPill, { statusToPillVariant } from "../../components/StatusPill";
import {
  AdminRecordsBoard,
  AdminTableToolDropdowns,
} from "../../components/admin/AdminTableControls";
import { normalizeUserPayload } from "../../lib/roles";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  useAssignPermissionRole,
  useAssignRoleToUser,
  useDeleteUser,
  usePermissionsByClient,
  useLockUser,
  useRemovePermissionRole,
  useRemoveRoleFromUser,
  useRoles,
  useSuspendUser,
  useUsersList,
  useActivateUser,
  useVerifyUserEmailByAdmin,
} from "../../services/useApi";

const EMPTY = [];
const PERMISSIONS_CLIENT_ID =
  import.meta.env.VITE_PERMISSIONS_CLIENT_ID ?? "file-service";

const USER_ROLE_ACTIONS = {
  assignRole: "assignRole",
  removeRole: "removeRole",
  assignPermission: "assignPermission",
  removePermission: "removePermission",
};

const USER_ACCOUNT_ACTIONS = {
  suspend: "suspend",
  activate: "activate",
  lock: "lock",
  verifyEmail: "verifyEmail",
};

function unwrapUsersPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return EMPTY;
  const nested =
    payload.data ??
    payload.content ??
    payload.items ??
    payload.records ??
    payload.results ??
    payload.users;
  return Array.isArray(nested) ? nested : EMPTY;
}

function normalizeUserRow(raw) {
  const user = normalizeUserPayload(raw);
  const roles = Array.isArray(raw?.roles)
    ? raw.roles.map((role) => String(role))
    : EMPTY;
  const firstRegistered = normalizeRegisteredDate(raw);
  const status = normalizeAccountStatus(raw?.status);

  return {
    ...raw,
    ...user,
    id: user.id ?? raw?.id ?? "",
    displayName:
      user.fullName ||
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.user_name ||
      user.email ||
      "",
    roleKey: user.role ?? "student",
    roles,
    status,
    emailVerified: Boolean(
      raw?.emailVerified ??
        raw?.email_verified ??
        raw?.verifiedEmail ??
        raw?.emailVerifiedAt ??
        user?.emailVerified ??
        false,
    ),
    registered: firstRegistered,
  };
}

function firstAttributeValue(attributes, ...keys) {
  if (!attributes || typeof attributes !== "object") return "";
  for (const key of keys) {
    const value = attributes[key];
    if (Array.isArray(value) && value.length) {
      const first = String(value[0] ?? "").trim();
      if (first) return first;
    }
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeDateValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 10_000_000_000 ? value * 1000 : value;
    return new Date(millis).toISOString();
  }
  const text = String(value).trim();
  if (!text) return "";
  if (/^\d+$/.test(text)) {
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      const millis = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
      return new Date(millis).toISOString();
    }
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeRegisteredDate(raw) {
  const fromAttributes = firstAttributeValue(
    raw?.attributes,
    "registered_at",
    "registeredAt",
    "created_at",
    "createdAt",
  );
  return (
    normalizeDateValue(raw?.createdAt) ||
    normalizeDateValue(raw?.created_at) ||
    normalizeDateValue(raw?.createdTimestamp) ||
    normalizeDateValue(raw?.created_timestamp) ||
    normalizeDateValue(raw?.registered) ||
    normalizeDateValue(raw?.registered_at) ||
    normalizeDateValue(fromAttributes) ||
    normalizeDateValue(raw?.joined) ||
    normalizeDateValue(raw?.updatedAt) ||
    normalizeDateValue(raw?.updated_at)
  );
}

function formatRegisteredDate(value, locale) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return "—";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeAccountStatus(status) {
  const normalized =
    String(status ?? "ACTIVE")
      .trim()
      .toLowerCase() || "active";
  if (["enabled", "active"].includes(normalized)) return "active";
  if (["disabled", "disable"].includes(normalized)) return "disabled";
  if (["suspended", "suspend"].includes(normalized)) return "suspended";
  return normalized;
}

function userIsSuspended(user) {
  return ["disabled", "suspended"].includes(
    normalizeAccountStatus(user?.status),
  );
}

function userStatusLabel(t, status) {
  const normalized = normalizeAccountStatus(status);
  return t(`adminShared.status.${normalized}`, {
    defaultValue:
      normalized.charAt(0).toUpperCase() + normalized.slice(1),
  });
}

function userEmailIsVerified(user) {
  return Boolean(
    user?.emailVerified ??
      user?.email_verified ??
      user?.verifiedEmail ??
      user?.emailVerifiedAt,
  );
}

function toUniqueRoleNames(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : EMPTY)
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function extractUserRealmRoles(user) {
  return toUniqueRoleNames([user?.roleKey, ...(user?.roles ?? [])]);
}

function extractNamedItems(values) {
  if (!Array.isArray(values)) return EMPTY;
  return values
    .map((item) =>
      String(
        item?.name ??
          item?.roleName ??
          item?.role ??
          item?.authority ??
          item?.permissionName ??
          item?.roleKey ??
          item?.id ??
          item ??
          "",
      ).trim(),
    )
    .filter(Boolean);
}

function adminEntityProfilePath(user) {
  const rk = String(user?.roleKey ?? "").toLowerCase();
  if (rk === "student" || rk === "user" || rk === "author")
    return `/admin/student/${encodeURIComponent(user.id)}`;
  if (rk === "teacher") return `/admin/teacher/${encodeURIComponent(user.id)}`;
  if (rk === "staff") return `/admin/employee/${encodeURIComponent(user.id)}`;
  return `/admin/users/${encodeURIComponent(user.id)}`;
}

function extractUserPermissionRoles(user, clientId) {
  const exactClientId = String(clientId ?? "").trim();
  const buckets = [
    ...(Array.isArray(user?.permissionRoles) ? [user.permissionRoles] : EMPTY),
    ...(Array.isArray(user?.clientRoles) ? [user.clientRoles] : EMPTY),
    ...(Array.isArray(user?.permissions) ? [user.permissions] : EMPTY),
    ...(Array.isArray(user?.authorities) ? [user.authorities] : EMPTY),
  ];

  const directRoles = extractNamedItems(buckets.flat());

  const scopedSources = [
    user?.clientRoleMappings,
    user?.permissionRoleMappings,
    user?.client_permissions,
    user?.clientPermissions,
  ].filter((value) => value && typeof value === "object");

  const scopedRoles = scopedSources.flatMap((source) => {
    if (Array.isArray(source)) {
      return source
        .filter((item) => {
          const itemClientId = String(
            item?.clientId ?? item?.client_id ?? item?.client ?? "",
          ).trim();
          return !exactClientId || itemClientId === exactClientId;
        })
        .flatMap((item) =>
          extractNamedItems([
            item?.name,
            item?.roleName,
            item?.role,
            ...(Array.isArray(item?.roles) ? item.roles : EMPTY),
            ...(Array.isArray(item?.permissions) ? item.permissions : EMPTY),
          ]),
        );
    }

    if (exactClientId && Array.isArray(source[exactClientId])) {
      return extractNamedItems(source[exactClientId]);
    }

    return EMPTY;
  });

  return toUniqueRoleNames([...directRoles, ...scopedRoles]);
}

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState("list");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const [compactRows, setCompactRows] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [roleDialog, setRoleDialog] = useState(null);
  const [roleDraft, setRoleDraft] = useState({
    roleName: "",
    clientId: PERMISSIONS_CLIENT_ID,
  });
  const [accountDialog, setAccountDialog] = useState(null);
  const [lockDurationMinutes, setLockDurationMinutes] = useState("30");

  const roleActionType = roleDialog?.type ?? null;
  const isPermissionAction =
    roleActionType === USER_ROLE_ACTIONS.assignPermission ||
    roleActionType === USER_ROLE_ACTIONS.removePermission;

  const closeRoleDialog = () => {
    setRoleDialog(null);
    setRoleDraft({
      roleName: "",
      clientId: PERMISSIONS_CLIENT_ID,
    });
  };
  const closeAccountDialog = () => {
    setAccountDialog(null);
    setLockDurationMinutes("30");
  };

  const invalidateUsersQuery = () =>
    queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "users",
    });

  const deleteUserMutation = useDeleteUser({
    showSuccessToast: false,
    showErrorToast: false,
    onSuccess: () => {
      void invalidateUsersQuery();
    },
  });
  const assignRoleMutation = useAssignRoleToUser({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeRoleDialog();
    },
  });
  const removeRoleMutation = useRemoveRoleFromUser({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeRoleDialog();
    },
  });
  const assignPermissionMutation = useAssignPermissionRole({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeRoleDialog();
    },
  });
  const removePermissionMutation = useRemovePermissionRole({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeRoleDialog();
    },
  });
  const suspendUserMutation = useSuspendUser({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeAccountDialog();
    },
  });
  const activateUserMutation = useActivateUser({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeAccountDialog();
    },
  });
  const lockUserMutation = useLockUser({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeAccountDialog();
    },
  });
  const verifyEmailMutation = useVerifyUserEmailByAdmin({
    onSuccess: () => {
      void invalidateUsersQuery();
      closeAccountDialog();
    },
  });

  const { data, isError, error } = useUsersList();
  const { data: rolesData } = useRoles();
  const { data: permissionsData, isLoading: permissionsLoading } =
    usePermissionsByClient(roleDraft.clientId, {
      enabled: Boolean(isPermissionAction && roleDraft.clientId.trim()),
    });

  const users = useMemo(
    () => unwrapUsersPayload(data).map(normalizeUserRow).filter(Boolean),
    [data],
  );
  const availableRoles = useMemo(() => {
    const list = rolesData?.roles ?? [];
    return list
      .map((role) =>
        String(role?.name ?? role?.roleKey ?? role?.id ?? "").trim(),
      )
      .filter(Boolean);
  }, [rolesData]);
  const availablePermissionRoles = useMemo(() => {
    const list = permissionsData?.permissions ?? [];
    return list
      .map((item) =>
        String(item?.name ?? item?.roleKey ?? item?.id ?? "").trim(),
      )
      .filter(Boolean);
  }, [permissionsData]);

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        [
          user.displayName,
          user.email,
          user.user_name,
          user.username,
          user.roleKey,
          ...(Array.isArray(user.roles) ? user.roles : EMPTY),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [debouncedSearch, statusFilter, users]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const sortOptions = [
    { value: "name", label: t("adminUsers.table.user") },
    { value: "role", label: t("adminUsers.table.role") },
    { value: "status", label: t("adminUsers.table.status") },
    { value: "registered", label: t("adminUsers.table.registered") },
  ];
  const sortedUsers = useMemo(() => {
    const accessors = {
      name: (user) => user.displayName ?? user.email ?? user.username ?? "",
      role: (user) => user.roleKey ?? "",
      status: (user) => user.status ?? "",
      registered: (user) => user.registered ?? "",
    };
    const getValue = accessors[sortKey] ?? accessors.name;
    return [...filteredUsers].sort((a, b) => {
      const result = String(getValue(a)).localeCompare(String(getValue(b)), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "desc" ? -result : result;
    });
  }, [filteredUsers, sortDirection, sortKey]);

  const totalElements = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const start = (page - 1) * pageSize;
  const pageUsers = sortedUsers.slice(start, start + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const deletingUser = sortedUsers.find(
    (row) => String(row.id) === String(deleteUserId),
  );
  const roleDialogUser = roleDialog?.user ?? null;
  const roleDialogUserRoles = useMemo(() => {
    return extractUserRealmRoles(roleDialogUser);
  }, [roleDialogUser]);
  const roleDialogUserPermissionRoles = useMemo(
    () => extractUserPermissionRoles(roleDialogUser, roleDraft.clientId),
    [roleDialogUser, roleDraft.clientId],
  );
  const realmRoleOptions = useMemo(() => {
    const currentRoles = new Set(roleDialogUserRoles);
    const source =
      roleActionType === USER_ROLE_ACTIONS.removeRole
        ? roleDialogUserRoles
        : availableRoles.filter((roleName) => !currentRoles.has(roleName));
    return source.map((roleName) => ({
      value: roleName,
      label: roleName,
    }));
  }, [availableRoles, roleActionType, roleDialogUserRoles]);
  const permissionRoleOptions = useMemo(() => {
    const currentRoles = new Set(roleDialogUserPermissionRoles);
    const source =
      roleActionType === USER_ROLE_ACTIONS.removePermission
        ? availablePermissionRoles.filter((roleName) =>
            currentRoles.has(roleName),
          )
        : availablePermissionRoles.filter(
            (roleName) => !currentRoles.has(roleName),
          );
    return source.map((roleName) => ({
      value: roleName,
      label: roleName,
    }));
  }, [availablePermissionRoles, roleActionType, roleDialogUserPermissionRoles]);
  const roleOperationSubmitting =
    assignRoleMutation.isPending ||
    removeRoleMutation.isPending ||
    assignPermissionMutation.isPending ||
    removePermissionMutation.isPending;
  const accountOperationSubmitting =
    suspendUserMutation.isPending ||
    activateUserMutation.isPending ||
    lockUserMutation.isPending ||
    verifyEmailMutation.isPending;

  const columnDefs = useMemo(
    () => [
      {
        id: "select",
        title: "",
        required: true,
        tooltip: t("adminShared.tableHints.bulkSelection"),
        icon: (
          <ListChecks
            className="size-3.5 shrink-0 opacity-70"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "id",
        title: t("adminUsers.table.id"),
        tooltip: t("adminShared.tableHints.recordId"),
        icon: (
          <Hash className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ),
      },
      {
        id: "user",
        title: t("adminUsers.table.user"),
        tooltip: t("adminShared.tableHints.displayName"),
        icon: (
          <UserSquare2
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "role",
        title: t("adminUsers.table.role"),
        tooltip: t("adminShared.tableHints.roleAssignment"),
        icon: (
          <ShieldCheck
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "status",
        title: t("adminUsers.table.status"),
        tooltip: t("adminShared.tableHints.columnStatus"),
        icon: (
          <BadgeCheck
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "registered",
        title: t("adminUsers.table.registered"),
        tooltip: t("adminShared.tableHints.dateRegistered"),
        icon: (
          <CalendarDays
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "actions",
        required: true,
        title: t("adminUsers.table.actions"),
        align: "center",
        tooltip: t("adminShared.tableHints.rowActions"),
        icon: (
          <LayoutList
            className="size-3.5 shrink-0 opacity-80"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
    ],
    [t],
  );
  const visibleColumnDefs = useMemo(
    () => columnDefs.filter((column) => !hiddenColumns.has(column.id)),
    [columnDefs, hiddenColumns],
  );
  const headerData = useMemo(
    () =>
      visibleColumnDefs.map((column) => ({
        title: column.title,
        tooltip: column.tooltip,
        icon: column.icon,
        align: column.align,
        className: column.className,
      })),
    [visibleColumnDefs],
  );
  const isColumnVisible = (id) => !hiddenColumns.has(id);

  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : "en-US";

  const statusOptions = [
    { value: "all", label: t("adminShared.filters.allStatus") },
    { value: "active", label: t("adminShared.status.active") },
    { value: "disabled", label: t("adminShared.status.disabled") },
    { value: "pending", label: t("adminShared.status.pending") },
    { value: "rejected", label: t("adminShared.status.rejected") },
    { value: "suspended", label: t("adminShared.status.suspended") },
  ];

  const toggleSelected = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleColumn = (id) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDeleteUser = async () => {
    if (deleteUserId == null || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteUserMutation.mutateAsync(deleteUserId);
      window.GooeyToaster?.success?.(t("adminUsers.delete.success"));
      setDeleteUserId(null);
    } catch (e) {
      window.GooeyToaster?.error?.(e?.message || t("adminUsers.delete.error"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openRoleDialog = (type, user) => {
    const defaultRoleName =
      type === USER_ROLE_ACTIONS.removeRole
        ? (extractUserRealmRoles(user).find(Boolean) ?? "")
        : "";
    setRoleDialog({ type, user });
    setRoleDraft({
      roleName: defaultRoleName,
      clientId: PERMISSIONS_CLIENT_ID,
    });
  };

  const submitRoleOperation = async () => {
    if (!roleDialog?.user?.id) return;
    const roleName = roleDraft.roleName.trim();
    const clientId = roleDraft.clientId.trim();
    if (!roleName) return;

    if (roleActionType === USER_ROLE_ACTIONS.assignRole) {
      await assignRoleMutation.mutateAsync({
        roleName,
        userId: roleDialog.user.id,
      });
      return;
    }

    if (roleActionType === USER_ROLE_ACTIONS.removeRole) {
      await removeRoleMutation.mutateAsync({
        roleName,
        userId: roleDialog.user.id,
      });
      return;
    }

    if (!clientId) return;

    if (roleActionType === USER_ROLE_ACTIONS.assignPermission) {
      await assignPermissionMutation.mutateAsync({
        clientId,
        roleName,
        userId: roleDialog.user.id,
      });
      return;
    }

    if (roleActionType === USER_ROLE_ACTIONS.removePermission) {
      await removePermissionMutation.mutateAsync({
        clientId,
        roleName,
        userId: roleDialog.user.id,
      });
    }
  };

  const openAccountDialog = (type, user) => {
    setAccountDialog({ type, user });
    setLockDurationMinutes("30");
  };

  const submitAccountOperation = async () => {
    if (!accountDialog?.user?.id) return;
    const userId = accountDialog.user.id;

    if (accountDialog.type === USER_ACCOUNT_ACTIONS.suspend) {
      await suspendUserMutation.mutateAsync(userId);
      return;
    }

    if (accountDialog.type === USER_ACCOUNT_ACTIONS.activate) {
      await activateUserMutation.mutateAsync(userId);
      return;
    }

    if (accountDialog.type === USER_ACCOUNT_ACTIONS.verifyEmail) {
      await verifyEmailMutation.mutateAsync(userId);
      return;
    }

    if (accountDialog.type === USER_ACCOUNT_ACTIONS.lock) {
      const durationMinutes = Math.max(
        1,
        Number.parseInt(lockDurationMinutes, 10) || 30,
      );
      await lockUserMutation.mutateAsync({ id: userId, durationMinutes });
    }
  };

  const renderUserActions = (user) => (
    <DropdownMenuRoot>
      <DropdownTrigger showArrow={false}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownItem onClick={() => navigate(adminEntityProfilePath(user))}>
          <span>{t("adminShared.actions.viewProfile")}</span>
        </DropdownItem>
        <DropdownSub>
          <DropdownSubTrigger icon={<ShieldCheck className="size-4" />}>
            {t("adminUsers.operations.roleMenu")}
          </DropdownSubTrigger>
          <DropdownSubContent>
            <DropdownItem
              onClick={() => openRoleDialog(USER_ROLE_ACTIONS.assignRole, user)}
              icon={<CheckCheck className="size-4" />}
            >
              <span>{t("adminUsers.operations.assignRole")}</span>
            </DropdownItem>
            <DropdownItem
              onClick={() => openRoleDialog(USER_ROLE_ACTIONS.removeRole, user)}
              icon={<ShieldCheck className="size-4" />}
            >
              <span>{t("adminUsers.operations.removeRole")}</span>
            </DropdownItem>
          </DropdownSubContent>
        </DropdownSub>
        <DropdownSub>
          <DropdownSubTrigger icon={<Lock className="size-4" />}>
            {t("adminUsers.operations.accountMenu")}
          </DropdownSubTrigger>
          <DropdownSubContent>
            {userIsSuspended(user) ? (
              <DropdownItem
                onClick={() => openAccountDialog(USER_ACCOUNT_ACTIONS.activate, user)}
                icon={<PlayCircle className="size-4" />}
              >
                <span>{t("adminUsers.operations.activateUser")}</span>
              </DropdownItem>
            ) : (
              <DropdownItem
                onClick={() => openAccountDialog(USER_ACCOUNT_ACTIONS.suspend, user)}
                icon={<PauseCircle className="size-4" />}
              >
                <span>{t("adminUsers.operations.suspendUser")}</span>
              </DropdownItem>
            )}
            {!userEmailIsVerified(user) ? (
              <DropdownItem
                onClick={() =>
                  openAccountDialog(USER_ACCOUNT_ACTIONS.verifyEmail, user)
                }
                icon={<MailCheck className="size-4" />}
              >
                <span>{t("adminUsers.operations.verifyEmail")}</span>
              </DropdownItem>
            ) : null}
          </DropdownSubContent>
        </DropdownSub>
        <DropdownSeparator />
        <DropdownItem variant="danger" onClick={() => setDeleteUserId(user.id)}>
          <span>{t("adminShared.actions.delete")}</span>
        </DropdownItem>
      </DropdownContent>
    </DropdownMenuRoot>
  );

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto bg-white p-4 md:p-5 dark:bg-dark-app-secondary">
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-error-bg dark:bg-dark-error-bg">
            <Icon
              d={IC.x}
              className="h-5 w-5 text-light-error-text dark:text-dark-error-text"
            />
          </div>
          <div className="text-center">
            <p className="font-medium text-primary dark:text-dark-primary">
              {t("apiErrors.failed_to_load_users")}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted dark:text-dark-muted">
              {error?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen gap-6 overflow-y-auto bg-white p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-primary dark:text-dark-primary">
            {t("adminUsers.header.title")}
          </h1>
          <p className="text-muted dark:text-dark-muted">
            {t("adminUsers.header.description", {
              count: totalElements,
            })}
          </p>
        </div>

      </div>

      <div className="flex-1">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row
                justify="between"
                className="items-stretch gap-3 sm:items-center"
              >
                <TableToolbar.ViewTabs
                  value={viewTab}
                  onValueChange={setViewTab}
                  tabs={[
                    {
                      id: "list",
                      label: t("adminUsers.toolbar.list"),
                      icon: (
                        <LayoutList
                          className="size-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ),
                    },
                    {
                      id: "board",
                      label: t("adminUsers.toolbar.board"),
                      icon: (
                        <LayoutGrid
                          className="size-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ),
                    },
                  ]}
                />
              </TableToolbar.Row>
              <TableToolbar.Row justify="start" className="gap-2">
                <div className="min-w-0 flex-1 sm:min-w-[12rem]">
                  <Field
                    id="users-search"
                    placeholder={t("adminUsers.filters.searchPlaceholder")}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    iconD={IC.search}
                  />
                </div>
                <div className="w-full shrink-0 sm:w-48">
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  />
                </div>
                <AdminTableToolDropdowns
                  labels={{
                    filter: t("adminUsers.toolbar.filter"),
                    sort: t("adminUsers.toolbar.sort"),
                    columns: t("adminUsers.toolbar.columns"),
                    hide: t("adminUsers.toolbar.hide"),
                  }}
                  icons={{
                    filter: <Filter className="size-3.5 shrink-0" strokeWidth={2} />,
                    sort: <ArrowUpDown className="size-3.5 shrink-0" strokeWidth={2} />,
                    columns: <Columns3 className="size-3.5 shrink-0" strokeWidth={2} />,
                    hide: <EyeOff className="size-3.5 shrink-0" strokeWidth={2} />,
                  }}
                  statusOptions={statusOptions}
                  statusFilter={statusFilter}
                  onStatusFilterChange={(next) => {
                    setStatusFilter(next);
                    setPage(1);
                  }}
                  sortOptions={sortOptions}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSortChange={(nextKey, nextDirection) => {
                    setSortKey(nextKey);
                    setSortDirection(nextDirection);
                    setPage(1);
                  }}
                  columns={columnDefs.map((column) => ({
                    id: column.id,
                    label: column.title || t("adminShared.tableHints.bulkSelection"),
                    required: column.required,
                  }))}
                  hiddenColumns={[...hiddenColumns]}
                  onToggleColumn={toggleColumn}
                  onResetColumns={() => setHiddenColumns(new Set())}
                  compactRows={compactRows}
                  onToggleCompactRows={() => setCompactRows((value) => !value)}
                />
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          {viewTab === "list" ? (
            <>
          <TableHeader headerData={headerData} />
          <TableBody>
            {pageUsers.map((user, index) => (
              <TableRow
                key={user.id}
                className={compactRows ? "[&_td]:py-2" : undefined}
              >
                {isColumnVisible("select") ? (
                <TableColumn className="w-10">
                  <Checkbox
                    checked={selectedIds.has(String(user.id))}
                    onChange={() => toggleSelected(String(user.id))}
                  />
                </TableColumn>
                ) : null}

                {isColumnVisible("id") ? (
                <TableColumn className="font-mono text-xs">
                  #{start + index + 1}
                </TableColumn>
                ) : null}

                {isColumnVisible("user") ? (
                <TableColumn>
                  <div className="flex items-center gap-3">
                    <PersonAvatar person={user} />
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                        {user.displayName}
                      </div>
                      <div className="text-xs text-muted dark:text-dark-muted">
                        {user.email || user.user_name || user.username}
                      </div>
                    </div>
                  </div>
                </TableColumn>
                ) : null}

                {isColumnVisible("role") ? (
                <TableColumn nowrap={false}>
                  <span className="inline-flex max-w-[14rem] rounded-full border border-default bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary dark:border-dark-default dark:bg-dark-app-tertiary dark:text-dark-secondary">
                    {t(`adminShared.roles.${user.roleKey}`)}
                  </span>
                </TableColumn>
                ) : null}

                {isColumnVisible("status") ? (
                <TableColumn>
                  <StatusPill variant={statusToPillVariant(user.status)}>
                    {userStatusLabel(t, user.status)}
                  </StatusPill>
                </TableColumn>
                ) : null}

                {isColumnVisible("registered") ? (
                <TableColumn className="whitespace-nowrap text-xs">
                  {formatRegisteredDate(user.registered, locale)}
                </TableColumn>
                ) : null}

                {isColumnVisible("actions") ? (
                <TableColumn className="text-center">
                  {renderUserActions(user)}
                </TableColumn>
                ) : null}
              </TableRow>
            ))}

            {sortedUsers.length === 0 && (
              <TableRow className="table-advanced-tr--empty cursor-default">
                <TableColumn
                  colSpan={headerData.length}
                  nowrap={false}
                  className="py-12 text-center text-muted dark:text-dark-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Icon
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                        className="h-5 w-5 text-muted-foreground"
                      />
                    </div>
                    <span className="font-medium">{t("adminUsers.empty")}</span>
                    <span className="text-xs opacity-75">
                      {t("adminUsers.emptyHint")}
                    </span>
                  </div>
                </TableColumn>
              </TableRow>
            )}
          </TableBody>
            </>
          ) : null}
        </Table>
        {viewTab === "board" ? (
          <div className="mt-4">
            <AdminRecordsBoard
              rows={sortedUsers}
              getKey={(user) => user.id}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              renderTitle={(user) => user.displayName || user.email || user.id}
              renderSubtitle={(user) => user.email || user.username || user.user_name || "—"}
              renderStatus={(user) => (
                <StatusPill variant={statusToPillVariant(user.status)}>
                  {userStatusLabel(t, user.status)}
                </StatusPill>
              )}
              renderMeta={(user) => (
                <>
                  <span>{t(`adminShared.roles.${user.roleKey}`)}</span>
                  <span>
                    {formatRegisteredDate(user.registered, locale)}
                  </span>
                </>
              )}
              renderActions={renderUserActions}
              emptyTitle={t("adminUsers.empty")}
              emptyDescription={t("adminUsers.emptyHint")}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageChange={(nextPage, nextSize) => {
              if (nextSize !== pageSize) {
                setPageSize(nextSize);
                setPage(1);
                return;
              }
              setPage(nextPage);
            }}
          />
        </div>
      </div>

      {deleteUserId != null ? (
        <UserDeleteModal
          user={deletingUser}
          onCancel={() => {
            if (!deleteSubmitting) setDeleteUserId(null);
          }}
          onConfirm={confirmDeleteUser}
          submitting={deleteSubmitting}
        />
      ) : null}

      {roleDialog ? (
        <UserRoleOperationModal
          actionType={roleActionType}
          user={roleDialogUser}
          draft={roleDraft}
          setDraft={setRoleDraft}
          onCancel={() => {
            if (!roleOperationSubmitting) closeRoleDialog();
          }}
          onConfirm={() => void submitRoleOperation()}
          submitting={roleOperationSubmitting}
          isPermissionAction={isPermissionAction}
          realmRoleOptions={realmRoleOptions}
          permissionRoleOptions={permissionRoleOptions}
          permissionsLoading={permissionsLoading}
        />
      ) : null}

      {accountDialog ? (
        <UserAccountOperationModal
          actionType={accountDialog.type}
          user={accountDialog.user}
          lockDurationMinutes={lockDurationMinutes}
          setLockDurationMinutes={setLockDurationMinutes}
          onCancel={() => {
            if (!accountOperationSubmitting) closeAccountDialog();
          }}
          onConfirm={() => void submitAccountOperation()}
          submitting={accountOperationSubmitting}
        />
      ) : null}
    </div>
  );
}

function getRoleOperationCopy(t, actionType) {
  switch (actionType) {
    case USER_ROLE_ACTIONS.assignRole:
      return {
        title: t("adminUsers.operations.assignRole"),
        description: t("adminUsers.operations.assignRoleDescription"),
        confirmLabel: t("adminUsers.operations.assignRole"),
      };
    case USER_ROLE_ACTIONS.removeRole:
      return {
        title: t("adminUsers.operations.removeRole"),
        description: t("adminUsers.operations.removeRoleDescription"),
        confirmLabel: t("adminUsers.operations.removeRole"),
      };
    case USER_ROLE_ACTIONS.assignPermission:
      return {
        title: t("adminUsers.operations.assignClientRole"),
        description: t("adminUsers.operations.assignClientRoleDescription"),
        confirmLabel: t("adminUsers.operations.assignClientRole"),
      };
    case USER_ROLE_ACTIONS.removePermission:
      return {
        title: t("adminUsers.operations.removeClientRole"),
        description: t("adminUsers.operations.removeClientRoleDescription"),
        confirmLabel: t("adminUsers.operations.removeClientRole"),
      };
    default:
      return {
        title: t("adminUsers.operations.assignRole"),
        description: "",
        confirmLabel: t("adminUsers.operations.assignRole"),
      };
  }
}

function UserRoleOperationModal({
  actionType,
  user,
  draft,
  setDraft,
  onCancel,
  onConfirm,
  submitting,
  isPermissionAction,
  realmRoleOptions,
  permissionRoleOptions,
  permissionsLoading,
}) {
  const { t } = useTranslation();
  const copy = getRoleOperationCopy(t, actionType);
  const displayName = user?.displayName?.trim()
    ? user.displayName
    : t("adminUsers.delete.fallbackName");
  const emailDisplay = user?.email?.trim()
    ? user.email
    : user?.user_name?.trim() ||
      user?.username?.trim() ||
      t("adminUsers.delete.noEmail");
  const selectedRoleOptions = isPermissionAction
    ? permissionRoleOptions
    : realmRoleOptions;
  const disableConfirm =
    submitting ||
    !draft.roleName.trim() ||
    (isPermissionAction && !draft.clientId.trim());

  return (
    <GlobalModal
      variant="center"
      open={true}
      setOpen={() => (!submitting ? onCancel() : null)}
      isClose
      title={copy.title}
      subtitle={copy.description}
      sheetClassName="sm:max-w-[min(34rem,92vw)]"
      footer={
        <>
          <Button
            type="button"
            variant="tertiary"
            disabled={submitting}
            onClick={onCancel}
          >
            {t("adminUsers.delete.cancel")}
          </Button>
          <Button
            type="button"
            variant={actionType?.includes("remove") ? "danger" : "primary"}
            disabled={disableConfirm}
            onClick={onConfirm}
          >
            {submitting
              ? t("studentForm.actions.submitting")
              : copy.confirmLabel}
          </Button>
        </>
      }
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-default bg-light-app-tertiary p-4 dark:border-dark-default dark:bg-dark-app-tertiary">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary">
            {displayName}
          </p>
          <p className="mt-1 text-xs text-muted dark:text-dark-muted">
            {emailDisplay}
          </p>
        </div>

        {isPermissionAction ? (
          <Field
            id="user-role-client-id"
            label={t("adminUsers.operations.clientIdLabel")}
            placeholder={PERMISSIONS_CLIENT_ID}
            value={draft.clientId}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                clientId: event.target.value,
                roleName: "",
              }))
            }
          />
        ) : null}

        <Select
          label={t(
            isPermissionAction
              ? "adminUsers.operations.clientRoleLabel"
              : "adminUsers.operations.realmRoleLabel",
          )}
          placeholder={t("settings.roles.placeholders.chooseRole")}
          value={draft.roleName}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, roleName: value }))
          }
          options={selectedRoleOptions}
        />

        {!selectedRoleOptions.length ? (
          <p className="text-xs text-muted dark:text-dark-muted">
            {isPermissionAction && permissionsLoading
              ? t("adminUsers.operations.loadingClientRoles")
              : t("adminUsers.operations.noRolesAvailable")}
          </p>
        ) : null}
        <p className="text-xs font-medium text-light-error-text dark:text-dark-error-text">
          {t("adminUsers.delete.warning")}
        </p>
      </div>
    </GlobalModal>
  );
}

function getUserAccountOperationCopy(t, actionType) {
  switch (actionType) {
    case USER_ACCOUNT_ACTIONS.suspend:
      return {
        title: t("adminUsers.operations.suspendUser"),
        description: t("adminUsers.operations.suspendUserDescription"),
        confirmLabel: t("adminUsers.operations.suspendUser"),
        confirmVariant: "danger",
      };
    case USER_ACCOUNT_ACTIONS.activate:
      return {
        title: t("adminUsers.operations.activateUser"),
        description: t("adminUsers.operations.activateUserDescription"),
        confirmLabel: t("adminUsers.operations.activateUser"),
        confirmVariant: "primary",
      };
    case USER_ACCOUNT_ACTIONS.lock:
      return {
        title: t("adminUsers.operations.lockUser"),
        description: t("adminUsers.operations.lockUserDescription"),
        confirmLabel: t("adminUsers.operations.lockUser"),
        confirmVariant: "danger",
      };
    case USER_ACCOUNT_ACTIONS.verifyEmail:
      return {
        title: t("adminUsers.operations.verifyEmail"),
        description: t("adminUsers.operations.verifyEmailDescription"),
        confirmLabel: t("adminUsers.operations.verifyEmail"),
        confirmVariant: "primary",
      };
    default:
      return {
        title: "",
        description: "",
        confirmLabel: "",
        confirmVariant: "primary",
      };
  }
}

function UserAccountOperationModal({
  actionType,
  user,
  lockDurationMinutes,
  setLockDurationMinutes,
  onCancel,
  onConfirm,
  submitting,
}) {
  const { t } = useTranslation();
  const copy = getUserAccountOperationCopy(t, actionType);
  const displayName = user?.displayName?.trim()
    ? user.displayName
    : t("adminUsers.delete.fallbackName");
  const emailDisplay = user?.email?.trim()
    ? user.email
    : user?.user_name?.trim() ||
      user?.username?.trim() ||
      t("adminUsers.delete.noEmail");
  const disableConfirm =
    submitting ||
    (actionType === USER_ACCOUNT_ACTIONS.lock &&
      !(Number.parseInt(lockDurationMinutes, 10) > 0));

  return (
    <SensitiveActionModal
      open={true}
      setOpen={() => (!submitting ? onCancel() : null)}
      title={copy.title}
      subtitle={copy.description}
      className="max-w-xl"
      summaryItems={[
        {
          label: t("adminUsers.table.user"),
          value: displayName,
        },
        {
          label: t("adminUsers.delete.emailLabel"),
          value: emailDisplay,
          mono: true,
        },
      ]}
      cancelLabel={t("adminUsers.delete.cancel")}
      confirmLabel={
        submitting ? t("studentForm.actions.submitting") : copy.confirmLabel
      }
      confirmVariant={copy.confirmVariant}
      onConfirm={onConfirm}
      submitting={submitting}
      confirmDisabled={disableConfirm}
      warning={
        actionType === USER_ACCOUNT_ACTIONS.suspend ||
        actionType === USER_ACCOUNT_ACTIONS.lock
          ? t("adminUsers.delete.warning")
          : undefined
      }
    >
      {actionType === USER_ACCOUNT_ACTIONS.lock ? (
        <Field
          id="user-lock-duration"
          type="number"
          min="1"
          label={t("adminUsers.operations.lockDurationLabel")}
          placeholder="30"
          value={lockDurationMinutes}
          onChange={(event) => setLockDurationMinutes(event.target.value)}
        />
      ) : null}
    </SensitiveActionModal>
  );
}

function UserDeleteModal({ user, onCancel, onConfirm, submitting }) {
  const { t } = useTranslation();
  const displayName = user?.displayName?.trim()
    ? user.displayName
    : t("adminUsers.delete.fallbackName");
  const emailDisplay = user?.email?.trim()
    ? user.email
    : t("adminUsers.delete.noEmail");

  return (
    <SensitiveActionModal
      open={true}
      setOpen={() => (!submitting ? onCancel() : null)}
      title={t("adminUsers.delete.title")}
      subtitle={`${t("adminUsers.delete.descriptionPrefix")} ${displayName}${t("adminUsers.delete.descriptionSuffix")}`}
      summaryItems={[
        {
          label: t("adminUsers.delete.emailLabel"),
          value: emailDisplay,
          mono: true,
        },
      ]}
      warning={t("adminUsers.delete.warning")}
      cancelLabel={t("adminUsers.delete.cancel")}
      confirmLabel={
        submitting
          ? t("studentForm.actions.submitting")
          : t("adminUsers.delete.confirm")
      }
      onConfirm={onConfirm}
      submitting={submitting}
    />
  );
}
