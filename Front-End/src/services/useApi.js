import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { gooeyToast } from "goey-toast";
import * as Api from "./apiRoute";
import {
  fetchMergeConflicts,
  fetchRepositoryCompare,
  fetchRepositoryCommits,
  mergePullRequest,
  resolveMergeConflict,
} from "./versionControlService";

function httpStatusKey(status) {
  if (status == null || Number.isNaN(status)) return null;
  return `apiErrors.http.${status}`;
}

/**
 * User-facing error title: respects `error.i18nKey`, optional query/mutation keys, HTTP status, network, generic.
 *
 * Prefer passing **i18n keys** for `toastError` / query fallbacks (`apiErrors.*`); literals still work when no catalog key exists.
 */
export function resolveLocalizedApiErrorTitle(error, t, i18n, opts = {}) {
  const { mutationToastErrorKey, queryFallbackKey } = opts;

  if (mutationToastErrorKey && i18n.exists(mutationToastErrorKey)) {
    return t(mutationToastErrorKey);
  }
  if (error?.i18nKey && i18n.exists(error.i18nKey)) {
    return t(error.i18nKey);
  }
  if (queryFallbackKey && i18n.exists(queryFallbackKey)) {
    return t(queryFallbackKey);
  }

  const data = error?.response?.data;
  const bizCode =
    typeof data?.code === "string"
      ? data.code
      : typeof data?.error === "string"
        ? data.error
        : null;
  if (bizCode) {
    const codeKey = `apiErrors.codes.${bizCode}`;
    if (i18n.exists(codeKey)) return t(codeKey);
  }

  const st = error?.status ?? error?.response?.status;
  const hk = httpStatusKey(st);
  if (hk && i18n.exists(hk)) return t(hk);

  if (error?.code === "ERR_NETWORK") return t("apiErrors.network");
  if (error?.code === "ECONNABORTED") return t("apiErrors.timeout");

  return t("apiErrors.generic");
}

/** Extra body line from typical Axios/API error payloads when it adds detail beyond the title. */
export function pickErrorDescription(error, localizedTitle) {
  const data = error?.response?.data;
  let detail;
  if (typeof data === "string") {
    detail = data;
  } else if (data && typeof data === "object") {
    detail =
      (typeof data.detail === "string" && data.detail) ||
      (typeof data.message === "string" && data.message !== localizedTitle
        ? data.message
        : null) ||
      (Array.isArray(data.errors) && typeof data.errors[0] === "string"
        ? data.errors[0]
        : null);
  }
  const trimmed = typeof detail === "string" ? detail.trim() : "";
  if (!trimmed || trimmed === localizedTitle) return undefined;
  return trimmed;
}

/**
 * Attach error toast once per failed fetch cycle (TanStack Query v5 has no useQuery.onError).
 * `fallbackTitleKey` must be an i18n key (e.g. `apiErrors.failed_to_load_students`).
 */
function useQueryErrorToast(queryResult, notifyOnError, fallbackTitleKey) {
  const { t, i18n } = useTranslation();
  const toastKeyRef = useRef(null);

  useEffect(() => {
    if (!notifyOnError) return;

    if (queryResult.isSuccess) {
      toastKeyRef.current = null;
      return;
    }

    if (!queryResult.isError || !queryResult.error) return;

    const title = resolveLocalizedApiErrorTitle(queryResult.error, t, i18n, {
      queryFallbackKey: fallbackTitleKey,
    });

    const dedupe = `${fallbackTitleKey ?? ""}:${queryResult.error?.status ?? queryResult.error?.response?.status ?? ""}:${queryResult.error?.message ?? ""}`;

    if (toastKeyRef.current !== dedupe) {
      const description = pickErrorDescription(queryResult.error, title);
      gooeyToast.error(title, description ? { description } : undefined);
      toastKeyRef.current = dedupe;
    }
  }, [
    notifyOnError,
    queryResult.isSuccess,
    queryResult.isError,
    queryResult.error,
    fallbackTitleKey,
    t,
    i18n,
  ]);
}

/**
 * Mutation with default `gooeyToast` success/error handling.
 * Pass `showSuccessToast: false` / `showErrorToast: false`, or `toastSuccess: false` to skip messages.
 *
 * `toastSuccess` / `toastError`: pass i18n keys when listed in resources; otherwise the string is shown as-is.
 *
 * Caller `onSuccess` / `onError` run **after** toasts (for navigation, cache, etc.).
 */
export function useApiMutation(config) {
  const { t, i18n } = useTranslation();
  const {
    mutationFn,
    mutationKey,
    toastSuccess,
    toastError,
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = config;

  return useMutation({
    mutationFn,
    mutationKey,
    ...rest,
    onSuccess: (data, variables, context) => {
      if (showSuccessToast && toastSuccess !== false) {
        let msg;
        if (typeof toastSuccess === "string") {
          msg = i18n.exists(toastSuccess) ? t(toastSuccess) : toastSuccess;
        } else {
          msg = t("apiSuccess.completed");
        }
        gooeyToast.success(msg);
      }
      userOnSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (showErrorToast) {
        const mutationToastErrorKey =
          typeof toastError === "string" && i18n.exists(toastError)
            ? toastError
            : undefined;
        const title = resolveLocalizedApiErrorTitle(error, t, i18n, {
          mutationToastErrorKey,
        });
        const description = pickErrorDescription(error, title);
        gooeyToast.error(
          title,
          description ? { description } : undefined,
        );
      }
      userOnError?.(error, variables, context);
    },
  });
}

/* ─── Auth ────────────────────────────────────────────────────────────────── */

export function useLogin(options) {
  return useApiMutation({
    mutationFn: Api.login,
    mutationKey: ["auth", "login"],
    ...options,
  });
}

export function useSignup(options) {
  return useApiMutation({
    mutationFn: Api.signup,
    mutationKey: ["auth", "signup"],
    toastSuccess: "Verification code sent to your email",
    ...options,
  });
}

export function useGoogleAuth(options) {
  return useApiMutation({
    mutationFn: Api.googleAuth,
    mutationKey: ["auth", "google"],
    toastSuccess: "Signed in successfully",
    ...options,
  });
}

export function useRefreshToken(options) {
  return useApiMutation({
    mutationFn: Api.refreshAuthToken,
    mutationKey: ["auth", "refresh"],
    toastSuccess: false,
    showSuccessToast: false,
    ...options,
  });
}

export function useLogout(options) {
  return useApiMutation({
    mutationFn: Api.logout,
    mutationKey: ["auth", "logout"],
    toastSuccess: "Signed out",
    showErrorToast: false,
    ...options,
  });
}

export function useForgotPassword(options) {
  return useApiMutation({
    mutationFn: Api.forgotPassword,
    mutationKey: ["auth", "forgotPassword"],
    toastSuccess: "Check your email for reset instructions.",
    ...options,
  });
}

export function useResetPassword(options) {
  return useApiMutation({
    mutationFn: Api.resetPassword,
    mutationKey: ["auth", "resetPassword"],
    toastSuccess: "Password reset successfully",
    ...options,
  });
}

export function useVerifyEmail(options) {
  return useApiMutation({
    mutationFn: Api.verifyEmail,
    mutationKey: ["auth", "verifyEmail"],
    toastSuccess: "Email verified successfully",
    ...options,
  });
}

export function useResendVerificationEmail(options) {
  return useApiMutation({
    mutationFn: Api.resendVerificationEmail,
    mutationKey: ["auth", "resendVerification"],
    toastSuccess: "Verification email sent.",
    ...options,
  });
}

export function useChangePassword(options) {
  return useApiMutation({
    mutationFn: ({ userId, ...payload }) =>
      Api.changePassword(userId, payload),
    mutationKey: ["auth", "changePassword"],
    toastSuccess: "Password updated successfully",
    ...options,
  });
}

export function useSessionProfile(options = {}) {
  const {
    notifyOnError = false,
    errorFallback = "apiErrors.failed_to_load_session",
    ...queryOptions
  } = options;

  const q = useQuery({
    queryKey: ["auth", "me"],
    queryFn: Api.fetchSessionProfile,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    ...queryOptions,
  });

  useQueryErrorToast(q, notifyOnError, errorFallback);

  return q;
}

/* ─── Students / departments (legacy) ─────────────────────────────────────── */

export function useStudents(queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["students"],
    queryFn: Api.getStudents,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_students");
  return q;
}

export function useStudentSearch(keyword, queryOptions = {}) {
  const trimmedKeyword = String(keyword ?? "").trim();
  const {
    enabled = trimmedKeyword.length > 0,
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["students", "search", trimmedKeyword],
    queryFn: () => Api.searchStudents(trimmedKeyword),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_students");
  return q;
}

/**
 * Spring Pageable list: `page` is **0-based** (API); pass `search` / `status` for server-side filters when supported.
 */
export function useStudentsPage(params = {}, queryOptions = {}) {
  const {
    page = 0,
    pageSize = 10,
    sort,
    search,
    status,
    notifyOnError = true,
  } = params;
  const sortKey = Array.isArray(sort) ? sort.join("|") : (sort ?? "");
  const statusKey = status ?? "all";
  const searchKey = search ?? "";

  const q = useQuery({
    queryKey: [
      "students",
      "page",
      page,
      pageSize,
      sortKey,
      searchKey,
      statusKey,
    ],
    queryFn: () =>
      Api.getStudentsPage({
        page,
        size: pageSize,
        sort,
        search:
          typeof search === "string" && search.trim() ? search.trim() : undefined,
        status: statusKey,
      }),
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_students");
  return q;
}

export function useStudent(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["students", id],
    queryFn: () => Api.getStudentById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_student");
  return q;
}

export function useCreateStudent(options) {
  return useApiMutation({
    mutationFn: Api.createStudent,
    mutationKey: ["students", "create"],
    toastSuccess: "Student created successfully",
    ...options,
  });
}

export function useUpdateStudent(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateStudent(id, body),
    mutationKey: ["students", "update"],
    toastSuccess: "Student updated successfully",
    ...options,
  });
}

export function useDeleteStudent(options) {
  return useApiMutation({
    mutationFn: Api.deleteStudent,
    mutationKey: ["students", "delete"],
    toastSuccess: "Student removed successfully",
    ...options,
  });
}

export function useTeachers(queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["teachers"],
    queryFn: Api.getTeachers,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_teachers");
  return q;
}

export function useTeacherSearch(keyword, queryOptions = {}) {
  const trimmedKeyword = String(keyword ?? "").trim();
  const {
    enabled = trimmedKeyword.length > 0,
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["teachers", "search", trimmedKeyword],
    queryFn: () => Api.searchTeachers(trimmedKeyword),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_teachers");
  return q;
}

export function useTeachersPage(params = {}, queryOptions = {}) {
  const {
    page = 0,
    pageSize = 10,
    sort,
    search,
    status,
    notifyOnError = true,
  } = params;
  const sortKey = Array.isArray(sort) ? sort.join("|") : (sort ?? "");
  const statusKey = status ?? "all";
  const searchKey = search ?? "";

  const q = useQuery({
    queryKey: [
      "teachers",
      "page",
      page,
      pageSize,
      sortKey,
      searchKey,
      statusKey,
    ],
    queryFn: () =>
      Api.getTeachersPage({
        page,
        size: pageSize,
        sort,
        search:
          typeof search === "string" && search.trim() ? search.trim() : undefined,
        status: statusKey,
      }),
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_teachers");
  return q;
}

export function useTeacher(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["teachers", id],
    queryFn: () => Api.getTeacherById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_teacher");
  return q;
}

export function useCreateTeacher(options) {
  return useApiMutation({
    mutationFn: Api.createTeacher,
    mutationKey: ["teachers", "create"],
    toastSuccess: "Teacher created successfully",
    ...options,
  });
}

export function useUpdateTeacher(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateTeacher(id, body),
    mutationKey: ["teachers", "update"],
    toastSuccess: "Teacher updated successfully",
    ...options,
  });
}

export function useDeleteTeacher(options) {
  return useApiMutation({
    mutationFn: Api.deleteTeacherRecord,
    mutationKey: ["teachers", "delete"],
    toastSuccess: "Teacher removed successfully",
    ...options,
  });
}

export function useEmployees(queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["employees"],
    queryFn: Api.getEmployees,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_employees");
  return q;
}

export function useEmployeeSearch(keyword, queryOptions = {}) {
  const trimmedKeyword = String(keyword ?? "").trim();
  const {
    enabled = trimmedKeyword.length > 0,
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["employees", "search", trimmedKeyword],
    queryFn: () => Api.searchEmployees(trimmedKeyword),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_employees");
  return q;
}

export function useEmployeesPage(params = {}, queryOptions = {}) {
  const {
    page = 0,
    pageSize = 10,
    sort,
    search,
    status,
    notifyOnError = true,
  } = params;
  const sortKey = Array.isArray(sort) ? sort.join("|") : (sort ?? "");
  const statusKey = status ?? "all";
  const searchKey = search ?? "";

  const q = useQuery({
    queryKey: [
      "employees",
      "page",
      page,
      pageSize,
      sortKey,
      searchKey,
      statusKey,
    ],
    queryFn: () =>
      Api.getEmployeesPage({
        page,
        size: pageSize,
        sort,
        search:
          typeof search === "string" && search.trim() ? search.trim() : undefined,
        status: statusKey,
      }),
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_employees");
  return q;
}

export function useEmployee(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["employees", id],
    queryFn: () => Api.getEmployeeById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_employee");
  return q;
}

export function useCreateEmployee(options) {
  return useApiMutation({
    mutationFn: Api.createEmployee,
    mutationKey: ["employees", "create"],
    toastSuccess: "Employee created successfully",
    ...options,
  });
}

export function useUpdateEmployee(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateEmployee(id, body),
    mutationKey: ["employees", "update"],
    toastSuccess: "Employee updated successfully",
    ...options,
  });
}

export function useDeleteEmployee(options) {
  return useApiMutation({
    mutationFn: Api.deleteEmployeeRecord,
    mutationKey: ["employees", "delete"],
    toastSuccess: "Employee removed successfully",
    ...options,
  });
}

export function useDepartments(queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["departments"],
    queryFn: Api.getDepartments,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_departments");
  return q;
}

export function useFaculties(queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculties"],
    queryFn: Api.getFaculties,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculties");
  return q;
}

export function useUniversities(queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["universities"],
    queryFn: Api.getUniversities,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_universities");
  return q;
}

export function useFaculty(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculties", "detail", id],
    queryFn: () => Api.getFacultyById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculties");
  return q;
}

export function useCreateFaculty(options) {
  return useApiMutation({
    mutationFn: Api.createFaculty,
    mutationKey: ["faculties", "create"],
    toastSuccess: "Faculty created",
    ...options,
  });
}

export function useUpdateFaculty(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateFaculty(id, body),
    mutationKey: ["faculties", "update"],
    toastSuccess: "Faculty updated",
    ...options,
  });
}

export function useDeleteFaculty(options) {
  return useApiMutation({
    mutationFn: Api.deleteFaculty,
    mutationKey: ["faculties", "delete"],
    toastSuccess: "Faculty removed",
    ...options,
  });
}

export function useBatches(queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["batches"],
    queryFn: Api.getBatches,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_batches");
  return q;
}

export function useBatch(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["batches", "detail", id],
    queryFn: () => Api.getBatchById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_batches");
  return q;
}

export function useDepartment(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["departments", id],
    queryFn: () => Api.getDepartmentById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_department");
  return q;
}

export function useCreateDepartment(options) {
  return useApiMutation({
    mutationFn: Api.createDepartment,
    mutationKey: ["departments", "create"],
    toastSuccess: "Department created successfully",
    ...options,
  });
}

export function useUpdateDepartment(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateDepartment(id, body),
    mutationKey: ["departments", "update"],
    toastSuccess: "Department updated successfully",
    ...options,
  });
}

export function useDeleteDepartment(options) {
  return useApiMutation({
    mutationFn: Api.deleteDepartment,
    mutationKey: ["departments", "delete"],
    toastSuccess: "Department removed successfully",
    ...options,
  });
}

/* ─── Faculty registry: academic year, semester, batch, project, group ─────── */

export function useAcademicYears(params = {}, queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["academic-years", params],
    queryFn: () => Api.getAcademicYears(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_academic_years");
  return q;
}

export function useAcademicYear(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["academic-years", "detail", id],
    queryFn: () => Api.getAcademicYearById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_academic_year");
  return q;
}

export function useCreateAcademicYear(options) {
  return useApiMutation({
    mutationFn: Api.createAcademicYear,
    mutationKey: ["academic-years", "create"],
    toastSuccess: "Academic year created",
    ...options,
  });
}

export function useUpdateAcademicYear(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateAcademicYear(id, body),
    mutationKey: ["academic-years", "update"],
    toastSuccess: "Academic year updated",
    ...options,
  });
}

export function useDeleteAcademicYear(options) {
  return useApiMutation({
    mutationFn: Api.deleteAcademicYear,
    mutationKey: ["academic-years", "delete"],
    toastSuccess: "Academic year removed",
    ...options,
  });
}

export function useSemesters(params = {}, queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["semesters", params],
    queryFn: () => Api.getSemesters(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_semesters");
  return q;
}

/** Semesters for a single academic year (faculty `/api/semester/academic-year/{id}`). */
export function useSemestersByAcademicYear(academicYearId, queryOptions = {}) {
  const idRaw = academicYearId != null ? String(academicYearId).trim() : "";
  const { enabled = true, notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["semesters", "by-academic-year", idRaw],
    queryFn: () => Api.getSemestersByAcademicYearId(idRaw),
    enabled: Boolean(idRaw && enabled),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_semesters");
  return q;
}

/** Repository catalogue search (`REPOSITORY.SEARCH` → `/api/v1/repos/search?keyword=`). Queries when `keyword` is non-empty. */
export function useRepositorySearch(keyword, queryOptions = {}) {
  const trimmed = String(keyword ?? "").trim();
  const { enabled = true, notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["repositories", "search", trimmed],
    queryFn: () => Api.searchRepositories(trimmed),
    enabled: Boolean(enabled && trimmed.length >= 1),
    staleTime: 30_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_search_repositories",
  );
  return q;
}

export function useSemester(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["semesters", "detail", id],
    queryFn: () => Api.getSemesterById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_semester");
  return q;
}

export function useCreateSemester(options) {
  return useApiMutation({
    mutationFn: Api.createSemester,
    mutationKey: ["semesters", "create"],
    toastSuccess: "Semester created",
    ...options,
  });
}

export function useUpdateSemester(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateSemester(id, body),
    mutationKey: ["semesters", "update"],
    toastSuccess: "Semester updated",
    ...options,
  });
}

export function useDeleteSemester(options) {
  return useApiMutation({
    mutationFn: Api.deleteSemester,
    mutationKey: ["semesters", "delete"],
    toastSuccess: "Semester removed",
    ...options,
  });
}

export function useCreateBatch(options) {
  return useApiMutation({
    mutationFn: Api.createBatch,
    mutationKey: ["batches", "create"],
    toastSuccess: "Batch created",
    ...options,
  });
}

export function useUpdateBatch(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateBatch(id, body),
    mutationKey: ["batches", "update"],
    toastSuccess: "Batch updated",
    ...options,
  });
}

export function useDeleteBatch(options) {
  return useApiMutation({
    mutationFn: Api.deleteBatch,
    mutationKey: ["batches", "delete"],
    toastSuccess: "Batch removed",
    ...options,
  });
}

export function useFacultyProjects(params = {}, queryOptions = {}) {
  const { notifyOnError = false, requestConfig, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", params],
    queryFn: () => Api.getFacultyProjects(params, requestConfig),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_projects");
  return q;
}

export function usePublishedFacultyProjects(params = {}, queryOptions = {}) {
  const { notifyOnError = false, requestConfig, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "published", params],
    queryFn: () => Api.getPublishedFacultyProjects(params, requestConfig),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_projects");
  return q;
}

export function useFacultyProject(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "detail", id],
    queryFn: () => Api.getFacultyProjectById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_project");
  return q;
}

export function usePublishedFacultyProject(id, queryOptions = {}) {
  const {
    enabled = Boolean(id),
    notifyOnError = false,
    requestConfig,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "published", "detail", id],
    queryFn: () => Api.getPublishedFacultyProjectById(id, requestConfig),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_project");
  return q;
}

export function useFacultyProjectByStudent(projectId, studentId, queryOptions = {}) {
  const {
    enabled = Boolean(projectId && studentId),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "detail", projectId, "student", studentId],
    queryFn: () => Api.getFacultyProjectByStudentId(projectId, studentId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_project");
  return q;
}

export function useFacultyProjectByTeacher(projectId, teacherId, queryOptions = {}) {
  const {
    enabled = Boolean(projectId && teacherId),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "detail", projectId, "teacher", teacherId],
    queryFn: () => Api.getFacultyProjectByTeacherId(projectId, teacherId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_project");
  return q;
}

export function useFacultyProjectsByStudent(studentId, queryOptions = {}) {
  const { enabled = Boolean(studentId), notifyOnError = false, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "student", studentId],
    queryFn: () => Api.getFacultyProjectsByStudentId(studentId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_projects");
  return q;
}

export function useFacultyProjectsByTeacher(teacherId, queryOptions = {}) {
  const { enabled = Boolean(teacherId), notifyOnError = false, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "teacher", teacherId],
    queryFn: () => Api.getFacultyProjectsByTeacherId(teacherId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_projects");
  return q;
}

export function useFacultyProjectByTeacherAndStudent(
  teacherId,
  studentId,
  queryOptions = {},
) {
  const {
    enabled = Boolean(teacherId && studentId),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-projects", "teacher", teacherId, "student", studentId],
    queryFn: () => Api.findFacultyProjectByTeacherAndStudent(teacherId, studentId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_project");
  return q;
}

export function useCreateFacultyProject(options) {
  return useApiMutation({
    mutationFn: Api.createFacultyProject,
    mutationKey: ["faculty-projects", "create"],
    toastSuccess: "Project created",
    ...options,
  });
}

export function useUpdateFacultyProject(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateFacultyProject(id, body),
    mutationKey: ["faculty-projects", "update"],
    toastSuccess: "Project updated",
    ...options,
  });
}

export function useUpdateFacultyProjectPublicResult(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) =>
      Api.updateFacultyProjectPublicResult(id, body),
    mutationKey: ["faculty-projects", "public-result"],
    toastSuccess: "Project public result saved",
    ...options,
  });
}

export function useCompleteFacultyProject(options) {
  return useApiMutation({
    mutationFn: ({ id }) => Api.completeFacultyProject(id),
    mutationKey: ["faculty-projects", "complete"],
    toastSuccess: "Project marked as completed",
    ...options,
  });
}

export function usePublishFacultyProject(options) {
  return useApiMutation({
    mutationFn: ({ id }) => Api.publishFacultyProject(id),
    mutationKey: ["faculty-projects", "publish"],
    toastSuccess: "Project published",
    ...options,
  });
}

export function useUnpublishFacultyProject(options) {
  return useApiMutation({
    mutationFn: ({ id }) => Api.unpublishFacultyProject(id),
    mutationKey: ["faculty-projects", "unpublish"],
    toastSuccess: "Project unpublished",
    ...options,
  });
}

export function useInviteFacultyProjectMembers(options) {
  return useApiMutation({
    mutationFn: ({ id, invitations }) =>
      Api.inviteFacultyProjectMembers(id, { invitations }),
    mutationKey: ["faculty-projects", "invite-members"],
    toastSuccess: "Project updated",
    ...options,
  });
}

export function useDeleteFacultyProject(options) {
  return useApiMutation({
    mutationFn: Api.deleteFacultyProject,
    mutationKey: ["faculty-projects", "delete"],
    toastSuccess: "Project removed",
    ...options,
  });
}

export function useFacultyGroups(params = {}, queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-groups", params],
    queryFn: () => Api.getFacultyGroups(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_groups");
  return q;
}

export function useFacultyGroup(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["faculty-groups", "detail", id],
    queryFn: () => Api.getFacultyGroupById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_faculty_group");
  return q;
}

export function useCreateFacultyGroup(options) {
  return useApiMutation({
    mutationFn: Api.createFacultyGroup,
    mutationKey: ["faculty-groups", "create"],
    toastSuccess: "Group created",
    ...options,
  });
}

export function useUpdateFacultyGroup(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateFacultyGroup(id, body),
    mutationKey: ["faculty-groups", "update"],
    toastSuccess: "Group updated",
    ...options,
  });
}

export function useUpdateFacultyGroupLeader(options) {
  return useApiMutation({
    mutationFn: ({ id, leaderId }) => Api.updateFacultyGroupLeader(id, leaderId),
    mutationKey: ["faculty-groups", "update-leader"],
    toastSuccess: "Group leader updated",
    ...options,
  });
}

export function useRemoveFacultyGroupMember(options) {
  return useApiMutation({
    mutationFn: ({ id, studentId }) => Api.removeFacultyGroupMember(id, studentId),
    mutationKey: ["faculty-groups", "remove-member"],
    toastSuccess: "Group member removed",
    ...options,
  });
}

export function useDeleteFacultyGroup(options) {
  return useApiMutation({
    mutationFn: Api.deleteFacultyGroup,
    mutationKey: ["faculty-groups", "delete"],
    toastSuccess: "Group removed",
    ...options,
  });
}

/* ─── Users ─────────────────────────────────────────────────────────────────── */

export function useUsersList(params = {}, queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => Api.listUsers(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_users");
  return q;
}

export function useUser(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => Api.getUserById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_user");
  return q;
}

export function useSearchUsers(search, queryOptions = {}) {
  const { notifyOnError = true, enabled = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["users", "search", search],
    queryFn: () => Api.searchUsers(search),
    enabled: enabled && Boolean(search),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_search_users");
  return q;
}

export function useCreateUser(options) {
  return useApiMutation({
    mutationFn: Api.createUser,
    mutationKey: ["users", "create"],
    toastSuccess: "User created successfully",
    ...options,
  });
}

export function useUpdateUser(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.updateUser(id, body),
    mutationKey: ["users", "update"],
    toastSuccess: "User updated successfully",
    ...options,
  });
}

export function useDeleteUser(options) {
  return useApiMutation({
    mutationFn: Api.deleteUser,
    mutationKey: ["users", "delete"],
    toastSuccess: "User deleted successfully",
    ...options,
  });
}

export function useUserByUsername(username, queryOptions = {}) {
  const { notifyOnError = true, enabled = Boolean(username), ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["users", "username", username],
    queryFn: () => Api.getUserByUsername(username),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_user");
  return q;
}

export function useUserByEmail(email, queryOptions = {}) {
  const { notifyOnError = true, enabled = Boolean(email), ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["users", "email", email],
    queryFn: () => Api.getUserByEmail(email),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_user");
  return q;
}

export function useUserAuthorProfile(id, queryOptions = {}) {
  const { notifyOnError = true, enabled = Boolean(id), ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["users", "author-profile", id],
    queryFn: () => Api.getUserAuthorProfile(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_author_profile");
  return q;
}

export function useSuspendUser(options) {
  return useApiMutation({
    mutationFn: Api.suspendUser,
    mutationKey: ["users", "suspend"],
    toastSuccess: "User suspended",
    ...options,
  });
}

export function useActivateUser(options) {
  return useApiMutation({
    mutationFn: Api.activateUser,
    mutationKey: ["users", "activate"],
    toastSuccess: "User activated",
    ...options,
  });
}

export function useLockUser(options) {
  return useApiMutation({
    mutationFn: ({ id, durationMinutes }) =>
      Api.lockUser(id, durationMinutes),
    mutationKey: ["users", "lock"],
    toastSuccess: "Account lock applied.",
    ...options,
  });
}

export function useVerifyUserEmailByAdmin(options) {
  return useApiMutation({
    mutationFn: Api.verifyUserEmailByAdmin,
    mutationKey: ["users", "verify-email"],
    toastSuccess: "Email verified",
    ...options,
  });
}

/** POST `/api/v1/users/stats/count` — prefer calling `mutate` from dashboards. */
export function useUsersStatsCountMutation(options = {}) {
  return useApiMutation({
    mutationFn: (body = {}) => Api.postUsersStatsCount(body),
    mutationKey: ["users", "stats"],
    toastSuccess: false,
    showSuccessToast: false,
    ...options,
  });
}

/* ─── Roles ─────────────────────────────────────────────────────────────────── */

export function useRoles(queryOptions = {}) {
  const { notifyOnError = false, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["roles"],
    queryFn: Api.listRoles,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_roles");
  return q;
}

export function useCreateRole(options) {
  return useApiMutation({
    mutationFn: Api.createRole,
    mutationKey: ["roles", "create"],
    toastSuccess: "Role created",
    ...options,
  });
}

export function useUpdateRole(options) {
  return useApiMutation({
    mutationFn: ({ roleName, ...body }) => Api.updateRole(roleName, body),
    mutationKey: ["roles", "update"],
    toastSuccess: "Role updated",
    ...options,
  });
}

export function useDeleteRole(options) {
  return useApiMutation({
    mutationFn: Api.deleteRole,
    mutationKey: ["roles", "delete"],
    toastSuccess: "Role deleted",
    ...options,
  });
}

export function useRolesStatsCount(queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["roles", "stats"],
    queryFn: Api.getRolesStatsCount,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_role_statistics");
  return q;
}

export function useAssignRoleToUser(options) {
  return useApiMutation({
    mutationFn: ({ roleName, userId }) =>
      Api.assignRoleToUser(roleName, userId),
    mutationKey: ["roles", "assign"],
    toastSuccess: "Role assigned",
    ...options,
  });
}

export function useRemoveRoleFromUser(options) {
  return useApiMutation({
    mutationFn: ({ roleName, userId }) =>
      Api.removeRoleFromUser(roleName, userId),
    mutationKey: ["roles", "remove"],
    toastSuccess: "Role removed",
    ...options,
  });
}

/* ─── Permissions ───────────────────────────────────────────────────────────── */

export function useCreatePermission(options) {
  return useApiMutation({
    mutationFn: Api.createPermission,
    mutationKey: ["permissions", "create"],
    toastSuccess: "Permission created",
    ...options,
  });
}

export function usePermissionsByClient(clientId, queryOptions = {}) {
  const { enabled = Boolean(clientId), notifyOnError = false, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["permissions", "client", clientId],
    queryFn: () => Api.getPermissionsByClient(clientId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_permissions");
  return q;
}

export function useAssignPermissionRole(options) {
  return useApiMutation({
    mutationFn: ({ clientId, roleName, userId }) =>
      Api.assignPermissionRoleToUser(clientId, roleName, userId),
    mutationKey: ["permissions", "assign"],
    toastSuccess: "Permission assigned",
    ...options,
  });
}

export function useRemovePermissionRole(options) {
  return useApiMutation({
    mutationFn: ({ clientId, roleName, userId }) =>
      Api.removePermissionRoleFromUser(clientId, roleName, userId),
    mutationKey: ["permissions", "remove"],
    toastSuccess: "Permission removed",
    ...options,
  });
}

export function useDeleteClientRoleBundle(options) {
  return useApiMutation({
    mutationFn: ({ clientId, roleName }) =>
      Api.deleteClientRoleBundle(clientId, roleName),
    mutationKey: ["permissions", "deleteRole"],
    toastSuccess: "Client role removed",
    ...options,
  });
}

export function usePermissionClientStats(clientId, queryOptions = {}) {
  const { enabled = Boolean(clientId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["permissions", "stats", clientId],
    queryFn: () => Api.getPermissionClientStats(clientId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_permission_stats");
  return q;
}

/* ─── Blog / articles ───────────────────────────────────────────────────────── */

export function useArticles(params = {}, queryOptions = {}) {
  const { notifyOnError = true, requestConfig, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["articles", "list", params],
    queryFn: () => Api.getArticles(params, requestConfig),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_articles");
  return q;
}

export function usePublicArticles(params = {}, queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["articles", "public-list", params],
    queryFn: () => Api.getPublicArticles(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_articles");
  return q;
}

export function useArticle(articleId, queryOptions = {}) {
  const { enabled = Boolean(articleId), notifyOnError = true, requestConfig, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["articles", "detail", articleId],
    queryFn: () => Api.getArticleById(articleId, requestConfig),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_article");
  return q;
}

export function usePublicArticle(articleId, queryOptions = {}) {
  const { enabled = Boolean(articleId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["articles", "public-detail", articleId],
    queryFn: () => Api.getPublicArticleById(articleId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_article");
  return q;
}

export function useArticlesByAuthor(authorId, params = {}, queryOptions = {}) {
  const { enabled = Boolean(authorId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["articles", "author", authorId, params],
    queryFn: () => Api.getArticlesByAuthor(authorId, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_articles");
  return q;
}

export function usePublishedArticlesByAuthor(
  authorId,
  params = {},
  queryOptions = {},
) {
  const { enabled = Boolean(authorId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["articles", "author", authorId, "published", params],
    queryFn: () => Api.getPublishedArticlesByAuthor(authorId, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_published_articles");
  return q;
}

export function useAuthorArticleDetail(
  authorId,
  articleId,
  queryOptions = {},
) {
  const {
    enabled = Boolean(authorId && articleId),
    notifyOnError = true,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["articles", "author", authorId, "detail", articleId],
    queryFn: () => Api.getAuthorArticleDetail(authorId, articleId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_article");
  return q;
}

export function useArticleComments(articleId, params = {}, queryOptions = {}) {
  const { enabled = Boolean(articleId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["articles", articleId, "comments", params],
    queryFn: () => Api.getArticleComments(articleId, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_comments");
  return q;
}

export function useCreateArticle(options) {
  return useApiMutation({
    mutationFn: ({ userId, ...body }) =>
      Api.createArticleForUser(userId, body),
    mutationKey: ["articles", "create"],
    toastSuccess: "Article created",
    ...options,
  });
}

export function useCreateDraftArticle(options) {
  return useApiMutation({
    mutationFn: ({ userId, ...body }) => Api.createDraftForUser(userId, body),
    mutationKey: ["articles", "draft"],
    toastSuccess: "Draft saved",
    ...options,
  });
}

export function useCreateArticleWithFiles(options) {
  return useApiMutation({
    mutationFn: ({ authorUserId, formData }) =>
      Api.createArticleWithMultipart(authorUserId, formData),
    mutationKey: ["articles", "createMultipart"],
    toastSuccess: "Article created",
    ...options,
  });
}

export function useUpdateArticle(options) {
  return useApiMutation({
    mutationFn: ({ articleId, authorId, ...body }) =>
      Api.updateArticleJson(articleId, authorId, body),
    mutationKey: ["articles", "update"],
    toastSuccess: "Article updated",
    ...options,
  });
}

export function useUpdateArticleWithFile(options) {
  return useApiMutation({
    mutationFn: ({ articleId, authorId, formData }) =>
      Api.updateArticleWithFile(articleId, authorId, formData),
    mutationKey: ["articles", "updateMultipart"],
    toastSuccess: "Article updated",
    ...options,
  });
}

export function usePublishArticle(options) {
  return useApiMutation({
    mutationFn: ({ articleId, authorId, ...body }) =>
      Api.publishArticle(articleId, authorId, body),
    mutationKey: ["articles", "publish"],
    toastSuccess: "Article published",
    ...options,
  });
}

export function useDeleteArticle(options) {
  return useApiMutation({
    mutationFn: ({ articleId, authorId }) =>
      Api.deleteArticle(articleId, authorId),
    mutationKey: ["articles", "delete"],
    toastSuccess: "Article deleted",
    ...options,
  });
}

export function usePostArticleComment(options) {
  return useApiMutation({
    mutationFn: ({ articleId, ...body }) =>
      Api.postArticleComment(articleId, body),
    mutationKey: ["articles", "comment"],
    toastSuccess: "Comment posted",
    ...options,
  });
}

export function usePostArticleCommentReply(options) {
  return useApiMutation({
    mutationFn: ({ articleId, parentCommentId, ...body }) =>
      Api.postArticleCommentReply(articleId, parentCommentId, body),
    mutationKey: ["articles", "commentReply"],
    toastSuccess: "Reply posted",
    ...options,
  });
}

export function useDeleteArticleComment(options) {
  return useApiMutation({
    mutationFn: Api.deleteArticleComment,
    mutationKey: ["articles", "commentDelete"],
    toastSuccess: "Comment removed",
    ...options,
  });
}

export function useLikeArticle(options) {
  return useApiMutation({
    mutationFn: Api.likeArticle,
    mutationKey: ["articles", "like"],
    toastSuccess: false,
    showSuccessToast: false,
    ...options,
  });
}

export function useUnlikeArticle(options) {
  return useApiMutation({
    mutationFn: Api.unlikeArticle,
    mutationKey: ["articles", "unlike"],
    toastSuccess: false,
    showSuccessToast: false,
    ...options,
  });
}

export function useArticleLikeStatus(articleId, queryOptions = {}) {
  const { enabled = Boolean(articleId), notifyOnError = false, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["articles", articleId, "likeStatus"],
    queryFn: () => Api.getArticleLikeStatus(articleId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_article");
  return q;
}

export function useShareArticle(options) {
  return useApiMutation({
    mutationFn: ({ articleId, ...body }) =>
      Api.shareArticle(articleId, body),
    mutationKey: ["articles", "share"],
    toastSuccess: "Share recorded",
    ...options,
  });
}

export function useUploadArticleImage(options) {
  return useApiMutation({
    mutationFn: ({ userId, articleId, file }) =>
      Api.uploadArticleImage(userId, articleId, file),
    mutationKey: ["articles", "uploadImage"],
    toastSuccess: "Image uploaded",
    ...options,
  });
}

export function useUploadArticleVideo(options) {
  return useApiMutation({
    mutationFn: ({ userId, articleId, file }) =>
      Api.uploadArticleVideo(userId, articleId, file),
    mutationKey: ["articles", "uploadVideo"],
    toastSuccess: "Video uploaded",
    ...options,
  });
}

export function useDeleteBlogApiFile(options) {
  return useApiMutation({
    mutationFn: ({ fileId, articleId }) =>
      Api.deleteBlogApiFile(fileId, articleId),
    mutationKey: ["articles", "fileDelete"],
    toastSuccess: "File removed",
    ...options,
  });
}

/* ─── Static files ─────────────────────────────────────────────────────────── */

export function useUploadUniversityLogo(options) {
  return useApiMutation({
    mutationFn: ({ id, file }) => Api.postUniversityLogo(id, file),
    mutationKey: ["files", "universityLogo"],
    toastSuccess: "Logo uploaded",
    ...options,
  });
}

export function useUploadFacultyLogo(options) {
  return useApiMutation({
    mutationFn: ({ id, file }) => Api.postFacultyLogo(id, file),
    mutationKey: ["files", "facultyLogo"],
    toastSuccess: "Logo uploaded",
    ...options,
  });
}

export function useUploadDepartmentLogo(options) {
  return useApiMutation({
    mutationFn: ({ id, file }) => Api.postDepartmentLogo(id, file),
    mutationKey: ["files", "departmentLogo"],
    toastSuccess: "Logo uploaded",
    ...options,
  });
}

export function useUploadTeacherProfilePicture(options) {
  return useApiMutation({
    mutationFn: ({ id, file }) => Api.postTeacherProfilePicture(id, file),
    mutationKey: ["files", "teacherProfile"],
    toastSuccess: "Profile picture updated",
    ...options,
  });
}

export function useUploadEmployeeProfilePicture(options) {
  return useApiMutation({
    mutationFn: ({ file }) => Api.postEmployeeProfilePicture(file),
    mutationKey: ["files", "employeeProfile"],
    toastSuccess: "Profile picture updated",
    ...options,
  });
}

/**
 * Upload the signed-in user's profile photo (role-aware).
 * - admin / staff / dean / employee → `/api/v1/employee/profile/{id}`
 * - teacher → `/api/v1/teacher/profile/{id}`
 * - student → `/api/v1/student/profile/{id}`
 * - author / others → `/api/v1/users/profile/{id}`
 */
export function useUploadAccountProfilePicture(options) {
  return useApiMutation({
    mutationFn: ({ userId, role, user_type, file }) => {
      const id = String(userId ?? "").trim();
      if (!id) throw new Error("userId is required");
      const r = String(role ?? "").toLowerCase();
      const ut = String(user_type ?? "").toLowerCase();

      const asEmployee =
        r === "admin" ||
        r === "dean" ||
        ut === "staff" ||
        ut === "employee" ||
        ut === "admin";

      if (r === "teacher") return Api.postTeacherProfilePictureV1(id, file);
      if (r === "student" || r === "user") return Api.postStudentProfilePictureV1(id, file);
      if (asEmployee) return Api.postEmployeeProfilePictureV1(id, file);
      return Api.postUserProfilePictureV1(id, file);
    },
    mutationKey: ["files", "accountProfile"],
    toastSuccess: "Profile picture updated",
    ...options,
  });
}

export function useUploadBlogFile(options) {
  return useApiMutation({
    mutationFn: ({ file, ownerId, articleId }) =>
      Api.uploadBlogFileMultipart(file, ownerId, articleId),
    mutationKey: ["files", "blogUpload"],
    toastSuccess: "File uploaded",
    ...options,
  });
}

export function useUploadVicExecutable(options = {}) {
  return useApiMutation({
    mutationFn: ({ file }) => Api.uploadVicExecutable(file),
    mutationKey: ["files", "cli-application", "vic.exe", "upload"],
    toastSuccess: "VIC executable uploaded",
    ...options,
  });
}

/* ─── Notifications ───────────────────────────────────────────────────────── */

export function useCreateNotification(options) {
  return useApiMutation({
    mutationFn: Api.createNotification,
    mutationKey: ["notifications", "create"],
    toastSuccess: "Notification queued",
    ...options,
  });
}

export function useResendNotification(options) {
  return useApiMutation({
    mutationFn: ({ id, ...body }) => Api.resendNotification(id, body),
    mutationKey: ["notifications", "resend"],
    toastSuccess: "Resend triggered",
    ...options,
  });
}

export function useNotification(id, queryOptions = {}) {
  const { enabled = Boolean(id), notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "detail", id],
    queryFn: () => Api.getNotificationById(id),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notification");
  return q;
}

export function useNotificationsList(params = {}, queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: () => Api.listNotificationsRoot(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useUserNotifications(userId, params = {}, queryOptions = {}) {
  const { enabled = Boolean(userId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "user", userId, params],
    queryFn: () => Api.listUserNotifications(userId, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useUserNotificationsByType(
  userId,
  type,
  params = {},
  queryOptions = {},
) {
  const { enabled = Boolean(userId && type), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "user", userId, "type", type, params],
    queryFn: () => Api.listUserNotificationsByType(userId, type, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useUserNotificationsByStatus(
  userId,
  status,
  params = {},
  queryOptions = {},
) {
  const { enabled = Boolean(userId && status), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "user", userId, "status", status, params],
    queryFn: () =>
      Api.listUserNotificationsByStatus(userId, status, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useNotificationsByStatusGlobally(
  status,
  params = {},
  queryOptions = {},
) {
  const { enabled = Boolean(status), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "global", "status", status, params],
    queryFn: () => Api.listNotificationsByStatusGlobally(status, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useNotificationsByTypeGlobally(
  type,
  params = {},
  queryOptions = {},
) {
  const { enabled = Boolean(type), notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "global", "type", type, params],
    queryFn: () => Api.listNotificationsByTypeGlobally(type, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useNotificationsByReference(params, queryOptions = {}) {
  const { enabled = Boolean(params), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "reference", params],
    queryFn: () => Api.listNotificationsByReference(params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_notifications");
  return q;
}

export function useUserNotificationUnreadCount(userId, queryOptions = {}) {
  const { enabled = Boolean(userId), notifyOnError = true, ...rest } =
    queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "unread", userId],
    queryFn: () => Api.getUserNotificationUnreadCount(userId),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_unread_count");
  return q;
}

export function useMarkNotificationRead(options) {
  return useApiMutation({
    mutationFn: Api.markNotificationAsRead,
    mutationKey: ["notifications", "markRead"],
    showSuccessToast: false,
    toastSuccess: false,
    toastError: "apiErrors.failed_to_mark_notification_read",
    ...options,
  });
}

export function useDeleteNotification(options) {
  return useApiMutation({
    mutationFn: Api.deleteNotification,
    mutationKey: ["notifications", "delete"],
    toastSuccess: "Notification deleted",
    toastError: "apiErrors.failed_to_delete_notification",
    ...options,
  });
}

export function useAdminRetryFailedNotifications(options) {
  return useApiMutation({
    mutationFn: Api.adminRetryFailedNotifications,
    mutationKey: ["notifications", "adminRetry"],
    toastSuccess: "Retry job started",
    ...options,
  });
}

export function useAdminCleanupNotifications(options) {
  return useApiMutation({
    mutationFn: (daysOld = 30) =>
      Api.adminCleanupNotifications(daysOld),
    mutationKey: ["notifications", "adminCleanup"],
    toastSuccess: "Cleanup completed",
    ...options,
  });
}

export function useAdminNotificationStatistics(params = {}, queryOptions = {}) {
  const { notifyOnError = true, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["notifications", "adminStats", params],
    queryFn: () => Api.adminNotificationStatistics(params),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_stats");
  return q;
}

/* ─── Version control ─────────────────────────────────────────────────────── */

export function useVcRegister(options) {
  return useApiMutation({
    mutationFn: Api.vcRegister,
    mutationKey: ["vc", "register"],
    toastSuccess: "Registered successfully",
    ...options,
  });
}

export function useVcLogin(options) {
  return useApiMutation({
    mutationFn: Api.vcLogin,
    mutationKey: ["vc", "login"],
    toastSuccess: "Signed in to version control",
    ...options,
  });
}

export function useVcRefresh(options) {
  return useApiMutation({
    mutationFn: Api.vcRefresh,
    mutationKey: ["vc", "refresh"],
    toastSuccess: false,
    showSuccessToast: false,
    ...options,
  });
}

export function useVcCreateRepository(options) {
  return useApiMutation({
    mutationFn: Api.vcCreateRepository,
    mutationKey: ["vc", "repos", "create"],
    toastSuccess: "Repository created",
    ...options,
  });
}

export function useVcRepository(owner, repo, queryOptions = {}) {
  const {
    enabled = Boolean(owner && repo),
    notifyOnError = true,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "repos", owner, repo],
    queryFn: () => Api.vcGetRepository(owner, repo),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_repository");
  return q;
}

export function useVcRepositoryInvitations(owner, repo, queryOptions = {}) {
  const {
    enabled = Boolean(owner && repo),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "repos", owner, repo, "invitations"],
    queryFn: () => Api.vcListRepositoryInvitations(owner, repo),
    enabled,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository_invitations",
  );
  return q;
}

export function useVcRepositoryTree(owner, repo, params = {}, queryOptions = {}) {
  const {
    enabled = Boolean(owner && repo),
    notifyOnError = true,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "tree", owner, repo, params],
    queryFn: () => Api.vcGetRepositoryTree(owner, repo, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_tree");
  return q;
}

export function useVcRepositoryRefs(owner, repo, queryOptions = {}) {
  const {
    enabled = Boolean(owner && repo),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "refs", owner, repo],
    queryFn: () => Api.vcGetRepositoryRefs(owner, repo),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.generic");
  return q;
}

export function useVcRepositoryContents(
  owner,
  repo,
  path = "",
  params = {},
  queryOptions = {},
) {
  const {
    enabled = Boolean(owner && repo),
    notifyOnError = true,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "contents", owner, repo, path, params],
    queryFn: () => Api.vcGetRepositoryContents(owner, repo, path, params),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_file");
  return q;
}

/**
 * Commits via gateway `/repos/{owner}/{repo}/commits` (fallback to legacy branch route).
 */
export function useVcRepositoryCommits(
  owner,
  repo,
  opts = {},
  queryOptions = {},
) {
  const { path = "", ref = "main", limit = 40 } = opts;
  const {
    enabled = Boolean(owner && repo && ref),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "commits", owner, repo, ref, limit, path],
    queryFn: () => fetchRepositoryCommits(owner, repo, { path, ref, limit }),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.generic");
  return q;
}

/** Compare refs per `apiEndpoint.md` `/repos/{owner}/{repo}/compare/{base}...{head}`. */
export function useVcRepositoryCompare(
  owner,
  repo,
  baseRef,
  headRef,
  queryOptions = {},
) {
  const {
    enabled = Boolean(owner && repo && baseRef && headRef),
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["vc", "compare", owner, repo, baseRef, headRef],
    queryFn: () => fetchRepositoryCompare(owner, repo, baseRef, headRef),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.generic");
  return q;
}

/** `/api/student` row keyed to the signed-in gateway user (`sub` ⇄ Keycloak fields on Student). */
export function useLinkedStudentRecord(gatewayUser, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const gid = gatewayUser?.id ?? "";
  const uname =
    typeof gatewayUser?.username === "string"
      ? gatewayUser.username.trim()
      : "";

  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(gatewayUser != null && (gid !== "" || uname !== ""));

  const q = useQuery({
    queryKey: ["students", "linked-profile", gid, uname],
    queryFn: () => Api.fetchLinkedStudentForGatewayUser(gatewayUser),
    enabled,
    staleTime: 60_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_student",
  );
  return q;
}

export function useAdminArticles(params = {}, queryOptions = {}) {
  const { notifyOnError = true, requestConfig, ...rest } = queryOptions;
  const q = useQuery({
    queryKey: ["articles", "admin", params],
    queryFn: () => Api.getAdminArticles(params, requestConfig),
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_load_articles");
  return q;
}

/** `/api/teacher` row keyed to the signed-in gateway user (teacher id, not gateway user id). */
export function useLinkedTeacherRecord(gatewayUser, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const gid = gatewayUser?.id ?? "";
  const uname =
    typeof gatewayUser?.username === "string"
      ? gatewayUser.username.trim()
      : typeof gatewayUser?.user_name === "string"
        ? gatewayUser.user_name.trim()
        : "";

  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(gatewayUser != null && (gid !== "" || uname !== ""));

  const q = useQuery({
    queryKey: ["teachers", "linked-profile", gid, uname],
    queryFn: () => Api.fetchLinkedTeacherForGatewayUser(gatewayUser),
    enabled,
    staleTime: 60_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_teacher",
  );
  return q;
}

/**
 * Loads repositories owned by `ownerAccountId` (gateway user id passed to `GET …/api/v1/repos/{ownerId}`).
 * @param {string | null | undefined} ownerAccountId
 * @param {{ activityUsernameFallback?: string; notifyOnError?: boolean; enabled?: boolean } & Omit<import("@tanstack/react-query").UseQueryOptions, "queryKey"|"queryFn">} queryOptions
 */
export function useVcRepositoriesForViewer(ownerAccountId, queryOptions = {}) {
  const ownerKey =
    typeof ownerAccountId === "string"
      ? ownerAccountId.trim()
      : `${ownerAccountId ?? ""}`.trim();
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    activityUsernameFallback,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(ownerKey.length);

  const q = useQuery({
    queryKey: ["vc", "repos", "by-owner-account", ownerKey, activityUsernameFallback ?? ""],
    queryFn: () =>
      Api.vcListRepositoriesWithFallback(ownerKey, {
        activityUsernameFallback:
          typeof activityUsernameFallback === "string"
            ? activityUsernameFallback
            : "",
      }),
    enabled,
    staleTime: 30_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

/**
 * Loads repositories the current user can access, including accepted collaborations.
 * Keeps the older owner-only query separate for screens that require ownership-only semantics.
 *
 * @param {string | null | undefined} userAccountId
 * @param {{ activityUsernameFallback?: string; notifyOnError?: boolean; enabled?: boolean } & Omit<import("@tanstack/react-query").UseQueryOptions, "queryKey"|"queryFn">} queryOptions
 */
export function useVcAccessibleRepositoriesForViewer(
  userAccountId,
  queryOptions = {},
) {
  const userKey =
    typeof userAccountId === "string"
      ? userAccountId.trim()
      : `${userAccountId ?? ""}`.trim();
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    activityUsernameFallback,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(userKey.length);

  const q = useQuery({
    queryKey: [
      "vc",
      "repos",
      "accessible-by-account",
      userKey,
      activityUsernameFallback ?? "",
    ],
    queryFn: () =>
      Api.vcListAccessibleRepositoriesWithFallback(userKey, {
        activityUsernameFallback:
          typeof activityUsernameFallback === "string"
            ? activityUsernameFallback
            : "",
      }),
    enabled,
    staleTime: 30_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcRepoPullRequests(owner, repo, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo);

  const q = useQuery({
    queryKey: ["vc", "repos", "pulls", owner, repo],
    queryFn: () => Api.vcListPullRequests(owner, repo),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcCreatePullRequest(options) {
  return useApiMutation({
    mutationFn: ({ owner, repo, ...body }) =>
      Api.vcCreatePullRequest(owner, repo, body),
    mutationKey: ["vc", "repos", "pulls", "create"],
    toastSuccess: "Pull request created",
    ...options,
  });
}

export function useVcMergeConflicts(owner, repo, prNumber, queryOptions = {}) {
  const {
    enabled: enabledOverride,
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo && prNumber != null && prNumber !== "");

  const q = useQuery({
    queryKey: ["vc", "repos", "pulls", owner, repo, prNumber, "conflicts"],
    queryFn: () => fetchMergeConflicts(owner, repo, prNumber),
    staleTime: 15_000,
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.generic");
  return q;
}

export function useVcMergePullRequest(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, onError: userOnError, ...rest } = options;

  return useApiMutation({
    mutationFn: ({ owner, repo, prNumber }) =>
      mergePullRequest(owner, repo, prNumber),
    mutationKey: ["vc", "repos", "pulls", "merge"],
    toastSuccess: "Pull request merged",
    ...rest,
    onSuccess: async (data, variables, context) => {
      const owner = variables?.owner;
      const repo = variables?.repo;
      const prNumber = variables?.prNumber;
      if (owner && repo) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["vc", "repos", "pulls", owner, repo],
          }),
          queryClient.invalidateQueries({
            queryKey: ["vc", "repos", "pulls", owner, repo, prNumber, "conflicts"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["vcPullRequestFiles", owner, repo, prNumber],
          }),
        ]);
      }
      userOnSuccess?.(data, variables, context);
    },
    onError: async (error, variables, context) => {
      const owner = variables?.owner;
      const repo = variables?.repo;
      const prNumber = variables?.prNumber;
      if (owner && repo) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["vc", "repos", "pulls", owner, repo],
          }),
          queryClient.invalidateQueries({
            queryKey: ["vc", "repos", "pulls", owner, repo, prNumber, "conflicts"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["vcPullRequestFiles", owner, repo, prNumber],
          }),
        ]);
      }
      userOnError?.(error, variables, context);
    },
  });
}

export function useVcResolveMergeConflict(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...rest } = options;

  return useApiMutation({
    mutationFn: ({ owner, repo, prNumber, body }) =>
      resolveMergeConflict(owner, repo, prNumber, body),
    mutationKey: ["vc", "repos", "pulls", "resolve-conflict"],
    toastSuccess: "Conflict resolved",
    ...rest,
    onSuccess: async (data, variables, context) => {
      const owner = variables?.owner;
      const repo = variables?.repo;
      const prNumber = variables?.prNumber;
      if (owner && repo) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["vc", "repos", "pulls", owner, repo],
          }),
          queryClient.invalidateQueries({
            queryKey: ["vc", "repos", "pulls", owner, repo, prNumber, "conflicts"],
          }),
        ]);
      }
      userOnSuccess?.(data, variables, context);
    },
  });
}

export function useVcInviteRepositoryCollaborator(options) {
  return useApiMutation({
    mutationFn: ({ owner, repo, guest }) =>
      Api.vcInviteRepositoryCollaborator(owner, repo, guest),
    mutationKey: ["vc", "repos", "collaborators", "invite"],
    toastSuccess: "Repository invitation sent",
    ...options,
  });
}

export function useVcAcceptRepositoryInvitation(options = {}) {
  return useApiMutation({
    mutationFn: ({ invitationId, userId }) =>
      Api.vcAcceptRepositoryInvitation(invitationId, userId),
    mutationKey: ["vc", "repos", "invitations", "accept"],
    toastSuccess: "Repository invitation accepted",
    ...options,
  });
}

export function useVcRejectRepositoryInvitation(options = {}) {
  return useApiMutation({
    mutationFn: ({ invitationId, userId }) =>
      Api.vcRejectRepositoryInvitation(invitationId, userId),
    mutationKey: ["vc", "repos", "invitations", "reject"],
    toastSuccess: "Repository invitation declined",
    ...options,
  });
}

/**
 * @param {string | string[] | null | undefined} username VC login shown in repos paths
 * @param {{ notifyOnError?: boolean; enabled?: boolean; limit?: number } & Omit<import("@tanstack/react-query").UseQueryOptions, "queryKey"|"queryFn">} queryOptions
 */
export function useVcUserActivity(username, queryOptions = {}) {
  const candidates = [
    ...new Set(
      (Array.isArray(username) ? username : [username])
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    limit = 150,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : candidates.length > 0;

  const q = useQuery({
    queryKey: ["vc", "user-activity", candidates, limit],
    queryFn: () => Api.vcGetUserActivityForCandidates(candidates, { limit }),
    enabled,
    staleTime: 30_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useUserSearch(keyword, queryOptions = {}) {
  const trimmedKeyword = String(keyword ?? "").trim();
  const {
    enabled = trimmedKeyword.length > 0,
    notifyOnError = false,
    ...rest
  } = queryOptions;
  const q = useQuery({
    queryKey: ["users", "search", trimmedKeyword],
    queryFn: () => Api.searchUsers(trimmedKeyword),
    enabled,
    ...rest,
  });
  useQueryErrorToast(q, notifyOnError, "apiErrors.failed_to_search_users");
  return q;
}

export function useVcRepoTaskDashboard(owner, repo, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo);

  const q = useQuery({
    queryKey: ["vc", "repos", "task-dashboard", owner, repo],
    queryFn: () => Api.vcGetRepoTaskDashboard(owner, repo),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcCreateRepoTask(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, username, ...body }) =>
      Api.vcCreateRepoTask(owner, repo, username, body),
    mutationKey: ["vc", "repos", "tasks", "create"],
    toastSuccess: "Task created",
    ...options,
  });
}

export function useVcRepoTasks(owner, repo, params = {}, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo);

  const q = useQuery({
    queryKey: ["vc", "repos", "tasks", owner, repo, params],
    queryFn: () => Api.vcGetRepoTasks(owner, repo, params),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcCreateRepoMilestone(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, ...body }) =>
      Api.vcCreateRepoMilestone(owner, repo, body),
    mutationKey: ["vc", "repos", "milestones", "create"],
    toastSuccess: "Milestone created",
    ...options,
  });
}

export function useVcRepoMilestones(owner, repo, params = {}, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo);

  const q = useQuery({
    queryKey: ["vc", "repos", "milestones", owner, repo, params],
    queryFn: () => Api.vcGetRepoMilestones(owner, repo, params),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcRepoMilestoneByNumber(
  owner,
  repo,
  milestoneNumber,
  queryOptions = {},
) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const hasNumber =
    milestoneNumber != null && String(milestoneNumber).trim() !== "";
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo && hasNumber);

  const q = useQuery({
    queryKey: ["vc", "repos", "milestone", owner, repo, milestoneNumber],
    queryFn: () =>
      Api.vcGetRepoMilestoneByNumber(owner, repo, milestoneNumber),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcPatchRepoMilestone(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, milestoneNumber, ...body }) =>
      Api.vcPatchRepoMilestone(owner, repo, milestoneNumber, body),
    mutationKey: ["vc", "repos", "milestones", "patch"],
    toastSuccess: "studentRepo.tasks.milestoneDetail.savedToast",
    ...options,
  });
}

export function useVcCloseRepoMilestone(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, milestoneNumber }) =>
      Api.vcCloseRepoMilestone(owner, repo, milestoneNumber),
    mutationKey: ["vc", "repos", "milestones", "close"],
    toastSuccess: "studentRepo.tasks.milestoneDetail.closedToast",
    ...options,
  });
}

export function useVcReopenRepoMilestone(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, milestoneNumber }) =>
      Api.vcReopenRepoMilestone(owner, repo, milestoneNumber),
    mutationKey: ["vc", "repos", "milestones", "reopen"],
    toastSuccess: "studentRepo.tasks.milestoneDetail.reopenedToast",
    ...options,
  });
}

export function useVcRepoTaskByNumber(owner, repo, taskNumber, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const hasNumber =
    taskNumber != null && String(taskNumber).trim() !== "";
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo && hasNumber);

  const q = useQuery({
    queryKey: ["vc", "repos", "task", owner, repo, taskNumber],
    queryFn: () => Api.vcGetRepoTaskByNumber(owner, repo, taskNumber),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcAssignRepoTask(options = {}) {
  return useApiMutation({
    mutationFn: ({
      owner,
      repo,
      taskNumber,
      actorUsername,
      assigneeUsername,
    }) =>
      Api.vcAssignRepoTask(
        owner,
        repo,
        taskNumber,
        actorUsername,
        assigneeUsername,
      ),
    mutationKey: ["vc", "repos", "tasks", "assign"],
    toastSuccess: "studentRepo.tasks.taskDetail.assignSavedToast",
    ...options,
  });
}

export function useVcSubmitRepoTask(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, taskNumber, ...body }) =>
      Api.vcSubmitRepoTask(owner, repo, taskNumber, body),
    mutationKey: ["vc", "repos", "tasks", "submit"],
    toastSuccess: "studentRepo.tasks.taskDetail.submitSavedToast",
    ...options,
  });
}

export function useVcEligibleRepoTaskPullRequests(
  owner,
  repo,
  taskNumber,
  queryOptions = {},
) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const hasNumber =
    taskNumber != null && String(taskNumber).trim() !== "";
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo && hasNumber);

  const q = useQuery({
    queryKey: ["vc", "repos", "tasks", owner, repo, taskNumber, "eligible-pulls"],
    queryFn: () => Api.vcGetEligibleRepoTaskPullRequests(owner, repo, taskNumber),
    enabled,
    staleTime: 15_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcReviewRepoTask(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, taskNumber, ...body }) =>
      Api.vcReviewRepoTask(owner, repo, taskNumber, body),
    mutationKey: ["vc", "repos", "tasks", "review"],
    toastSuccess: "studentRepo.tasks.taskDetail.reviewSavedToast",
    ...options,
  });
}

export function useVcCompleteRepoTask(options = {}) {
  return useApiMutation({
    mutationFn: ({ owner, repo, taskNumber, ...body }) =>
      Api.vcCompleteRepoTask(owner, repo, taskNumber, body),
    mutationKey: ["vc", "repos", "tasks", "complete"],
    toastSuccess: false,
    ...options,
  });
}

export function useVcRepoStatistics(owner, repo, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo);

  const q = useQuery({
    queryKey: ["vc", "repos", "statistics", owner, repo],
    queryFn: () => Api.vcGetRepoStatistics(owner, repo),
    enabled,
    staleTime: 30_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}

export function useVcRepoContributors(owner, repo, queryOptions = {}) {
  const {
    notifyOnError = false,
    enabled: enabledOverride,
    ...rest
  } = queryOptions;
  const enabled =
    typeof enabledOverride === "boolean"
      ? enabledOverride
      : Boolean(owner && repo);

  const q = useQuery({
    queryKey: ["vc", "repos", "contributors", owner, repo],
    queryFn: () => Api.vcGetRepoContributors(owner, repo),
    enabled,
    staleTime: 60_000,
    ...rest,
  });
  useQueryErrorToast(
    q,
    notifyOnError,
    "apiErrors.failed_to_load_repository",
  );
  return q;
}
