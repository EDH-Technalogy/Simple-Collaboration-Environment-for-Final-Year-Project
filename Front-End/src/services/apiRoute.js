// @ts-ignore
import axiosInstance from "./axiosConfig";
import { authUsesCookieRefresh } from "../auth/httpCredentials";
import { ingestGatewayLoginPayload } from "../auth/sessionApply";
import {
  fetchCurrentGatewayUser,
  logoutLocalGateway,
} from "../auth/authService";
import {
  extractNotificationUnreadCountPayload,
  unwrapNotificationEnvelope,
} from "../utils/notificationEnvelope";
import {
  AUTH,
  STUDENT,
  DEPARTMENT,
  FACULTY,
  UNIVERSITY,
  BATCH,
  ACADEMIC_YEAR,
  SEMESTER,
  REPOSITORY,
  FACULTY_PROJECT,
  FACULTY_GROUP,
  TEACHER,
  EMPLOYEE,
  USERS,
  ROLES,
  PERMISSIONS,
  BLOG,
  BLOG_API_FILES,
  FILE,
  NOTIFICATIONS,
  VC_AUTH,
  VC,
} from "./RouteConfig";
import {
  assertVcAssignUsernames,
  normalizeVcMilestoneBodyForCreate,
  normalizeVcMilestoneBodyForPatch,
  normalizeVcReviewBody,
  normalizeVcSubmissionBody,
  normalizeVcTaskCreateBody,
} from "./vcMilestoneTaskClientValidation";
function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function normalizeLoginIdentifier(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed;
}

/** Exported for toast / logging — parses axios error `response.data`. */
export function extractApiError(err, fallbackMessage = "Request failed.") {
  const body = err.response?.data;
  if (typeof body === "string") return body || fallbackMessage;
  if (body?.detail && typeof body.detail === "string") return body.detail;
  if (Array.isArray(body?.errors) && body.errors.length) {
    const parts = body.errors.map((e) =>
      typeof e === "string" ? e : e?.message || JSON.stringify(e),
    );
    return parts.join(" · ") || fallbackMessage;
  }
  return (
    body?.message ?? body?.error_description ?? err.message ?? fallbackMessage
  );
}

/**
 * Throw with `extractApiError`-style `message` plus HTTP metadata for localized toasts.
 * @param {unknown} err — Usually an Axios error from the `catch` clause
 * @param {string} fallbackMessage — English fallback for logging / non-i18n tooling
 * @param {string} [i18nKey] — Translation key such as `apiErrors.*`
 */
export function throwApiError(
  err,
  fallbackMessage = "Request failed.",
  i18nKey,
) {
  const message = extractApiError(err, fallbackMessage);
  const error = new Error(message);
  error.name = "ApiRequestError";
  if (i18nKey) error.i18nKey = i18nKey;
  if (err?.response) error.response = err.response;
  if (err?.response?.status != null) error.status = err.response.status;
  if (err?.code) error.code = err.code;
  throw error;
}

/** Client-side validation / pre-check before a request (localized via `i18nKey`). */
export function throwClientApiError(message, i18nKey) {
  const error = new Error(message);
  error.name = "ApiClientValidationError";
  if (i18nKey) error.i18nKey = i18nKey;
  throw error;
}

/** POST `/api/v1/auth/login` (resource-owner) */
export async function login(formData) {
  const username_or_email = normalizeLoginIdentifier(
    formData.email ?? formData.username_or_email,
  );
  const password = formData.password;
  const remember_me = Boolean(formData.remember_me);

  if (!username_or_email || !password) {
    throwClientApiError(
      "Email/username and password are required.",
      "apiErrors.validation.emailUsernamePasswordRequired",
    );
  }

  try {
    const { data } = await axiosInstance.post(AUTH.LOGIN, {
      username_or_email,
      password,
      remember_me,
    });
    return ingestGatewayLoginPayload(data);
  } catch (err) {
    throwApiError(err, "Login failed.", "apiErrors.login_failed");
  }
}

/** POST `/api/v1/auth/signup` */
export async function signup(formData) {
  const fullName = String(formData.fullName ?? "").trim();
  const email = normalizeEmail(formData.email);
  const password = formData.password;
  const phone_number = String(
    formData.phone_number ?? formData.phoneNumber ?? "",
  ).trim();
  const explicitFirstName = String(
    formData.first_name ?? formData.firstName ?? "",
  ).trim();
  const explicitLastName = String(
    formData.last_name ?? formData.lastName ?? "",
  ).trim();

  if ((!fullName && (!explicitFirstName || !explicitLastName)) || !email || !password) {
    throwClientApiError(
      "First name, last name, email, and password are required.",
      "apiErrors.validation.fullNameEmailPasswordRequired",
    );
  }

  const nameParts = fullName.split(" ").filter(Boolean);
  const first_name = explicitFirstName || nameParts[0] || "";
  const last_name = explicitLastName || nameParts.slice(1).join(" ") || "";
  const username =
    typeof formData.username === "string" && formData.username.trim().length > 0
      ? formData.username.trim()
      : email.split("@")[0].replace(/[^a-z0-9]/gi, "");

  try {
    const { data } = await axiosInstance.post(AUTH.SIGNUP, {
      username,
      email,
      password,
      first_name,
      last_name,
      phone_number,
      role: "AUTHOR_USER",
      terms_agreed: true,
      privacy_agreed: true,
      agree_to_terms: true,
      agree_to_policy: true,
      terms_accepted: true,
      policy_accepted: true,
    });
    return data;
  } catch (err) {
    throwApiError(err, "Signup failed.", "apiErrors.signup_failed");
  }
}

/** POST `/api/v1/auth/google` */
export async function googleAuth(payload) {
  const id_token =
    typeof payload?.id_token === "string" ? payload.id_token : "";

  try {
    const { data } = await axiosInstance.post(AUTH.GOOGLE, {
      id_token,
      access_token: payload.access_token,
      device_id:
        payload.device_id ??
        `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    });
    return ingestGatewayLoginPayload(data);
  } catch (err) {
    throwApiError(
      err,
      "Google authentication failed.",
      "apiErrors.google_authentication_failed",
    );
  }
}

/** POST `/api/v1/auth/refresh-token` */
export async function refreshAuthToken(refresh_token) {
  const cookieMode = authUsesCookieRefresh();
  if (!cookieMode && !refresh_token) {
    throwClientApiError(
      "Refresh token is required.",
      "apiErrors.validation.refreshTokenRequired",
    );
  }

  try {
    const body = cookieMode ? {} : { refresh_token };
    const { data } = await axiosInstance.post(AUTH.REFRESH_TOKEN, body);
    return ingestGatewayLoginPayload(data);
  } catch (err) {
    throwApiError(
      err,
      "Token refresh failed.",
      "apiErrors.token_refresh_failed",
    );
  }
}

/** Clears SPA session and calls `/api/v1/auth/logout` when present. */
export async function logout() {
  await logoutLocalGateway();
}

/** GET `/api/v1/auth/me` — normalized profile + JWT-derived roles */
export async function fetchSessionProfile() {
  try {
    return await fetchCurrentGatewayUser();
  } catch (err) {
    throwApiError(err, "Unable to load session.");
  }
}

/** Map gateway / JSON variants into the flat list the admin table expects. */
function normalizeStudentRecord(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const firstName = raw.firstName ?? raw.first_name ?? "";
  const lastName = raw.lastName ?? raw.last_name ?? "";
  const deptNested =
    typeof raw.department === "object" && raw.department !== null
      ? raw.department
      : null;
  let departmentLabel =
    (typeof raw.department === "string" ? raw.department : "") ||
    deptNested?.name ||
    deptNested?.title ||
    raw.departmentName ||
    raw.department_name ||
    "";
  let departmentId = raw.departmentId ?? raw.department_id ?? "";
  if (!departmentId && deptNested?.id != null)
    departmentId = String(deptNested.id);

  let batchObj =
    typeof raw.batch === "object" && raw.batch !== null ? raw.batch : null;
  const batchIdFromRoot = raw.batchId ?? raw.batch_id;
  let batchId = "";
  if (batchObj?.id != null) batchId = String(batchObj.id);
  else if (typeof raw.batch === "string" && raw.batch.trim() !== "")
    batchId = String(raw.batch);
  else if (batchFromRoot(batchIdFromRoot)) batchId = String(batchIdFromRoot);

  const semesterRaw = raw.semester;
  const semesterObj =
    typeof semesterRaw === "object" && semesterRaw !== null ? semesterRaw : null;
  const semesterIdExplicit =
    raw.semesterId ?? raw.semester_id ?? semesterObj?.id ?? "";
  let academicYearId =
    raw.academicYearId ??
    raw.academic_year_id ??
    semesterObj?.academicYear?.id ??
    "";
  if (
    !academicYearId &&
    batchObj &&
    typeof batchObj === "object" &&
    batchObj.academicYear?.id != null
  )
    academicYearId = batchObj.academicYear.id;

  let semesterStored = "";
  if (semesterIdExplicit != null && `${semesterIdExplicit}`.trim() !== "") {
    semesterStored = String(semesterIdExplicit);
  } else {
    semesterStored = normalizeSemesterString(semesterRaw);
  }

  const addr =
    typeof raw.address === "object" && raw.address !== null ? raw.address : {};

  let statusNorm = raw.status ?? "";
  if (typeof statusNorm === "string" && statusNorm.trim() !== "")
    statusNorm = statusNorm.trim().toUpperCase();

  const studentRecordId =
    raw.id ??
    raw.studentId ??
    raw.student_id ??
    raw.studentRecordId ??
    raw.student_record_id ??
    raw.facultyStudentId ??
    raw.faculty_student_id ??
    "";

  return {
    ...raw,
    id: studentRecordId,
    studentId: studentRecordId,
    firstName,
    lastName,
    username: raw.username ?? raw.userName ?? raw.user_name ?? "",
    fatherName: raw.fatherName ?? raw.father_name ?? "",
    grandFatherName: raw.grandFatherName ?? raw.grand_father_name ?? "",
    nationality: raw.nationality ?? "",
    gender: normalizeGender(raw.gender),
    dateOfBirth: toDateInputValue(raw.dateOfBirth ?? raw.date_of_birth),
    email: raw.email ?? "",
    phone: raw.phone ?? raw.phone_number ?? "",
    code: raw.code ?? raw.studentCode ?? raw.student_code ?? "",
    enrollmentDate: toDateInputValue(raw.enrollmentDate ?? raw.enrollment_date),
    kankorId: raw.kankorId ?? raw.kankor_id ?? "",
    /** Semester identifier for selects (prefer API id when present). */
    semester: semesterStored,
    semesterDetails: semesterObj,
    semesterId:
      semesterIdExplicit != null && `${semesterIdExplicit}`.trim() !== ""
        ? String(semesterIdExplicit)
        : semesterStored,
    semesterStartDate:
      semesterObj?.startDate ??
      semesterObj?.start_date ??
      raw.semesterStartDate ??
      raw.semester_start_date ??
      "",
    semesterEndDate:
      semesterObj?.endDate ??
      semesterObj?.end_date ??
      raw.semesterEndDate ??
      raw.semester_end_date ??
      "",
    semesterAcademicYear: semesterObj?.academicYear ?? raw.academicYear ?? null,
    academicYearId:
      academicYearId != null ? String(academicYearId) : "",
    department: departmentLabel ? String(departmentLabel) : "",
    departmentId: departmentId != null ? String(departmentId) : "",
    status: statusNorm,
    batchId,
    batch:
      batchObj && typeof batchObj === "object" ? batchObj : (raw.batch ?? null),
    role: raw.role ?? "STUDENT",
    keycloakId:
      raw.keycloakId ??
      raw.keycloak_id ??
      raw.keycloakUserId ??
      raw.keycloak_user_id ??
      raw.keycloakSubject ??
      raw.keycloak_subject ??
      raw.keycloak ??
      raw.realmUserId ??
      raw.realm_user_id ??
      "",
    /** Gateway `users.id` when the backend links the Student row to the user service. */
    linkedApplicationUserId: (() => {
      const u =
        raw.applicationUserId ??
        raw.application_user_id ??
        raw.gatewayUserId ??
        raw.gateway_user_id;
      if (u != null && String(u).trim() !== "") return String(u).trim();
      if (typeof raw.user === "object" && raw.user?.id != null)
        return String(raw.user.id);
      return "";
    })(),
    addressStreet: addr.street ?? raw.addressStreet ?? "",
    addressCity: addr.city ?? raw.addressCity ?? "",
    addressPostalCode:
      addr.postalCode ??
      addr.postal_code ??
      addr.zipCode ??
      addr.zip_code ??
      addr.zip ??
      raw.addressPostalCode ??
      raw.postalCode ??
      raw.zipCode ??
      raw.zip ??
      "",
    addressProvince: addr.province ?? raw.addressProvince ?? "",
  };
}

function batchFromRoot(v) {
  return v != null && `${v}`.trim() !== "";
}

/** Whether a faculty `/api/student` row belongs to the signed-in gateway user (Keycloak `sub`/user UUID or username/email). */
export function studentEntityMatchesGatewayUser(gatewayUser, studentNorm) {
  if (!gatewayUser || !studentNorm?.id) return false;
  const gId =
    gatewayUser.id != null ? String(gatewayUser.id).trim() : "";
  const sk =
    studentNorm.keycloakId != null
      ? String(studentNorm.keycloakId).trim()
      : "";
  if (gId && sk && gId === sk) return true;
  const sa =
    studentNorm.linkedApplicationUserId != null
      ? String(studentNorm.linkedApplicationUserId).trim()
      : "";
  if (gId && sa && gId === sa) return true;
  const gun = normalizeLoginIdentifier(
    gatewayUser.username ?? gatewayUser.user_name ?? "",
  );
  const sun = normalizeLoginIdentifier(studentNorm.username ?? "");
  if (gun && sun && gun === sun) return true;
  const ge = normalizeEmail(gatewayUser.email ?? "");
  const se = normalizeEmail(studentNorm.email ?? "");
  return Boolean(ge && se && ge === se);
}

function toDateInputValue(v) {
  if (v == null || v === "") return "";
  const s = typeof v === "string" ? v : "";
  if (s.length >= 10) return s.slice(0, 10);
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function normalizeGender(v) {
  const s = `${v ?? ""}`.trim().toLowerCase();
  if (!s) return "";
  if (["male", "female", "other"].includes(s)) return s;
  if (s.startsWith("m")) return "male";
  if (s.startsWith("f")) return "female";
  return v != null ? String(v) : "";
}

/** Semester: API may send a number, string, or nested object (`code`, `name`, `academicYear`). */
function normalizeSemesterString(v) {
  if (v == null || v === "") return "";
  if (typeof v === "object") {
    if (v.code != null && String(v.code).trim() !== "") return String(v.code);
    if (v.name != null && String(v.name).trim() !== "") return String(v.name);
    const ayName = v.academicYear?.name;
    if (ayName != null && String(ayName).trim() !== "") return String(ayName);
    const ayId = v.academicYear?.id;
    if (ayId != null && String(ayId).trim() !== "") return String(ayId);
    return "";
  }
  const n = Number.parseInt(String(v).replace(/\D/g, ""), 10);
  if (Number.isFinite(n) && n >= 1 && n <= 8) return String(n);
  const s = `${v}`.trim();
  return s || "";
}

/* ─── Spring Data Pageable / PageResponse helpers ─────────────────────────── */

function serializeSpringQueryParams(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item != null && `${item}`.trim() !== "")
          usp.append(k, String(item));
      });
    } else {
      usp.append(k, String(v));
    }
  });
  return usp.toString();
}

/** Unwrap `{ data: Page }` vs direct `Page` payloads. */
function unwrapPagePayload(raw) {
  if (raw == null || typeof raw !== "object") return raw;
  const inner = raw.data ?? raw.result ?? raw.payload;
  const looksLikePage =
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    (Array.isArray(inner.content) ||
      (Array.isArray(inner.data) &&
        ("totalElements" in inner ||
          typeof inner.page === "number" ||
          typeof inner.totalPages === "number")) ||
      "totalElements" in inner);
  if (looksLikePage) return inner;
  return raw;
}

/** Faculty `/api/*` lists may return a bare array or a Spring page envelope. */
function facultyListItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const page = unwrapPagePayload(data);
  if (page && typeof page === "object") {
    if (Array.isArray(page.content)) return page.content;
    if (Array.isArray(page.data)) return page.data;
    if (Array.isArray(page.faculties)) return page.faculties;
    if (Array.isArray(page.items)) return page.items;
    if (Array.isArray(page.records)) return page.records;
    if (Array.isArray(page.results)) return page.results;
  }
  return [];
}

/** Some controllers wrap lists in a named property (e.g. `{ batches: [...] }`). */
function namedListFromPayload(payload, keys) {
  if (!payload || typeof payload !== "object") return [];
  for (const k of keys) {
    const v = payload[k];
    if (Array.isArray(v) && v.length) return v;
  }
  return [];
}

/**
 * Normalize Spring `Page`/`PageResponse`-shaped JSON to a stable client shape.
 */
function normalizeSpringPage(raw, normalizeItem) {
  const page = unwrapPagePayload(raw);
  if (page == null || typeof page !== "object") {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 0,
    };
  }

  /* Prefer `data` when present — several faculty/student services use it instead of Spring's `content`. */
  const contentRaw = Array.isArray(page.data)
    ? page.data
    : Array.isArray(page.content)
      ? page.content
      : Array.isArray(page.records)
        ? page.records
        : Array.isArray(page.items)
          ? page.items
          : [];
  const norm = (v) =>
    typeof normalizeItem === "function" ? normalizeItem(v) : v;
  const content = (Array.isArray(contentRaw) ? contentRaw : [])
    .map(norm)
    .filter(Boolean);

  const totalElements = Number(
    page.totalElements ?? page.total ?? page.total_records ?? 0,
  );
  let size = Number(page.size ?? page.pageSize ?? page.limit ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    size = content.length > 0 ? content.length : 10;
  }
  let number = Number(
    page.number ?? page.page ?? page.pageNumber ?? page.currentPage ?? 0,
  );
  if (number < 0 || Number.isNaN(number)) number = 0;

  let totalPages = Number(page.totalPages ?? page.total_pages ?? 0);
  if (!Number.isFinite(totalPages) || totalPages < 0) totalPages = 0;
  if (totalPages === 0 && totalElements > 0 && size > 0) {
    totalPages = Math.max(1, Math.ceil(totalElements / size));
  }

  return {
    content,
    totalElements,
    totalPages,
    number,
    size,
    first: Boolean(page.first ?? number === 0),
    last:
      Boolean(page.last) ||
      (totalPages > 0 && number >= totalPages - 1) ||
      totalElements === 0,
  };
}

function buildPageQueryBase(query) {
  const page = Math.max(0, Number(query?.page ?? 0) || 0);
  const size = Math.min(200, Math.max(1, Number(query?.size ?? 10) || 10));
  const params = { page, size };
  if (Array.isArray(query?.sort) && query.sort.length > 0)
    params.sort = query.sort.filter(Boolean);
  if (query?.search && `${query.search}`.trim())
    params.search = `${query.search}`.trim();
  if (query?.status != null && `${query.status}`.trim() !== "") {
    const st = `${query.status}`.trim();
    if (st.toLowerCase() !== "all") {
      params.status = st.toUpperCase();
    }
  }
  return params;
}

function normalizeStudentsList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload.map(normalizeStudentRecord).filter(Boolean);
  }
  if (typeof payload !== "object") return [];
  const nested =
    payload.content ??
    payload.students ??
    payload.items ??
    payload.data ??
    payload.records ??
    payload.results;
  if (Array.isArray(nested)) {
    return nested.map(normalizeStudentRecord).filter(Boolean);
  }
  return [];
}

export async function getStudents() {
  try {
    const { data } = await axiosInstance.get(STUDENT.GETALL);
    return normalizeStudentsList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load students.",
      "apiErrors.failed_to_load_students",
    );
  }
}

export async function getStudentsPage(query = {}) {
  try {
    const params = buildPageQueryBase(query);
    const qs = serializeSpringQueryParams(params);
    const url = qs ? `${STUDENT.GETALL}?${qs}` : STUDENT.GETALL;
    const { data } = await axiosInstance.get(url);
    return normalizeSpringPage(data, normalizeStudentRecord);
  } catch (err) {
    if (err?.response?.status === 404) {
      return normalizeSpringPage(null, normalizeStudentRecord);
    }
    throwApiError(
      err,
      "Failed to load students.",
      "apiErrors.failed_to_load_students",
    );
  }
}

export async function getStudentById(id) {
  try {
    const { data } = await axiosInstance.get(STUDENT.GETBYID(id));
    return normalizeStudentRecord(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load student.",
      "apiErrors.failed_to_load_student",
    );
  }
}

/** Best-effort: resolve `/api/student` row for dashboard & faculty APIs (student id, not gateway user id). */
export async function fetchLinkedStudentForGatewayUser(gatewayUser) {
  if (!gatewayUser) return null;
  const gid =
    gatewayUser.id != null ? String(gatewayUser.id).trim() : "";

  const tryNormalize = async (getter) => {
    try {
      const { data } = await getter();
      return normalizeStudentRecord(data);
    } catch (err) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  };

  let row =
    gid !== ""
      ? await tryNormalize(() => axiosInstance.get(STUDENT.BY_KEYCLOAK(gid)))
      : null;
  if (!row?.id) {
    row = await tryNormalize(() => axiosInstance.get(STUDENT.ME));
  }
  if (!row?.id) {
    const uname = normalizeLoginIdentifier(
      gatewayUser.username ?? gatewayUser.user_name ?? "",
    );
    try {
      const page = await getStudentsPage({
        page: 0,
        size: 250,
        search: uname,
      });
      const list = page?.content ?? [];
      row =
        list
          .map((item) => normalizeStudentRecord(item))
          .find((s) => studentEntityMatchesGatewayUser(gatewayUser, s)) ?? null;
      if (!row?.id && list.length === 250) {
        const pageWide = await getStudentsPage({
          page: 0,
          size: 500,
        });
        row =
          (pageWide.content ?? [])
            .map((item) => normalizeStudentRecord(item))
            .find((s) => studentEntityMatchesGatewayUser(gatewayUser, s)) ??
          null;
      }
    } catch {
      row = null;
    }
  }
  return row?.id ? row : null;
}

function unwrapListPayload(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const nested =
    payload.json ??
    payload.content ??
    payload.data ??
    payload.items ??
    payload.milestones ??
    payload.tasks ??
    payload.repositories ??
    payload.repos ??
    [];
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object" && nested !== payload) {
    return unwrapListPayload(nested);
  }
  return [];
}

function repoSlugsFromActivityEvents(events) {
  const out = [];
  if (!Array.isArray(events)) return out;
  const seen = new Set();
  const pushSlug = (owner, repo) => {
    const ownerText = String(owner ?? "").trim();
    const repoText = String(repo ?? "").trim();
    if (!ownerText || !repoText) return;
    const key = `${ownerText}/${repoText}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ownerUsername: ownerText, repositoryName: repoText });
  };
  for (const rawEvent of events) {
    const ev =
      rawEvent?.json && typeof rawEvent.json === "object"
        ? { ...rawEvent, ...rawEvent.json }
        : rawEvent;
    if (!ev || typeof ev !== "object") continue;
    const slug = typeof ev.repo === "string" ? ev.repo.trim() : "";
    if (slug && !slug.includes("//")) {
      const parts = slug.split("/").filter(Boolean);
      if (parts.length === 2) pushSlug(parts[0], parts[1]);
    }
    const owner =
      ev?.ownerUsername ??
      ev?.owner_username ??
      ev?.repoOwnerUsername ??
      ev?.repo_owner_username ??
      ev?.ownerName ??
      ev?.owner ??
      "";
    const repo =
      ev?.repoName ??
      ev?.repo_name ??
      ev?.repositoryName ??
      ev?.repository_name ??
      "";
    pushSlug(owner, repo);
    const urlText = String(
      ev?.repositoryUrl ?? ev?.repository_url ?? ev?.pullRequestUrl ?? "",
    );
    const match = urlText.match(/\/repos\/([^/?#]+)\/([^/?#]+)/i);
    if (match) {
      pushSlug(decodeURIComponent(match[1]), decodeURIComponent(match[2]));
    }
  }
  return out;
}

/**
 * Lists repositories owned by `ownerAccountId` (gateway / VC account id returned by `/api/v1/repos/owner/{ownerId}`).
 * Optional `activityUsernameFallback` restores slugs via the activity feed if the primary list is empty/unavailable (username-based VC paths).
 *
 * @param {string} ownerAccountId
 * @param {{ activityUsernameFallback?: string; activityLimit?: number }} options
 */
export async function vcListRepositoriesWithFallback(
  ownerAccountId,
  options = {},
) {
  const ownerKey = String(ownerAccountId ?? "").trim();
  if (!ownerKey) return [];
  try {
    const { data } = await axiosInstance.get(VC.REPOS_OWNED_BY(ownerKey));
    const list = unwrapListPayload(data);
    const normalized = list.map(normalizeVcRepoListItem).filter(Boolean);
    if (normalized.length) return normalized;
  } catch (err) {
    if (![400, 404, 422].includes(err?.response?.status)) {
      console.warn("[vcListRepositories]", err?.message ?? err);
    }
  }

  const activityLogin =
    typeof options.activityUsernameFallback === "string"
      ? options.activityUsernameFallback.trim()
      : "";
  if (!activityLogin) return [];

  try {
    const { data } = await axiosInstance.get(
      VC.USER_ACTIVITY(activityLogin, {
        limit: options.activityLimit ?? 120,
      }),
    );
    return repoSlugsFromActivityEvents(unwrapListPayload(data)).map((slug) =>
      normalizeVcRepoListItem({
        ownerUsername: slug.ownerUsername,
        repositoryName: slug.repositoryName,
      }),
    );
  } catch (err) {
    if (![404, 422].includes(err?.response?.status)) {
      console.warn("[vcListRepositories:fallback]", err?.message ?? err);
    }
  }
  return [];
}

/**
 * Lists repositories the user can access, including owned repositories and accepted collaborations.
 * Falls back to the owner-only listing if the newer backend route is unavailable.
 *
 * @param {string} userAccountId
 * @param {{ activityUsernameFallback?: string; activityLimit?: number }} options
 */
export async function vcListAccessibleRepositoriesWithFallback(
  userAccountId,
  options = {},
) {
  const userKey = String(userAccountId ?? "").trim();
  if (!userKey) return [];
  try {
    const { data } = await axiosInstance.get(VC.REPOS_ACCESSIBLE_BY(userKey));
    const list = unwrapListPayload(data);
    const normalized = list.map(normalizeVcRepoListItem).filter(Boolean);
    if (normalized.length) return normalized;
  } catch (err) {
    if (err?.response?.status === 404) {
      return vcListRepositoriesWithFallback(userKey, options);
    }
    if (![400, 404, 422].includes(err?.response?.status)) {
      console.warn("[vcAccessibleRepositories]", err?.message ?? err);
    }
  }

  return vcListRepositoriesWithFallback(userKey, options);
}

/** @param raw {object} VC list row (e.g. `RepositoryResponse`) */
function normalizeVcRepoListItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const repoName =
    raw.repositoryName ??
    raw.repository_name ??
    raw.name ??
    raw.repo ??
    "";
  let ownerUsername =
    raw.ownerUsername ??
    raw.owner_username ??
    raw.ownerUserName ??
    raw.owner_user_name ??
    raw.owner_login ??
    "";
  const ownerObj = raw.owner ?? raw.Owner ?? null;
  if (!ownerUsername && ownerObj != null && typeof ownerObj === "object") {
    const o = ownerObj;
    ownerUsername =
      (o.username != null && String(o.username).trim()) ||
      (o.userName != null && String(o.userName).trim()) ||
      (o.user_name != null && String(o.user_name).trim()) ||
      (o.login != null && String(o.login).trim()) ||
      "";
  }
  if (
    typeof ownerUsername !== "string" ||
    typeof repoName !== "string" ||
    !repoName.trim()
  )
    return null;
  if (!ownerUsername.trim()) ownerUsername = String(raw.username ?? "").trim();
  if (!ownerUsername.trim()) return null;
  let branchHeadCount = null;
  const bh = raw.branchHeads ?? raw.branch_heads;
  if (bh && typeof bh === "object" && !Array.isArray(bh)) {
    branchHeadCount = Object.keys(bh).length;
  }
  return {
    ...raw,
    repositoryId:
      raw.id ?? raw.repositoryId ?? raw.repository_id ?? null,
    ownerUsername: ownerUsername.trim(),
    repositoryName: repoName.trim(),
    ownerUserId: ownerObj?.id ?? raw.ownerUserId ?? raw.owner_id ?? null,
    visibility:
      raw.visibility ?? raw.repository_visibility ?? raw.visibilityType ?? "",
    description: typeof raw.description === "string" ? raw.description : "",
    cloneUrl: raw.cloneUrl ?? raw.clone_url ?? "",
    updatedAt:
      raw.updatedAt ??
      raw.updated_at ??
      raw.createdAt ??
      raw.created_at ??
      "",
    branchHeadCount,
  };
}

export async function vcListPullRequests(owner, repo) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.get(VC.REPO_PULLS(owner, repo));
    return unwrapListPayload(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(err, "Failed to load pull requests.");
  }
}

export async function vcCreatePullRequest(owner, repo, body) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.post(VC.REPO_PULLS(owner, repo), body);
    return data;
  } catch (err) {
    throwApiError(err, "Failed to create pull request.");
  }
}

export async function vcInviteRepositoryCollaborator(owner, repo, guest) {
  if (!owner || !repo || !guest) {
    throwClientApiError("Owner, repository, and guest are required.");
  }
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_INVITE(owner, repo, guest),
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to send repository invitation.");
  }
}

export async function vcListRepositoryInvitations(owner, repo) {
  if (!owner || !repo) {
    throwClientApiError("Owner and repository are required.");
  }
  try {
    const { data } = await axiosInstance.get(
      VC.REPO_INVITATIONS_FOR_REPO(owner, repo),
    );
    return Array.isArray(data) ? data : unwrapListPayload(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(err, "Failed to load repository invitations.");
  }
}

export async function vcAcceptRepositoryInvitation(invitationId, userId) {
  if (!invitationId || !userId) {
    throwClientApiError("Invitation id and user id are required.");
  }
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_INVITATION_ACCEPT(invitationId, userId),
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to accept repository invitation.");
  }
}

export async function vcRejectRepositoryInvitation(invitationId, userId) {
  if (!invitationId || !userId) {
    throwClientApiError("Invitation id and user id are required.");
  }
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_INVITATION_REJECT(invitationId, userId),
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to reject repository invitation.");
  }
}

/**
 * VC user activity timeline (`GET /api/v1/repos/:username/activity`).
 * Parsed client-side into pushes / pull requests / merges when `type` is absent.
 *
 * @param {string} username VC login / preferred username used by the gateway repos API
 * @param {{ limit?: number } & Record<string, string>} [params]
 * @returns {Promise<object[]>}
 */
export async function vcGetUserActivity(username, params = {}) {
  const u = String(username ?? "").trim();
  if (!u) return [];
  try {
    const { data } = await axiosInstance.get(VC.USER_ACTIVITY(u, params));
    return unwrapListPayload(data);
  } catch (err) {
    if ([404, 422].includes(err?.response?.status)) return [];
    throwApiError(
      err,
      "Failed to load repository activity.",
      "apiErrors.failed_to_load_repository",
    );
  }
}

export async function vcGetUserActivityForCandidates(usernames, params = {}) {
  const candidates = [
    ...new Set(
      (Array.isArray(usernames) ? usernames : [usernames])
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const seen = new Set();
  const allRows = [];
  for (const username of candidates) {
    const rows = await vcGetUserActivity(username, params);
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const key =
        row && typeof row === "object"
          ? [
              row.eventId,
              row.event_id,
              row.id,
              row.uuid,
              row.eventType ?? row.type,
              row.repositoryId ?? row.repositoryName ?? row.repo,
              row.occurredAt ?? row.timestamp ?? row.createdAt,
            ]
              .map((part) => String(part ?? "").trim())
              .join("|")
          : `${username}|${i}|${String(row)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allRows.push(row);
    }
  }
  return allRows;
}

export async function vcGetRepoTaskDashboard(owner, repo) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.get(VC.REPO_TASK_DASHBOARD(owner, repo));
    return data?.json ?? data?.data ?? data ?? {};
  } catch (err) {
    if (err?.response?.status === 404) return {};
    throwApiError(err, "Failed to load task dashboard.");
  }
}

export async function vcCreateRepoTask(owner, repo, username, body) {
  if (!owner || !repo || !username) {
    throwClientApiError("Owner, repository, and username are required.");
  }
  const payload = normalizeVcTaskCreateBody(body ?? {});
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_TASK_CREATE(owner, repo, username),
      payload,
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to create repository task.");
  }
}

export async function vcGetRepoTasks(owner, repo, params = {}) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.get(VC.REPO_TASKS(owner, repo, params));
    return unwrapListPayload(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(err, "Failed to load repository tasks.");
  }
}

export async function vcCreateRepoMilestone(owner, repo, body) {
  if (!owner || !repo) {
    throwClientApiError("Owner and repository are required.");
  }
  const payload = normalizeVcMilestoneBodyForCreate(body ?? {});
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_MILESTONE_CREATE(owner, repo),
      payload,
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to create repository milestone.");
  }
}

function coerceVcRepoMilestoneList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const milestoneKeys = [
    "milestones",
    "milestoneList",
    "milestoneResponses",
    "data",
    "results",
    "records",
    "items",
    "content",
  ];

  let list = namedListFromPayload(payload, milestoneKeys);
  if (!list.length && payload && typeof payload === "object") {
    const inner =
      payload.data ?? payload.result ?? payload.payload ?? null;
    if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
      list = namedListFromPayload(inner, milestoneKeys);
      if (!list.length) list = facultyListItems(inner);
      if (!list.length) list = unwrapListPayload(inner);
    }
  }
  if (!list.length) list = facultyListItems(payload);
  if (!list.length) list = unwrapListPayload(payload);
  return Array.isArray(list) ? list : [];
}

export async function vcGetRepoMilestones(owner, repo, params = {}) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.get(
      VC.REPO_MILESTONES(owner, repo, params),
    );
    return coerceVcRepoMilestoneList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(err, "Failed to load repository milestones.");
  }
}

export async function vcGetRepoMilestoneByNumber(owner, repo, milestoneNumber) {
  if (!owner || !repo || milestoneNumber == null || milestoneNumber === "") {
    throwClientApiError("Owner, repository, and milestone number are required.");
  }
  const numKey = String(milestoneNumber);
  try {
    const { data } = await axiosInstance.get(
      VC.REPO_MILESTONE_BY_NUMBER(owner, repo, numKey),
    );
    return data ?? null;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throwApiError(err, "Failed to load repository milestone.");
  }
}

export async function vcPatchRepoMilestone(owner, repo, milestoneNumber, body) {
  if (!owner || !repo || milestoneNumber == null || milestoneNumber === "") {
    throwClientApiError("Owner, repository, and milestone number are required.");
  }
  const numKey = String(milestoneNumber);
  const payload = normalizeVcMilestoneBodyForPatch(body ?? {});
  try {
    const { data } = await axiosInstance.patch(
      VC.REPO_MILESTONE_BY_NUMBER(owner, repo, numKey),
      payload,
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to update repository milestone.");
  }
}

export async function vcCloseRepoMilestone(owner, repo, milestoneNumber) {
  if (!owner || !repo || milestoneNumber == null || milestoneNumber === "") {
    throwClientApiError("Owner, repository, and milestone number are required.");
  }
  const numKey = String(milestoneNumber);
  try {
    const { data } = await axiosInstance.patch(
      VC.REPO_MILESTONE_MARK_CLOSED(owner, repo, numKey),
      {},
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to close repository milestone.");
  }
}

export async function vcReopenRepoMilestone(owner, repo, milestoneNumber) {
  if (!owner || !repo || milestoneNumber == null || milestoneNumber === "") {
    throwClientApiError("Owner, repository, and milestone number are required.");
  }
  const numKey = String(milestoneNumber);
  try {
    const { data } = await axiosInstance.patch(
      VC.REPO_MILESTONE_REOPEN(owner, repo, numKey),
      {},
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to reopen repository milestone.");
  }
}

function normalizeTasksListPayload(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  const inner =
    data?.content ?? data?.data ?? data?.items ?? data?.tasks ?? null;
  return Array.isArray(inner) ? inner : [];
}

/**
 * VC `TaskController` exposes list, not GET-by-number — resolve from `listTasks` result.
 */
export async function vcGetRepoTaskByNumber(owner, repo, taskNumber) {
  if (!owner || !repo || taskNumber == null || taskNumber === "") {
    throwClientApiError("Owner, repository, and task number are required.");
  }
  try {
    const { data } = await axiosInstance.get(VC.REPO_TASKS(owner, repo, {}));
    const list = normalizeTasksListPayload(data);
    return (
      list.find(
        (row) =>
          String(row?.number ?? "") === String(taskNumber) ||
          String(row?.id ?? "") === String(taskNumber),
      ) ?? null
    );
  } catch (err) {
    throwApiError(err, "Failed to load repository task.");
  }
}

export async function vcAssignRepoTask(
  owner,
  repo,
  taskNumber,
  actorUsername,
  assigneeUsername,
) {
  if (!owner || !repo || taskNumber == null || taskNumber === "") {
    throwClientApiError("Owner, repository, and task number are required.");
  }
  if (!actorUsername || !assigneeUsername) {
    throwClientApiError("Actor and assignee usernames are required.");
  }
  assertVcAssignUsernames(actorUsername, assigneeUsername);
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_TASK_ASSIGN(owner, repo, taskNumber, actorUsername, assigneeUsername),
      {},
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to assign repository task.");
  }
}

export async function vcSubmitRepoTask(owner, repo, taskNumber, body) {
  if (!owner || !repo || taskNumber == null || taskNumber === "") {
    throwClientApiError("Owner, repository, and task number are required.");
  }
  const payload = normalizeVcSubmissionBody(body ?? {});
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_TASK_SUBMIT(owner, repo, taskNumber),
      payload,
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to submit repository task.");
  }
}

export async function vcGetEligibleRepoTaskPullRequests(owner, repo, taskNumber) {
  if (!owner || !repo || taskNumber == null || taskNumber === "") {
    throwClientApiError("Owner, repository, and task number are required.");
  }
  try {
    const { data } = await axiosInstance.get(
      VC.REPO_TASK_ELIGIBLE_PULLS(owner, repo, taskNumber),
    );
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(err, "Failed to load eligible pull requests.");
  }
}

export async function vcReviewRepoTask(owner, repo, taskNumber, body) {
  if (!owner || !repo || taskNumber == null || taskNumber === "") {
    throwClientApiError("Owner, repository, and task number are required.");
  }
  const payload = normalizeVcReviewBody(body ?? {});
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_TASK_REVIEW(owner, repo, taskNumber),
      payload,
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to review repository task.");
  }
}

export async function vcCompleteRepoTask(owner, repo, taskNumber, body) {
  if (!owner || !repo || taskNumber == null || taskNumber === "") {
    throwClientApiError("Owner, repository, and task number are required.");
  }
  const payload = body && typeof body === "object" ? body : {};
  try {
    const { data } = await axiosInstance.post(
      VC.REPO_TASK_COMPLETE(owner, repo, taskNumber),
      payload,
    );
    return data;
  } catch (err) {
    throwApiError(err, "Failed to complete repository task.");
  }
}

export async function vcGetRepoStatistics(owner, repo) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.get(VC.REPO_STATISTICS(owner, repo));
    return data ?? {};
  } catch (err) {
    if (err?.response?.status === 404) return {};
    throwApiError(err, "Failed to load repository statistics.");
  }
}

function normalizeVcContributorRow(row) {
  if (row == null || row === "") return null;
  if (typeof row === "string") {
    const u = row.trim();
    return u
      ? { id: "", username: u, email: "", firstName: "", lastName: "" }
      : null;
  }
  if (typeof row !== "object") return null;
  /** Some backends nest `ContributorUser` under `user` / `account`. */
  const flat =
    row.user && typeof row.user === "object" ? { ...row, ...row.user } : row;
  const nested =
    flat.account && typeof flat.account === "object"
      ? { ...flat, ...flat.account }
      : flat;
  const username = String(
    nested.user_name ??
      nested.username ??
      nested.userName ??
      nested.login ??
      nested.loginName ??
      "",
  ).trim();
  if (!username) return null;
  return {
    id: nested.id != null ? String(nested.id) : "",
    username,
    email: String(nested.email ?? "").trim(),
    firstName: String(
      nested.first_name ?? nested.firstName ?? nested.givenName ?? "",
    ).trim(),
    lastName: String(
      nested.last_name ?? nested.lastName ?? nested.familyName ?? "",
    ).trim(),
  };
}

function coerceVcContributorsList(payload) {
  if (payload == null) return [];
  const fromArray = (arr) =>
    Array.isArray(arr)
      ? arr.map(normalizeVcContributorRow).filter(Boolean)
      : [];
  if (Array.isArray(payload)) return fromArray(payload);
  /** Spring-style list wrapper or camelCase/snake aliases */
  const candidates = [
    payload.contributors,
    payload.collaborators,
    payload.contributorUsers,
    payload.contributor_users,
    payload.users,
    payload.values,
    payload.results,
    payload.list,
    payload.body,
    payload.content,
    payload.data,
    payload.items,
    payload.elements,
  ];
  for (const chunk of candidates) {
    const list = fromArray(chunk);
    if (list.length) return list;
  }
  return [];
}

/** GET VC repository contributors (`ContributorUser` — assignee candidates). */
export async function vcGetRepoContributors(owner, repo) {
  if (!owner || !repo)
    throwClientApiError("Owner and repository are required.");
  try {
    const { data } = await axiosInstance.get(VC.REPO_CONTRIBUTORS(owner, repo));
    return coerceVcContributorsList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(err, "Failed to load repository contributors.");
  }
}

export async function getBatches() {
  try {
    const { data } = await axiosInstance.get(BATCH.GETALL);
    let list = facultyListItems(data);
    if (!list.length) {
      list = namedListFromPayload(data, [
        "batches",
        "batchList",
        "batchResponses",
        "data",
      ]);
    }
    if (!list.length) list = normalizeBatchesList(data);
    return list;
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load batches.",
      "apiErrors.failed_to_load_batches",
    );
  }
}

export async function getBatchById(id) {
  if (id == null || String(id).trim() === "") {
    throwClientApiError("Batch id is required.");
  }
  try {
    const { data } = await axiosInstance.get(BATCH.GETBYID(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load batch.",
      "apiErrors.failed_to_load_batch",
    );
  }
}

function normalizeBatchesList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.batches)) return payload.batches;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function createStudent(studentData) {
  try {
    const { data } = await axiosInstance.post(STUDENT.CREATE, studentData);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create student.",
      "apiErrors.failed_to_create_student",
    );
  }
}

export async function updateStudent(id, studentData) {
  try {
    const { data } = await axiosInstance.put(STUDENT.UPDATE(id), studentData);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update student.",
      "apiErrors.failed_to_update_student",
    );
  }
}

export async function deleteStudent(id) {
  try {
    await axiosInstance.delete(STUDENT.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete student.",
      "apiErrors.failed_to_delete_student",
    );
  }
}

/* ─── Teachers (faculty service) ───────────────────────────────────────────── */

function normalizeTeacherRecord(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const addr =
    typeof raw.address === "object" && raw.address != null ? raw.address : {};
  const deptNested =
    typeof raw.department === "object" && raw.department != null
      ? raw.department
      : null;
  let departmentLabel =
    (typeof raw.department === "string" ? raw.department : "") ||
    deptNested?.name ||
    deptNested?.faculty?.name ||
    "";
  let departmentId = raw.departmentId ?? raw.department_id ?? "";
  if (!departmentId && deptNested?.id != null)
    departmentId = String(deptNested.id);

  return {
    ...raw,
    id: raw.id ?? raw.teacherId ?? "",
    firstName: raw.firstName ?? raw.first_name ?? "",
    lastName: raw.lastName ?? raw.last_name ?? "",
    username: raw.userName ?? raw.username ?? raw.user_name ?? "",
    fatherName: raw.fatherName ?? raw.father_name ?? "",
    grandFatherName: raw.grandFatherName ?? raw.grand_father_name ?? "",
    dateOfBirth: toDateInputValue(raw.dateOfBirth ?? raw.date_of_birth),
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    role: raw.role ?? "TEACHER",
    educationRank: raw.educationRank ?? raw.education_rank ?? "",
    enrollmentDate: toDateInputValue(raw.enrollmentDate ?? raw.enrollment_date),
    keycloakId:
      raw.keycloakId ??
      raw.keycloak_id ??
      raw.keycloakUserId ??
      raw.keycloak_user_id ??
      raw.keycloakSubject ??
      raw.keycloak_subject ??
      raw.keycloak ??
      raw.realmUserId ??
      raw.realm_user_id ??
      "",
    linkedApplicationUserId: (() => {
      const u =
        raw.applicationUserId ??
        raw.application_user_id ??
        raw.gatewayUserId ??
        raw.gateway_user_id;
      if (u != null && String(u).trim() !== "") return String(u).trim();
      if (typeof raw.user === "object" && raw.user?.id != null)
        return String(raw.user.id);
      return "";
    })(),
    department:
      departmentLabel != null && String(departmentLabel).trim() !== ""
        ? String(departmentLabel)
        : "",
    departmentId: departmentId != null ? String(departmentId) : "",
    addressStreet: addr.street ?? raw.addressStreet ?? raw.address_street ?? "",
    addressCity: addr.city ?? raw.addressCity ?? "",
    addressPostalCode:
      addr.postalCode ??
      addr.postal_code ??
      addr.zipCode ??
      addr.zip_code ??
      addr.zip ??
      raw.addressPostalCode ??
      raw.postalCode ??
      raw.zipCode ??
      raw.zip ??
      "",
    addressProvince:
      addr.province ?? raw.addressProvince ?? raw.address_province ?? "",
    joined: toDateInputValue(raw.enrollmentDate ?? raw.enrollment_date),
    status: raw.status ? String(raw.status).toLowerCase() : "active",
  };
}

function normalizeTeachersList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload.map(normalizeTeacherRecord).filter(Boolean);
  }
  const nested =
    payload.content ??
    payload.teachers ??
    payload.items ??
    payload.data ??
    payload.records;
  if (Array.isArray(nested)) {
    return nested.map(normalizeTeacherRecord).filter(Boolean);
  }
  return [];
}

export function teacherEntityMatchesGatewayUser(gatewayUser, teacherNorm) {
  if (!gatewayUser || !teacherNorm?.id) return false;
  const gId =
    gatewayUser.id != null ? String(gatewayUser.id).trim() : "";
  const tk =
    teacherNorm.keycloakId != null
      ? String(teacherNorm.keycloakId).trim()
      : "";
  if (gId && tk && gId === tk) return true;
  const ta =
    teacherNorm.linkedApplicationUserId != null
      ? String(teacherNorm.linkedApplicationUserId).trim()
      : "";
  if (gId && ta && gId === ta) return true;
  const gun = normalizeLoginIdentifier(
    gatewayUser.username ?? gatewayUser.user_name ?? "",
  );
  const tun = normalizeLoginIdentifier(teacherNorm.username ?? "");
  if (gun && tun && gun === tun) return true;
  const ge = normalizeEmail(gatewayUser.email ?? "");
  const te = normalizeEmail(teacherNorm.email ?? "");
  return Boolean(ge && te && ge === te);
}

export async function getTeachers() {
  try {
    const { data } = await axiosInstance.get(TEACHER.GETALL);
    return normalizeTeachersList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load teachers.",
      "apiErrors.failed_to_load_teachers",
    );
  }
}

export async function searchTeachers(keyword = "") {
  const normalizedKeyword = String(keyword ?? "").trim();
  if (!normalizedKeyword) return [];

  try {
    const { data } = await axiosInstance.get(TEACHER.SEARCH(normalizedKeyword));
    return normalizeTeachersList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to search teachers.",
      "apiErrors.failed_to_load_teachers",
    );
  }
}

export async function getTeachersPage(query = {}) {
  try {
    const params = buildPageQueryBase(query);
    const qs = serializeSpringQueryParams(params);
    const url = qs ? `${TEACHER.GETALL}?${qs}` : TEACHER.GETALL;
    const { data } = await axiosInstance.get(url);
    return normalizeSpringPage(data, normalizeTeacherRecord);
  } catch (err) {
    if (err?.response?.status === 404) {
      return normalizeSpringPage(null, normalizeTeacherRecord);
    }
    throwApiError(
      err,
      "Failed to load teachers.",
      "apiErrors.failed_to_load_teachers",
    );
  }
}

export async function getTeacherById(id) {
  try {
    const { data } = await axiosInstance.get(TEACHER.GETBYID(id));
    return normalizeTeacherRecord(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load teacher.",
      "apiErrors.failed_to_load_teacher",
    );
  }
}

export async function fetchLinkedTeacherForGatewayUser(gatewayUser) {
  if (!gatewayUser) return null;
  const directTeacherId =
    gatewayUser.teacherId ??
    gatewayUser.teacher_id ??
    gatewayUser.facultyTeacherId ??
    gatewayUser.faculty_teacher_id ??
    gatewayUser.teacher?.id ??
    "";
  const directId = String(directTeacherId ?? "").trim();
  if (directId) {
    try {
      const row = await getTeacherById(directId);
      if (row?.id) return row;
    } catch {
      /* fall through to linked lookup */
    }
  }

  const uname = normalizeLoginIdentifier(
    gatewayUser.username ?? gatewayUser.user_name ?? "",
  );
  const email = normalizeEmail(gatewayUser.email ?? "");
  const searchTerms = [...new Set([uname, email].filter(Boolean))];

  for (const term of searchTerms) {
    try {
      const list = await searchTeachers(term);
      const row =
        list.find((teacher) =>
          teacherEntityMatchesGatewayUser(gatewayUser, teacher),
        ) ?? null;
      if (row?.id) return row;
    } catch {
      /* keep trying broader fallbacks */
    }
  }

  try {
    const page = await getTeachersPage({
      page: 0,
      size: 500,
    });
    const row =
      (page.content ?? []).find((teacher) =>
        teacherEntityMatchesGatewayUser(gatewayUser, teacher),
      ) ?? null;
    return row?.id ? row : null;
  } catch {
    return null;
  }
}

export async function createTeacher(body) {
  try {
    const { data } = await axiosInstance.post(TEACHER.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create teacher.",
      "apiErrors.failed_to_create_teacher",
    );
  }
}

export async function updateTeacher(id, body) {
  try {
    const { data } = await axiosInstance.put(TEACHER.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update teacher.",
      "apiErrors.failed_to_update_teacher",
    );
  }
}

export async function deleteTeacherRecord(id) {
  try {
    await axiosInstance.delete(TEACHER.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete teacher.",
      "apiErrors.failed_to_delete_teacher",
    );
  }
}

/* ─── Employees (faculty service) ─────────────────────────────────────────── */

function normalizeEmployeeRecord(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const addr =
    typeof raw.address === "object" && raw.address != null ? raw.address : {};
  const deptNested =
    typeof raw.department === "object" && raw.department != null
      ? raw.department
      : null;
  const facultyNested =
    typeof raw.faculty === "object" && raw.faculty != null ? raw.faculty : null;
  const departmentLabel =
    (typeof raw.department === "string" ? raw.department : "") ||
    deptNested?.name ||
    (typeof raw.faculty === "string" ? raw.faculty : "") ||
    facultyNested?.name ||
    (raw.departmentName ?? "");
  const facultyLabel =
    (typeof raw.faculty === "string" ? raw.faculty : "") ||
    facultyNested?.name ||
    "";
  const facultyId =
    raw.facultyId ??
    raw.faculty_id ??
    facultyNested?.id ??
    facultyNested?.facultyId ??
    "";

  return {
    ...raw,
    id: raw.id ?? raw.employeeId ?? "",
    firstName: raw.firstName ?? raw.first_name ?? "",
    lastName: raw.lastName ?? raw.last_name ?? "",
    username: raw.userName ?? raw.username ?? raw.user_name ?? "",
    fatherName: raw.fatherName ?? raw.father_name ?? "",
    grandFatherName: raw.grandFatherName ?? raw.grand_father_name ?? "",
    dateOfBirth: toDateInputValue(raw.dateOfBirth ?? raw.date_of_birth),
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    facultyId: facultyId != null ? String(facultyId) : "",
    faculty: facultyLabel ? String(facultyLabel) : "",
    department: departmentLabel ? String(departmentLabel) : "",
    role: raw.role ?? "EMPLOYEE",
    educationRank: raw.educationRank ?? raw.education_rank ?? "",
    facultyPosition: raw.facultyPosition ?? raw.faculty_position ?? "",
    hireDate: toDateInputValue(raw.hireDate ?? raw.hire_date),
    keycloakId:
      raw.keycloakId ??
      raw.keycloak_id ??
      raw.keycloakUserId ??
      raw.keycloak_user_id ??
      raw.keycloakSubject ??
      raw.keycloak_subject ??
      raw.keycloak ??
      raw.realmUserId ??
      raw.realm_user_id ??
      "",
    linkedApplicationUserId: (() => {
      const u =
        raw.applicationUserId ??
        raw.application_user_id ??
        raw.gatewayUserId ??
        raw.gateway_user_id;
      if (u != null && String(u).trim() !== "") return String(u).trim();
      if (typeof raw.user === "object" && raw.user?.id != null)
        return String(raw.user.id);
      return "";
    })(),
    addressStreet: addr.street ?? raw.addressStreet ?? raw.address_street ?? "",
    addressCity: addr.city ?? raw.addressCity ?? "",
    addressPostalCode:
      addr.postalCode ??
      addr.postal_code ??
      addr.zipCode ??
      addr.zip_code ??
      addr.zip ??
      raw.addressPostalCode ??
      raw.postalCode ??
      raw.zipCode ??
      raw.zip ??
      "",
    addressProvince:
      addr.province ?? raw.addressProvince ?? raw.address_province ?? "",
    joined: toDateInputValue(raw.hireDate ?? raw.hire_date),
    status: raw.status ? String(raw.status).toLowerCase() : "active",
  };
}

function normalizeEmployeesList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload.map(normalizeEmployeeRecord).filter(Boolean);
  }
  const nested =
    payload.content ??
    payload.employees ??
    payload.items ??
    payload.data ??
    payload.records;
  if (Array.isArray(nested)) {
    return nested.map(normalizeEmployeeRecord).filter(Boolean);
  }
  return [];
}

export async function getEmployees() {
  try {
    const { data } = await axiosInstance.get(EMPLOYEE.GETALL);
    return normalizeEmployeesList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load employees.",
      "apiErrors.failed_to_load_employees",
    );
  }
}

export async function searchEmployees(keyword = "") {
  const normalizedKeyword = String(keyword ?? "").trim();
  if (!normalizedKeyword) return [];

  try {
    const { data } = await axiosInstance.get(EMPLOYEE.SEARCH(normalizedKeyword));
    return normalizeEmployeesList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to search employees.",
      "apiErrors.failed_to_load_employees",
    );
  }
}

export async function getEmployeesPage(query = {}) {
  try {
    const params = buildPageQueryBase(query);
    const qs = serializeSpringQueryParams(params);
    const url = qs ? `${EMPLOYEE.GETALL}?${qs}` : EMPLOYEE.GETALL;
    const { data } = await axiosInstance.get(url);
    return normalizeSpringPage(data, normalizeEmployeeRecord);
  } catch (err) {
    if (err?.response?.status === 404) {
      return normalizeSpringPage(null, normalizeEmployeeRecord);
    }
    throwApiError(
      err,
      "Failed to load employees.",
      "apiErrors.failed_to_load_employees",
    );
  }
}

export async function getEmployeeById(id) {
  try {
    const { data } = await axiosInstance.get(EMPLOYEE.GETBYID(id));
    return normalizeEmployeeRecord(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load employee.",
      "apiErrors.failed_to_load_employee",
    );
  }
}

export async function createEmployee(body) {
  try {
    const { data } = await axiosInstance.post(EMPLOYEE.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create employee.",
      "apiErrors.failed_to_create_employee",
    );
  }
}

export async function updateEmployee(id, body) {
  try {
    const { data } = await axiosInstance.put(EMPLOYEE.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update employee.",
      "apiErrors.failed_to_update_employee",
    );
  }
}

export async function deleteEmployeeRecord(id) {
  try {
    await axiosInstance.delete(EMPLOYEE.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete employee.",
      "apiErrors.failed_to_delete_employee",
    );
  }
}

function normalizeDepartmentRecord(raw) {
  if (raw == null || typeof raw !== "object") return null;

  const headNested =
    typeof raw.head === "object" && raw.head !== null ? raw.head : null;
  const headOfDepartmentNested =
    typeof raw.headOfDepartment === "object" && raw.headOfDepartment !== null
      ? raw.headOfDepartment
      : null;
  const facultyNested =
    typeof raw.faculty === "object" && raw.faculty !== null ? raw.faculty : null;

  const statusRaw = raw.status ?? raw.state ?? raw.departmentStatus ?? "";
  const pickLikelyDate = (...values) => {
    for (const value of values) {
      if (value == null || value === "") continue;
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return value;
    }
    return null;
  };
  const createdRaw = pickLikelyDate(
    raw.created,
    raw.createdAt,
    raw.created_at,
    raw.createdDate,
    raw.created_date,
    raw.creationDate,
  );
  const updatedRaw = pickLikelyDate(
    raw.updatedAt,
    raw.updateAt,
    raw.updated_at,
    raw.updatedDate,
    raw.updated_date,
  );
  const headFirstName =
    headOfDepartmentNested?.firstName ??
    headNested?.firstName ??
    raw.headFirstName ??
    raw.head_first_name ??
    "";
  const headLastName =
    headOfDepartmentNested?.lastName ??
    headNested?.lastName ??
    raw.headLastName ??
    raw.head_last_name ??
    "";
  const headFullName = [headFirstName, headLastName].filter(Boolean).join(" ").trim();
  const facultyId =
    raw.facultyId ??
    raw.faculty_id ??
    facultyNested?.id ??
    facultyNested?.facultyId ??
    "";

  return {
    ...raw,
    id: raw.id ?? raw.departmentId ?? raw.department_id ?? raw.uuid ?? "",
    code: raw.code ?? raw.departmentCode ?? raw.department_code ?? "",
    name:
      raw.name ??
      raw.title ??
      raw.departmentName ??
      raw.department_name ??
      "",
    field: raw.field ?? raw.focusArea ?? raw.departmentField ?? "",
    description: raw.description ?? raw.summary ?? "",
    email: raw.email ?? facultyNested?.email ?? "",
    phone: raw.phone ?? facultyNested?.phone ?? "",
    shortName:
      raw.shortName ??
      raw.short_name ??
      raw.abbreviation ??
      raw.alias ??
      "",
    head:
      headFullName ||
      (typeof raw.head === "string" ? raw.head : "") ||
      (typeof raw.headOfDepartment === "string" ? raw.headOfDepartment : "") ||
      headOfDepartmentNested?.name ||
      headOfDepartmentNested?.fullName ||
      headNested?.email ||
      headNested?.name ||
      headNested?.fullName ||
      raw.headEmail ||
      raw.headName ||
      raw.head_name ||
      raw.dean ||
      raw.deanEmail ||
      "",
    status:
      typeof statusRaw === "string" && statusRaw.trim() !== ""
        ? statusRaw.trim().toLowerCase()
        : "inactive",
    created: createdRaw,
    updatedAt: updatedRaw,
    facultyId: facultyId != null ? String(facultyId) : "",
    faculty: facultyNested,
    facultyName:
      raw.facultyName ??
      raw.faculty_name ??
      facultyNested?.name ??
      facultyNested?.title ??
      "",
    headOfDepartment: headOfDepartmentNested,
    headOfDepartmentId:
      raw.headOfDepartmentId ??
      raw.head_of_department_id ??
      headOfDepartmentNested?.id ??
      headNested?.id ??
      "",
    headEmail:
      headOfDepartmentNested?.email ??
      headNested?.email ??
      raw.headEmail ??
      "",
    headPhone:
      headOfDepartmentNested?.phone ??
      headNested?.phone ??
      raw.headPhone ??
      "",
    headFacultyPosition:
      headOfDepartmentNested?.facultyPosition ??
      headNested?.facultyPosition ??
      "",
    headEducationRank:
      headOfDepartmentNested?.educationRank ??
      headNested?.educationRank ??
      "",
  };
}

function normalizeFacultyRecord(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const id = raw.id ?? raw.facultyId ?? raw.faculty_id ?? raw.uuid ?? "";
  const name =
    raw.name ??
    raw.title ??
    raw.facultyName ??
    raw.faculty_name ??
    raw.displayName ??
    "";

  return {
    ...raw,
    id,
    name: String(name || id || ""),
    code: raw.code ?? raw.facultyCode ?? raw.faculty_code ?? "",
    establishDate: toDateInputValue(
      raw.establishDate ?? raw.establishedDate ?? raw.establish_date,
    ),
    description: raw.description ?? raw.summary ?? "",
    university: raw.university ?? raw.universityName ?? raw.university_name ?? "",
    deanOfFaculty:
      raw.deanOfFaculty ??
      raw.dean_of_faculty ??
      raw.dean ??
      raw.head ??
      "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    shortName:
      raw.shortName ??
      raw.short_name ??
      raw.abbreviation ??
      raw.alias ??
      "",
  };
}

function normalizeFacultiesList(payload) {
  return facultyListItems(payload).map(normalizeFacultyRecord).filter(Boolean);
}

function normalizeUniversityRecord(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const name = raw.trim();
    return name ? { id: name, name } : null;
  }
  if (typeof raw !== "object") return null;
  const id = raw.id ?? raw.universityId ?? raw.uuid ?? raw.code ?? raw.name ?? "";
  const name =
    raw.name ??
    raw.title ??
    raw.universityName ??
    raw.university_name ??
    raw.displayName ??
    "";
  const label = String(name || id || "").trim();
  if (!label) return null;
  return {
    ...raw,
    id,
    name: label,
    code: raw.code ?? raw.universityCode ?? raw.university_code ?? "",
  };
}

function normalizeUniversitiesList(payload) {
  return facultyListItems(payload).map(normalizeUniversityRecord).filter(Boolean);
}

export async function getFaculties() {
  try {
    const { data } = await axiosInstance.get(FACULTY.GETALL);
    return normalizeFacultiesList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load faculties.",
      "apiErrors.failed_to_load_faculties",
    );
  }
}

export async function searchStudents(keyword = "") {
  const normalizedKeyword = String(keyword ?? "").trim();
  if (!normalizedKeyword) return [];

  try {
    const { data } = await axiosInstance.get(STUDENT.SEARCH(normalizedKeyword));
    return normalizeStudentsList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to search students.",
      "apiErrors.failed_to_load_students",
    );
  }
}

export async function getFacultyById(id) {
  try {
    const { data } = await axiosInstance.get(FACULTY.GETBYID(id));
    return normalizeFacultyRecord(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load faculty.",
      "apiErrors.failed_to_load_faculties",
    );
  }
}

export async function createFaculty(body) {
  try {
    const { data } = await axiosInstance.post(FACULTY.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(err, "Failed to create faculty.");
  }
}

export async function updateFaculty(id, body) {
  try {
    const { data } = await axiosInstance.put(FACULTY.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(err, "Failed to update faculty.");
  }
}

export async function deleteFaculty(id) {
  try {
    await axiosInstance.delete(FACULTY.DELETE(id));
  } catch (err) {
    throwApiError(err, "Failed to delete faculty.");
  }
}

function normalizeDepartmentsList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.map(normalizeDepartmentRecord).filter(Boolean);
  }
  if (typeof payload !== "object") return [];

  const nested =
    payload.content ??
    payload.departments ??
    payload.items ??
    payload.data ??
    payload.records ??
    payload.results;

  if (Array.isArray(nested)) {
    return nested.map(normalizeDepartmentRecord).filter(Boolean);
  }

  return [];
}

export async function getDepartments() {
  try {
    const { data } = await axiosInstance.get(DEPARTMENT.GETALL);
    return normalizeDepartmentsList(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load departments.",
      "apiErrors.failed_to_load_departments",
    );
  }
}

export async function getDepartmentById(id) {
  try {
    const { data } = await axiosInstance.get(DEPARTMENT.GETBYID(id));
    return normalizeDepartmentRecord(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load department.",
      "apiErrors.failed_to_load_department",
    );
  }
}

export async function createDepartment(departmentData) {
  try {
    const { data } = await axiosInstance.post(
      DEPARTMENT.CREATE,
      departmentData,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create department.",
      "apiErrors.failed_to_create_department",
    );
  }
}

export async function updateDepartment(id, departmentData) {
  try {
    const { data } = await axiosInstance.put(
      DEPARTMENT.UPDATE(id),
      departmentData,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update department.",
      "apiErrors.failed_to_update_department",
    );
  }
}

export async function deleteDepartment(id) {
  try {
    await axiosInstance.delete(DEPARTMENT.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete department.",
      "apiErrors.failed_to_delete_department",
    );
  }
}

/* ─── Academic year (`/api/academic-year`) ───────────────────────────────── */

export async function getAcademicYears(query = {}) {
  try {
    const { data } = await axiosInstance.get(ACADEMIC_YEAR.LIST(query));
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load academic years.",
      "apiErrors.failed_to_load_academic_years",
    );
  }
}

export async function getAcademicYearById(id) {
  if (id == null || String(id).trim() === "") {
    throwClientApiError("Academic year id is required.");
  }
  try {
    const { data } = await axiosInstance.get(ACADEMIC_YEAR.BY_ID(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load academic year.",
      "apiErrors.failed_to_load_academic_year",
    );
  }
}

export async function createAcademicYear(body) {
  try {
    const { data } = await axiosInstance.post(ACADEMIC_YEAR.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create academic year.",
      "apiErrors.failed_to_create_academic_year",
    );
  }
}

export async function updateAcademicYear(id, body) {
  try {
    const { data } = await axiosInstance.put(ACADEMIC_YEAR.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update academic year.",
      "apiErrors.failed_to_update_academic_year",
    );
  }
}

export async function deleteAcademicYear(id) {
  try {
    await axiosInstance.delete(ACADEMIC_YEAR.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete academic year.",
      "apiErrors.failed_to_delete_academic_year",
    );
  }
}

/* ─── Semester (`/api/semester`) ───────────────────────────────────────────── */

export async function getSemesters(query = {}) {
  try {
    const { data } = await axiosInstance.get(SEMESTER.LIST(query));
    let list = facultyListItems(data);
    if (!list.length) {
      list = namedListFromPayload(data, [
        "semesters",
        "semesterList",
        "semesterResponses",
        "data",
      ]);
    }
    return list;
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load semesters.",
      "apiErrors.failed_to_load_semesters",
    );
  }
}

export async function getSemesterById(id) {
  try {
    const { data } = await axiosInstance.get(SEMESTER.BY_ID(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load semester.",
      "apiErrors.failed_to_load_semester",
    );
  }
}

export async function getSemestersByAcademicYearId(academicYearId) {
  if (academicYearId == null || String(academicYearId).trim() === "")
    return [];
  const id = String(academicYearId).trim();
  try {
    const { data } = await axiosInstance.get(
      SEMESTER.BY_ACADEMIC_YEAR(id),
    );
    const list = facultyListItems(data);
    if (list.length) return list;

    const allSemesters = await getSemesters();
    return allSemesters.filter((semester) => {
      const academicYear = semester?.academicYear;
      const candidate =
        semester?.academicYearId ??
        semester?.academic_year_id ??
        academicYear?.id ??
        academicYear?.academicYearId ??
        "";
      return String(candidate).trim() === id;
    });
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load semesters for academic year.",
      "apiErrors.failed_to_load_semesters",
    );
  }
}

export async function searchRepositories(keyword = "") {
  const k = String(keyword ?? "").trim();
  if (!k) return [];
  try {
    const { data } = await axiosInstance.get(REPOSITORY.SEARCH(k));
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to search repositories.",
      "apiErrors.failed_to_search_repositories",
    );
  }
}

export async function createSemester(body) {
  try {
    const { data } = await axiosInstance.post(SEMESTER.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create semester.",
      "apiErrors.failed_to_create_semester",
    );
  }
}

export async function updateSemester(id, body) {
  try {
    const { data } = await axiosInstance.put(SEMESTER.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update semester.",
      "apiErrors.failed_to_update_semester",
    );
  }
}

export async function deleteSemester(id) {
  try {
    await axiosInstance.delete(SEMESTER.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete semester.",
      "apiErrors.failed_to_delete_semester",
    );
  }
}

/* ─── Faculty project (`/api/project`) ────────────────────────────────────── */

export async function getFacultyProjects(query = {}, requestConfig = {}) {
  try {
    const { data } = await axiosInstance.get(
      FACULTY_PROJECT.LIST(query),
      requestConfig,
    );
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load projects.",
      "apiErrors.failed_to_load_faculty_projects",
    );
  }
}

export async function getUniversities() {
  try {
    const { data } = await axiosInstance.get(UNIVERSITY.GETALL);
    return normalizeUniversitiesList(data);
  } catch (err) {
    if ([404, 501].includes(err?.response?.status)) return [];
    throwApiError(
      err,
      "Failed to load universities.",
      "apiErrors.failed_to_load_universities",
    );
  }
}

export async function getPublishedFacultyProjects(query = {}, requestConfig = {}) {
  try {
    const { data } = await axiosInstance.get(
      FACULTY_PROJECT.PUBLIC_LIST(query),
      requestConfig,
    );
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load published projects.",
      "apiErrors.failed_to_load_faculty_projects",
    );
  }
}

export async function getFacultyProjectById(id) {
  try {
    const { data } = await axiosInstance.get(FACULTY_PROJECT.BY_ID(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load project.",
      "apiErrors.failed_to_load_faculty_project",
    );
  }
}

export async function getPublishedFacultyProjectById(id, requestConfig = {}) {
  try {
    const { data } = await axiosInstance.get(
      FACULTY_PROJECT.PUBLIC_BY_ID(id),
      requestConfig,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load published project.",
      "apiErrors.failed_to_load_faculty_project",
    );
  }
}

export function getPublishedFacultyProjectDownloadUrl(id) {
  return FACULTY_PROJECT.PUBLIC_DOWNLOAD(id);
}

export async function getFacultyProjectByStudentId(id, studentId) {
  try {
    const { data } = await axiosInstance.get(
      FACULTY_PROJECT.BY_ID_AND_STUDENT(id, studentId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load project.",
      "apiErrors.failed_to_load_faculty_project",
    );
  }
}

export async function getFacultyProjectByTeacherId(id, teacherId) {
  try {
    const { data } = await axiosInstance.get(
      FACULTY_PROJECT.BY_ID_AND_TEACHER(id, teacherId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load project.",
      "apiErrors.failed_to_load_faculty_project",
    );
  }
}

export async function getFacultyProjectsByStudentId(studentId) {
  try {
    const { data } = await axiosInstance.get(FACULTY_PROJECT.BY_STUDENT(studentId));
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load projects.",
      "apiErrors.failed_to_load_faculty_projects",
    );
  }
}

export async function getFacultyProjectsByTeacherId(teacherId) {
  try {
    const { data } = await axiosInstance.get(FACULTY_PROJECT.BY_TEACHER(teacherId));
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load projects.",
      "apiErrors.failed_to_load_faculty_projects",
    );
  }
}

export async function findFacultyProjectByTeacherAndStudent(
  teacherId,
  studentId,
) {
  try {
    const { data } = await axiosInstance.get(
      FACULTY_PROJECT.BY_TEACHER_AND_STUDENT(teacherId, studentId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load project.",
      "apiErrors.failed_to_load_faculty_project",
    );
  }
}

export async function createFacultyProject(body) {
  try {
    const { data } = await axiosInstance.post(FACULTY_PROJECT.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create project.",
      "apiErrors.failed_to_create_faculty_project",
    );
  }
}

export async function updateFacultyProject(id, body) {
  try {
    const { data } = await axiosInstance.put(FACULTY_PROJECT.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update project.",
      "apiErrors.failed_to_update_faculty_project",
    );
  }
}

export async function updateFacultyProjectPublicResult(id, body) {
  try {
    const { data } = await axiosInstance.patch(
      FACULTY_PROJECT.PUBLIC_RESULT(id),
      body,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update project public result.",
      "apiErrors.failed_to_update_faculty_project",
    );
  }
}

export async function completeFacultyProject(id) {
  try {
    const { data } = await axiosInstance.patch(FACULTY_PROJECT.COMPLETE(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to mark project as completed.",
      "apiErrors.failed_to_update_faculty_project",
    );
  }
}

export async function publishFacultyProject(id) {
  try {
    const { data } = await axiosInstance.patch(FACULTY_PROJECT.PUBLISH(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to publish project.",
      "apiErrors.failed_to_update_faculty_project",
    );
  }
}

export async function unpublishFacultyProject(id) {
  try {
    const { data } = await axiosInstance.patch(FACULTY_PROJECT.UNPUBLISH(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to unpublish project.",
      "apiErrors.failed_to_update_faculty_project",
    );
  }
}

export async function inviteFacultyProjectMembers(id, body) {
  try {
    const { data } = await axiosInstance.request({
      url: FACULTY_PROJECT.INVITE(id),
      method: "GET",
      data: body,
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to invite project members.",
      "apiErrors.failed_to_update_faculty_project",
    );
  }
}

export async function deleteFacultyProject(id) {
  try {
    await axiosInstance.delete(FACULTY_PROJECT.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete project.",
      "apiErrors.failed_to_delete_faculty_project",
    );
  }
}

/* ─── Faculty group (`/api/group`) ─────────────────────────────────────────── */

export async function getFacultyGroups(query = {}) {
  try {
    const { data } = await axiosInstance.get(FACULTY_GROUP.LIST(query));
    return facultyListItems(data);
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throwApiError(
      err,
      "Failed to load groups.",
      "apiErrors.failed_to_load_faculty_groups",
    );
  }
}

export async function getFacultyGroupById(id) {
  try {
    const { data } = await axiosInstance.get(FACULTY_GROUP.BY_ID(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load group.",
      "apiErrors.failed_to_load_faculty_group",
    );
  }
}

export async function createFacultyGroup(body) {
  try {
    const { data } = await axiosInstance.post(FACULTY_GROUP.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create group.",
      "apiErrors.failed_to_create_faculty_group",
    );
  }
}

export async function updateFacultyGroup(id, body) {
  try {
    const { data } = await axiosInstance.put(FACULTY_GROUP.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update group.",
      "apiErrors.failed_to_update_faculty_group",
    );
  }
}

export async function updateFacultyGroupLeader(id, leaderId) {
  try {
    const { data } = await axiosInstance.put(
      FACULTY_GROUP.UPDATE_LEADER(id, leaderId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update group leader.",
      "apiErrors.failed_to_update_faculty_group",
    );
  }
}

export async function removeFacultyGroupMember(id, studentId) {
  try {
    const { data } = await axiosInstance.delete(
      FACULTY_GROUP.REMOVE_MEMBER(id, studentId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to remove group member.",
      "apiErrors.failed_to_update_faculty_group",
    );
  }
}

export async function deleteFacultyGroup(id) {
  try {
    await axiosInstance.delete(FACULTY_GROUP.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete group.",
      "apiErrors.failed_to_delete_faculty_group",
    );
  }
}

/* ─── Batch CUD (`/api/batch`) — read helpers exist above ──────────────────── */

export async function createBatch(body) {
  try {
    const { data } = await axiosInstance.post(BATCH.CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create batch.",
      "apiErrors.failed_to_create_batch",
    );
  }
}

export async function updateBatch(id, body) {
  try {
    const { data } = await axiosInstance.put(BATCH.UPDATE(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update batch.",
      "apiErrors.failed_to_update_batch",
    );
  }
}

export async function deleteBatch(id) {
  try {
    await axiosInstance.delete(BATCH.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete batch.",
      "apiErrors.failed_to_delete_batch",
    );
  }
}

export async function forgotPassword(email) {
  if (!email) {
    throwClientApiError(
      "Email is required.",
      "apiErrors.validation.emailRequired",
    );
  }

  try {
    const { data } = await axiosInstance.post(AUTH.FORGOT_PASSWORD, {
      email,
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Forgot password request failed.",
      "apiErrors.forgot_password_request_failed",
    );
  }
}

export async function resetPassword(formData) {
  const { reset_token, new_password, confirm_password } = formData;
  if (!reset_token || !new_password || new_password !== confirm_password) {
    throwClientApiError(
      "Invalid reset token or passwords do not match.",
      "apiErrors.validation.invalidResetTokenOrPasswordMismatch",
    );
  }

  try {
    const { data } = await axiosInstance.post(AUTH.RESET_PASSWORD, formData);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Password reset failed.",
      "apiErrors.password_reset_failed",
    );
  }
}

export async function verifyEmail(payload) {
  const email = normalizeEmail(payload?.email);
  const otp_code = String(payload?.otp_code ?? payload?.otpCode ?? "").trim();
  const verification_token = String(payload?.verification_token ?? "").trim();
  if (!verification_token && (!email || !otp_code)) {
    throwClientApiError(
      "Email and verification code are required.",
      "apiErrors.validation.verificationTokenRequired",
    );
  }

  try {
    const body = verification_token ? { verification_token } : { email, otp_code };
    const { data } = await axiosInstance.post(AUTH.VERIFY_EMAIL, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Email verification failed.",
      "apiErrors.email_verification_failed",
    );
  }
}

export async function resendVerificationEmail(email) {
  if (!email) {
    throwClientApiError(
      "Email is required.",
      "apiErrors.validation.emailRequired",
    );
  }

  try {
    const { data } = await axiosInstance.post(AUTH.RESEND_VERIFICATION, {
      email,
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Resend verification failed.",
      "apiErrors.resend_verification_failed",
    );
  }
}

export async function changePassword(userId, formData) {
  const { current_password, new_password, confirm_password } = formData;
  if (!current_password || !new_password || new_password !== confirm_password) {
    throwClientApiError(
      "Invalid passwords.",
      "apiErrors.validation.invalidPasswords",
    );
  }

  try {
    const { data } = await axiosInstance.post(
      AUTH.CHANGE_PASSWORD(userId),
      formData,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Change password failed.",
      "apiErrors.change_password_failed",
    );
  }
}

/* ─── Users ───────────────────────────────────────────────────────────────── */

export async function listUsers(params = {}) {
  try {
    const { data } = await axiosInstance.get(USERS.LIST(params));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load users.",
      "apiErrors.failed_to_load_users",
    );
  }
}

export async function searchUsers(search) {
  try {
    const { data } = await axiosInstance.get(USERS.SEARCH(search || ""));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to search users.",
      "apiErrors.failed_to_search_users",
    );
  }
}

export async function createUser(body) {
  try {
    const { data } = await axiosInstance.post(USERS.CREATE(), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create user.",
      "apiErrors.failed_to_create_user",
    );
  }
}

export async function getUserById(id) {
  try {
    const { data } = await axiosInstance.get(USERS.BY_ID(id));
    return data;
  } catch (err) {
    throwApiError(err, "Failed to load user.", "apiErrors.failed_to_load_user");
  }
}

export async function updateUser(id, body) {
  try {
    const { data } = await axiosInstance.put(USERS.BY_ID(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update user.",
      "apiErrors.failed_to_update_user",
    );
  }
}

export async function deleteUser(id) {
  try {
    await axiosInstance.delete(USERS.BY_ID(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete user.",
      "apiErrors.failed_to_delete_user",
    );
  }
}

export async function getUserByUsername(username) {
  try {
    const { data } = await axiosInstance.get(USERS.BY_USERNAME(username));
    return data;
  } catch (err) {
    throwApiError(err, "Failed to load user.", "apiErrors.failed_to_load_user");
  }
}

export async function getUserByEmail(email) {
  try {
    const { data } = await axiosInstance.get(USERS.BY_EMAIL(email));
    return data;
  } catch (err) {
    throwApiError(err, "Failed to load user.", "apiErrors.failed_to_load_user");
  }
}

export async function getUserAuthorProfile(id) {
  try {
    const { data } = await axiosInstance.get(USERS.AUTHOR(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load author profile.",
      "apiErrors.failed_to_load_author_profile",
    );
  }
}

export async function getUserContributorProfile(id) {
  try {
    const { data } = await axiosInstance.get(USERS.CONTRIBUTOR(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load contributor.",
      "apiErrors.failed_to_load_contributor",
    );
  }
}

export async function addRoleToUser(id, roleName) {
  try {
    const { data } = await axiosInstance.post(USERS.WITH_ROLE(id, roleName));
    return data;
  } catch (err) {
    throwApiError(err, "Failed to add role.", "apiErrors.failed_to_add_role");
  }
}

export async function suspendUser(id) {
  try {
    const { data } = await axiosInstance.post(USERS.SUSPEND(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to suspend user.",
      "apiErrors.failed_to_suspend_user",
    );
  }
}

export async function activateUser(id) {
  try {
    const { data } = await axiosInstance.post(USERS.ACTIVATE(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to activate user.",
      "apiErrors.failed_to_activate_user",
    );
  }
}

export async function lockUser(id, durationMinutes = 30) {
  try {
    const { data } = await axiosInstance.post(USERS.LOCK(id, durationMinutes));
    return data;
  } catch (err) {
    throwApiError(err, "Failed to lock user.", "apiErrors.failed_to_lock_user");
  }
}

export async function verifyUserEmailByAdmin(id) {
  try {
    const { data } = await axiosInstance.post(USERS.VERIFY_EMAIL(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to verify email.",
      "apiErrors.failed_to_verify_email",
    );
  }
}

export async function postUsersStatsCount(body = {}) {
  try {
    const { data } = await axiosInstance.post(USERS.STATS_COUNT(), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load user statistics.",
      "apiErrors.failed_to_load_user_statistics",
    );
  }
}

/* ─── Roles ───────────────────────────────────────────────────────────────── */

export async function listRoles() {
  try {
    const { data } = await axiosInstance.get(ROLES.LIST());
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load roles.",
      "apiErrors.failed_to_load_roles",
    );
  }
}

export async function createRole(body) {
  try {
    const { data } = await axiosInstance.post(ROLES.CREATE(), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create role.",
      "apiErrors.failed_to_create_role",
    );
  }
}

export async function updateRole(roleName, body) {
  try {
    const { data } = await axiosInstance.put(ROLES.BY_NAME(roleName), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update role.",
      "apiErrors.failed_to_update_role",
    );
  }
}

export async function deleteRole(roleName) {
  try {
    await axiosInstance.delete(ROLES.BY_NAME(roleName));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete role.",
      "apiErrors.failed_to_delete_role",
    );
  }
}

export async function getRolesStatsCount() {
  try {
    const { data } = await axiosInstance.get(ROLES.STATS_COUNT());
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load role statistics.",
      "apiErrors.failed_to_load_role_statistics",
    );
  }
}

export async function assignRoleToUser(roleName, userId) {
  try {
    const { data } = await axiosInstance.post(ROLES.ASSIGN(roleName, userId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to assign role.",
      "apiErrors.failed_to_assign_role",
    );
  }
}

export async function removeRoleFromUser(roleName, userId) {
  try {
    const { data } = await axiosInstance.delete(ROLES.REMOVE(roleName, userId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to remove role.",
      "apiErrors.failed_to_remove_role",
    );
  }
}

/* ─── Permissions ─────────────────────────────────────────────────────────── */

export async function createPermission(body) {
  try {
    const { data } = await axiosInstance.post(PERMISSIONS.CREATE(), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create permission.",
      "apiErrors.failed_to_create_permission",
    );
  }
}

export async function getPermissionsByClient(clientId) {
  try {
    const { data } = await axiosInstance.get(PERMISSIONS.BY_CLIENT(clientId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load permissions.",
      "apiErrors.failed_to_load_permissions",
    );
  }
}

export async function assignPermissionRoleToUser(clientId, roleName, userId) {
  try {
    const { data } = await axiosInstance.post(
      PERMISSIONS.ASSIGN(clientId, roleName, userId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to assign permission.",
      "apiErrors.failed_to_assign_permission",
    );
  }
}

export async function removePermissionRoleFromUser(clientId, roleName, userId) {
  try {
    const { data } = await axiosInstance.delete(
      PERMISSIONS.REMOVE(clientId, roleName, userId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to remove permission.",
      "apiErrors.failed_to_remove_permission",
    );
  }
}

export async function deleteClientRoleBundle(clientId, roleName) {
  try {
    await axiosInstance.delete(PERMISSIONS.DELETE_ROLE(clientId, roleName));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete client role.",
      "apiErrors.failed_to_delete_client_role",
    );
  }
}

export async function getPermissionClientStats(clientId) {
  try {
    const { data } = await axiosInstance.get(PERMISSIONS.STATS(clientId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load permission stats.",
      "apiErrors.failed_to_load_permission_stats",
    );
  }
}

/* ─── Blog articles & engagement ──────────────────────────────────────────── */

export async function getArticles(params = {}, requestConfig = {}) {
  try {
    const { data } = await axiosInstance.get(BLOG.ARTICLES(params), requestConfig);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load articles.",
      "apiErrors.failed_to_load_articles",
    );
  }
}

export async function getAdminArticles(params = {}, requestConfig = {}) {
  try {
    const { data } = await axiosInstance.get(
      BLOG.ADMIN_ARTICLES(params),
      requestConfig,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load admin articles.",
      "apiErrors.failed_to_load_articles",
    );
  }
}

export async function getPublicArticles(params = {}) {
  try {
    const { data } = await axiosInstance.get(BLOG.PUBLIC_ARTICLES(params), {
      skipAuthToken: true,
      skipAuthRedirect: true,
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load articles.",
      "apiErrors.failed_to_load_articles",
    );
  }
}

export async function getArticleById(articleId, requestConfig = {}) {
  try {
    const { data } = await axiosInstance.get(
      BLOG.ARTICLE_BY_ID(articleId),
      requestConfig,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load article.",
      "apiErrors.failed_to_load_article",
    );
  }
}

export async function getPublicArticleById(articleId) {
  try {
    const { data } = await axiosInstance.get(
      BLOG.PUBLIC_ARTICLE_BY_ID(articleId),
      {
        skipAuthToken: true,
        skipAuthRedirect: true,
      },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load article.",
      "apiErrors.failed_to_load_article",
    );
  }
}

export async function createArticleForUser(userId, body) {
  try {
    const { data } = await axiosInstance.post(
      BLOG.CREATE_FOR_USER(userId),
      body,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create article.",
      "apiErrors.failed_to_create_article",
    );
  }
}

export async function createDraftForUser(userId, body) {
  try {
    const { data } = await axiosInstance.post(
      BLOG.DRAFT_FOR_USER(userId),
      body,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to save draft.",
      "apiErrors.failed_to_save_draft",
    );
  }
}

export async function createArticleWithMultipart(authorUserId, formData) {
  try {
    const { data } = await axiosInstance.post(
      BLOG.WITH_FILES_AUTHOR(authorUserId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create article with files.",
      "apiErrors.failed_to_create_article_with_files",
    );
  }
}

export async function updateArticleJson(articleId, authorId, body) {
  try {
    const { data } = await axiosInstance.put(
      BLOG.UPDATE_JSON(articleId, authorId),
      body,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update article.",
      "apiErrors.failed_to_update_article",
    );
  }
}

export async function updateArticleWithFile(articleId, authorId, formData) {
  try {
    const { data } = await axiosInstance.put(
      BLOG.UPDATE_WITH_FILE(articleId, authorId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to update article.",
      "apiErrors.failed_to_update_article",
    );
  }
}

export async function publishArticle(articleId, authorId, body) {
  try {
    const { data } = await axiosInstance.patch(
      BLOG.PUBLISH(articleId, authorId),
      body,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to publish article.",
      "apiErrors.failed_to_publish_article",
    );
  }
}

export async function deleteArticle(articleId, authorId) {
  try {
    await axiosInstance.delete(BLOG.DELETE(articleId, authorId));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete article.",
      "apiErrors.failed_to_delete_article",
    );
  }
}

export async function getArticlesByAuthor(authorId, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      BLOG.ARTICLES_BY_AUTHOR(authorId, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load author articles.",
      "apiErrors.failed_to_load_author_articles",
    );
  }
}

export async function getPublishedArticlesByAuthor(authorId, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      BLOG.AUTHORS_PUBLISHED(authorId, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load published articles.",
      "apiErrors.failed_to_load_published_articles",
    );
  }
}

export async function getAuthorArticleDetail(authorId, articleId) {
  try {
    const { data } = await axiosInstance.get(
      BLOG.AUTHOR_ARTICLE(authorId, articleId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load article.",
      "apiErrors.failed_to_load_article",
    );
  }
}

export async function postArticleComment(articleId, body) {
  try {
    const { data } = await axiosInstance.post(BLOG.COMMENTS(articleId), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to post comment.",
      "apiErrors.failed_to_post_comment",
    );
  }
}

export async function getArticleComments(articleId, params = {}) {
  try {
    const { data } = await axiosInstance.get(BLOG.COMMENTS(articleId, params));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load comments.",
      "apiErrors.failed_to_load_comments",
    );
  }
}

export async function postArticleCommentReply(
  articleId,
  parentCommentId,
  body,
) {
  try {
    const { data } = await axiosInstance.post(
      BLOG.COMMENT_REPLY(articleId, parentCommentId),
      body,
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to post reply.",
      "apiErrors.failed_to_post_reply",
    );
  }
}

export async function deleteArticleComment(commentId) {
  try {
    await axiosInstance.delete(BLOG.COMMENT_DELETE(commentId));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete comment.",
      "apiErrors.failed_to_delete_comment",
    );
  }
}

export async function likeArticle(articleId) {
  try {
    const { data } = await axiosInstance.post(BLOG.LIKES(articleId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to like article.",
      "apiErrors.failed_to_like_article",
    );
  }
}

export async function unlikeArticle(articleId) {
  try {
    await axiosInstance.delete(BLOG.LIKES(articleId));
  } catch (err) {
    throwApiError(
      err,
      "Failed to remove like.",
      "apiErrors.failed_to_remove_like",
    );
  }
}

export async function getArticleLikeStatus(articleId) {
  try {
    const { data } = await axiosInstance.get(BLOG.LIKE_STATUS(articleId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load like status.",
      "apiErrors.failed_to_load_article",
    );
  }
}

export async function shareArticle(articleId, body) {
  try {
    const { data } = await axiosInstance.post(BLOG.SHARES(articleId), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to record share.",
      "apiErrors.failed_to_record_share",
    );
  }
}

export async function uploadArticleImage(userId, articleId, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      BLOG_API_FILES.UPLOAD_IMAGE(userId, articleId),
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload image.",
      "apiErrors.failed_to_upload_image",
    );
  }
}

export async function uploadArticleVideo(userId, articleId, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      BLOG_API_FILES.UPLOAD_VIDEO(userId, articleId),
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload video.",
      "apiErrors.failed_to_upload_video",
    );
  }
}

export async function deleteBlogApiFile(fileId, articleId) {
  try {
    await axiosInstance.delete(BLOG_API_FILES.DELETE_FILE(fileId, articleId));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete file.",
      "apiErrors.failed_to_delete_file",
    );
  }
}

/* ─── Static file gateway (`/file/...`) ───────────────────────────────────── */

export async function postUniversityLogo(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      FILE.UNIVERSITY_LOGO.POST(id),
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload university logo.",
      "apiErrors.failed_to_upload_university_logo",
    );
  }
}

export async function getUniversityLogoUrl(id) {
  try {
    const { data } = await axiosInstance.get(FILE.UNIVERSITY_LOGO.GET(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load university logo.",
      "apiErrors.failed_to_load_university_logo",
    );
  }
}

export async function deleteUniversityLogo(id) {
  try {
    await axiosInstance.delete(FILE.UNIVERSITY_LOGO.DELETE(id));
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete university logo.",
      "apiErrors.failed_to_delete_university_logo",
    );
  }
}

export async function downloadUniversityLogoBlob(id) {
  try {
    const { data } = await axiosInstance.get(
      FILE.UNIVERSITY_LOGO.DOWNLOAD(id),
      {
        responseType: "blob",
      },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to download logo.",
      "apiErrors.failed_to_download_logo",
    );
  }
}

export async function postFacultyLogo(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(FILE.FACULTY_LOGO.POST(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload faculty logo.",
      "apiErrors.failed_to_upload_faculty_logo",
    );
  }
}

export async function getFacultyLogoUrl(id) {
  try {
    const { data } = await axiosInstance.get(FILE.FACULTY_LOGO.GET(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load faculty logo.",
      "apiErrors.failed_to_load_faculty_logo",
    );
  }
}

export async function postDepartmentLogo(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      FILE.DEPARTMENT_LOGO.POST(id),
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload department logo.",
      "apiErrors.failed_to_upload_department_logo",
    );
  }
}

export async function getDepartmentLogoUrl(id) {
  try {
    const { data } = await axiosInstance.get(FILE.DEPARTMENT_LOGO.GET(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load department logo.",
      "apiErrors.failed_to_load_department_logo",
    );
  }
}

export async function postTeacherProfilePicture(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      FILE.TEACHER_PROFILE.POST(id),
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload teacher profile.",
      "apiErrors.failed_to_upload_teacher_profile",
    );
  }
}

/**
 * Upload teacher profile image via `/api/v1/teacher/profile/{id}`.
 * Backend expects multipart field name: `file`.
 */
export async function postTeacherProfilePictureV1(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(TEACHER.PROFILE_UPLOAD(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload teacher profile.",
      "apiErrors.failed_to_upload_teacher_profile",
    );
  }
}

export async function getTeacherProfilePictureUrl(id) {
  try {
    const { data } = await axiosInstance.get(FILE.TEACHER_PROFILE.GET(id));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load teacher profile.",
      "apiErrors.failed_to_load_teacher_profile",
    );
  }
}

export async function postEmployeeProfilePicture(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      FILE.EMPLOYEE_PROFILE.POST(),
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload employee profile.",
      "apiErrors.failed_to_upload_employee_profile",
    );
  }
}

/**
 * Upload employee profile image via `/api/v1/employee/profile/{id}`.
 * Backend expects multipart field name: `file`.
 */
export async function postEmployeeProfilePictureV1(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(EMPLOYEE.PROFILE_UPLOAD(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload employee profile.",
      "apiErrors.failed_to_upload_employee_profile",
    );
  }
}

/**
 * Upload student profile image via `/api/v1/student/profile/{id}`.
 * Backend expects multipart field name: `file`.
 */
export async function postStudentProfilePictureV1(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(STUDENT.PROFILE_UPLOAD(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload student profile.",
      "apiErrors.failed_to_upload_student_profile",
    );
  }
}

/**
 * Upload user/author profile image via `/api/v1/users/profile/{id}`.
 * Backend expects multipart field name: `file`.
 */
export async function postUserProfilePictureV1(id, file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(USERS.PROFILE_UPLOAD(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload profile picture.",
      "apiErrors.failed_to_upload_profile_picture",
    );
  }
}

export async function uploadBlogFileMultipart(file, ownerId, articleId) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("ownerId", ownerId);
    fd.append("article", articleId);
    const { data } = await axiosInstance.post(FILE.BLOG_UPLOAD(), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload blog file.",
      "apiErrors.failed_to_upload_blog_file",
    );
  }
}

export async function uploadVicExecutable(file) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosInstance.post(
      FILE.CLI_APPLICATION.POST_VIC_EXE(),
      fd,
      { timeout: 180_000 },
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to upload VIC executable.",
      "apiErrors.failed_to_upload_file",
    );
  }
}

export async function getBlogFileMeta(fileId, ownerId) {
  try {
    const { data } = await axiosInstance.get(FILE.BLOG_META(fileId, ownerId));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load file metadata.",
      "apiErrors.failed_to_load_file_metadata",
    );
  }
}

export async function listBlogFilesForArticle(articleId, userId) {
  try {
    const { data } = await axiosInstance.get(
      FILE.BLOG_LIST_BY_ARTICLE(articleId, userId),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to list blog files.",
      "apiErrors.failed_to_list_blog_files",
    );
  }
}

/* ─── Notifications ───────────────────────────────────────────────────────── */

export async function createNotification(body) {
  try {
    const { data } = await axiosInstance.post(NOTIFICATIONS.ROOT(), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to send notification.",
      "apiErrors.failed_to_send_notification",
    );
  }
}

export async function resendNotification(id, body) {
  try {
    const { data } = await axiosInstance.post(NOTIFICATIONS.RESEND(id), body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to resend notification.",
      "apiErrors.failed_to_resend_notification",
    );
  }
}

export async function getNotificationById(id) {
  try {
    const { data } = await axiosInstance.get(NOTIFICATIONS.BY_ID(id));
    return unwrapNotificationEnvelope(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notification.",
      "apiErrors.failed_to_load_notification",
    );
  }
}

export async function markNotificationAsRead(id) {
  try {
    const { data } = await axiosInstance.patch(NOTIFICATIONS.MARK_READ(id));
    return unwrapNotificationEnvelope(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to update notification.",
      "apiErrors.failed_to_mark_notification_read",
    );
  }
}

export async function deleteNotification(id) {
  try {
    await axiosInstance.delete(NOTIFICATIONS.BY_ID(id));
    return { id };
  } catch (err) {
    throwApiError(
      err,
      "Failed to delete notification.",
      "apiErrors.failed_to_delete_notification",
    );
  }
}

export async function listNotificationsRoot(params = {}) {
  try {
    const { data } = await axiosInstance.get(NOTIFICATIONS.ROOT(params));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function listUserNotifications(userId, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.USER(userId, params),
    );
    return unwrapNotificationEnvelope(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function listUserNotificationsByType(userId, type, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.USER_BY_TYPE(userId, type, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function listUserNotificationsByStatus(
  userId,
  status,
  params = {},
) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.USER_BY_STATUS(userId, status, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function getUserNotificationUnreadCount(userId) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.USER_UNREAD_COUNT(userId),
    );
    return extractNotificationUnreadCountPayload(data);
  } catch (err) {
    throwApiError(
      err,
      "Failed to load unread count.",
      "apiErrors.failed_to_load_unread_count",
    );
  }
}

export async function listNotificationsByStatusGlobally(status, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.BY_STATUS(status, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function listNotificationsByTypeGlobally(type, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.BY_TYPE(type, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function listNotificationsByReference(params) {
  try {
    const { data } = await axiosInstance.get(
      NOTIFICATIONS.BY_REFERENCE(params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notifications.",
      "apiErrors.failed_to_load_notifications",
    );
  }
}

export async function adminRetryFailedNotifications() {
  try {
    const { data } = await axiosInstance.post(
      NOTIFICATIONS.ADMIN_RETRY_FAILED(),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to trigger retry.",
      "apiErrors.failed_to_trigger_retry",
    );
  }
}

export async function adminCleanupNotifications(daysOld = 30) {
  try {
    const { data } = await axiosInstance.delete(
      NOTIFICATIONS.ADMIN_CLEANUP(daysOld),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to cleanup notifications.",
      "apiErrors.failed_to_cleanup_notifications",
    );
  }
}

export async function adminNotificationStatistics(params = {}) {
  try {
    const { data } = await axiosInstance.get(NOTIFICATIONS.ADMIN_STATS(params));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load notification stats.",
      "apiErrors.failed_to_load_notification_stats",
    );
  }
}

/* ─── Version control (subset) ────────────────────────────────────────────── */

export async function vcRegister(body) {
  try {
    const { data } = await axiosInstance.post(VC_AUTH.REGISTER, body);
    return data;
  } catch (err) {
    throwApiError(err, "Registration failed.", "apiErrors.registration_failed");
  }
}

export async function vcLogin(body) {
  try {
    const { data } = await axiosInstance.post(VC_AUTH.LOGIN, body);
    return data;
  } catch (err) {
    throwApiError(err, "VC login failed.", "apiErrors.vc_login_failed");
  }
}

export async function vcRefresh(body) {
  try {
    const { data } = await axiosInstance.post(VC_AUTH.REFRESH, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Token refresh failed.",
      "apiErrors.token_refresh_failed",
    );
  }
}

export async function vcCreateRepository(body) {
  try {
    const { data } = await axiosInstance.post(VC.REPOS_CREATE, body);
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to create repository.",
      "apiErrors.failed_to_create_repository",
    );
  }
}

export async function vcGetRepository(owner, repo) {
  try {
    const { data } = await axiosInstance.get(VC.REPO_DETAIL(owner, repo));
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load repository.",
      "apiErrors.failed_to_load_repository",
    );
  }
}

export async function vcGetRepositoryTree(owner, repo, params = {}) {
  try {
    const { data } = await axiosInstance.get(VC.REPO_TREE(owner, repo, params));
    return data;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) {
      try {
        const { data } = await axiosInstance.get(
          VC.REPO_TREE_LEGACY(owner, repo, params),
        );
        return data;
      } catch (err2) {
        throwApiError(
          err2,
          "Failed to load tree.",
          "apiErrors.failed_to_load_tree",
        );
      }
    }
    throwApiError(err, "Failed to load tree.", "apiErrors.failed_to_load_tree");
  }
}

export async function vcGetRepositoryRefs(owner, repo) {
  try {
    const { data } = await axiosInstance.get(VC.REPO_INFO_REFS(owner, repo));
    return data && typeof data === "object" ? data : {};
  } catch (err) {
    if (err?.response?.status === 404) return {};
    throwApiError(err, "Failed to load refs.", "apiErrors.generic");
  }
}

export async function vcGetRepositoryContents(owner, repo, path, params = {}) {
  try {
    const { data } = await axiosInstance.get(
      VC.REPO_CONTENTS(owner, repo, path, params),
    );
    return data;
  } catch (err) {
    throwApiError(
      err,
      "Failed to load contents.",
      "apiErrors.failed_to_load_contents",
    );
  }
}
