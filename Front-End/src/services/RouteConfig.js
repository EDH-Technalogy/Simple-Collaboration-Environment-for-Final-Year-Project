/**
 * All API paths use one base URL from `.env`: `VITE_API_BASE_URL` (e.g. http://localhost:8080).
 */

const stripSlash = (s) => String(s ?? "").replace(/\/$/, "");

const envApiBase = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = stripSlash(
  typeof envApiBase === "string" ? envApiBase : "",
);

const gw = (path) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Append query object to URL (skips null/undefined). */
export function withQuery(path, params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path;
}

const REFRESH_SEGMENT =
  typeof import.meta.env.VITE_AUTH_REFRESH_PATH === "string" &&
  import.meta.env.VITE_AUTH_REFRESH_PATH.trim().length > 0
    ? import.meta.env.VITE_AUTH_REFRESH_PATH.trim().startsWith("/")
      ? import.meta.env.VITE_AUTH_REFRESH_PATH.trim()
      : `/${import.meta.env.VITE_AUTH_REFRESH_PATH.trim()}`
    : "/api/v1/auth/refresh-token";

/** Auth Service — `/api/v1/auth` */
export const AUTH = {
  LOGIN: gw("/api/v1/auth/login"),
  SIGNUP: gw("/api/v1/auth/signup"),
  GOOGLE: gw("/api/v1/auth/google"),
  REFRESH_TOKEN: gw(REFRESH_SEGMENT),
  LOGOUT: gw("/api/v1/auth/logout"),
  ME: gw("/api/v1/auth/me"),
  CHANGE_PASSWORD: (userId) => gw(`/api/v1/auth/change-password/${userId}`),
  FORGOT_PASSWORD: gw("/api/v1/auth/forgot-password"),
  RESET_PASSWORD: gw("/api/v1/auth/reset-password"),
  VERIFY_EMAIL: gw("/api/v1/auth/verify-email"),
  RESEND_VERIFICATION: gw("/api/v1/auth/resend-verification-email"),
};

/** User Service — `/api/v1/users` */
export const USERS = {
  LIST: (params = {}) => gw(withQuery("/api/v1/users", params)),
  SEARCH: (search) =>
    gw(
      `/api/v1/users/search${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  CREATE: () => gw("/api/v1/users"),
  BY_ID: (id) => gw(`/api/v1/users/${id}`),
  /** Upload profile image (multipart/form-data, field name: `file`). */
  PROFILE_UPLOAD: (id) => gw(`/api/v1/users/profile/${encodeURIComponent(id)}`),
  BY_USERNAME: (username) =>
    gw(`/api/v1/users/by-username/${encodeURIComponent(username)}`),
  BY_EMAIL: (email) =>
    gw(`/api/v1/users/by-email/${encodeURIComponent(email)}`),
  AUTHOR: (id) => gw(`/api/v1/users/author/${id}`),
  CONTRIBUTOR: (id) => gw(`/api/v1/users/contributor/${id}`),
  WITH_ROLE: (id, roleName) =>
    gw(`/api/v1/users/${id}/${encodeURIComponent(roleName)}`),
  SUSPEND: (id) => gw(`/api/v1/users/${id}/suspend`),
  ACTIVATE: (id) => gw(`/api/v1/users/${id}/activate`),
  LOCK: (id, durationMinutes = 30) =>
    gw(`/api/v1/users/${id}/lock?durationMinutes=${durationMinutes}`),
  VERIFY_EMAIL: (id) => gw(`/api/v1/users/${id}/verify-email`),
  STATS_COUNT: () => gw("/api/v1/users/stats/count"),
};

/** Roles — `/api/v1/roles` */
export const ROLES = {
  LIST: () => gw("/api/v1/roles"),
  CREATE: () => gw("/api/v1/roles"),
  BY_NAME: (roleName) => gw(`/api/v1/roles/${encodeURIComponent(roleName)}`),
  STATS_COUNT: () => gw("/api/v1/roles/stats/count"),
  ASSIGN: (roleName, userId) =>
    gw(
      `/api/v1/roles/${encodeURIComponent(roleName)}/assign-to-user/${userId}`,
    ),
  REMOVE: (roleName, userId) =>
    gw(
      `/api/v1/roles/${encodeURIComponent(roleName)}/remove-from-user/${userId}`,
    ),
};

/** Permissions — `/api/v1/permissions` */
export const PERMISSIONS = {
  CREATE: () => gw("/api/v1/permissions"),
  BY_CLIENT: (clientId) =>
    gw(`/api/v1/permissions/client/${encodeURIComponent(clientId)}`),
  ASSIGN: (clientId, roleName, userId) =>
    gw(
      `/api/v1/permissions/client/${encodeURIComponent(clientId)}/role/${encodeURIComponent(roleName)}/assign-to-user/${encodeURIComponent(userId)}`,
    ),
  REMOVE: (clientId, roleName, userId) =>
    gw(
      `/api/v1/permissions/client/${encodeURIComponent(clientId)}/role/${encodeURIComponent(roleName)}/remove-from-user/${encodeURIComponent(userId)}`,
    ),
  DELETE_ROLE: (clientId, roleName) =>
    gw(
      `/api/v1/permissions/client/${encodeURIComponent(clientId)}/role/${encodeURIComponent(roleName)}`,
    ),
  STATS: (clientId) =>
    gw(
      `/api/v1/permissions/client/${encodeURIComponent(clientId)}/stats/count`,
    ),
};

/** Blog Service — `/api/v1/articles` */
export const BLOG = {
  ARTICLES: (params = {}) => gw(withQuery("/api/v1/articles", params)),
  PUBLIC_ARTICLES: (params = {}) => gw(withQuery("/api/v1/articles/public", params)),
  ADMIN_ARTICLES: (params = {}) =>
    gw(withQuery("/api/v1/articles/admin/all", params)),
  ARTICLE_BY_ID: (articleId) => gw(`/api/v1/articles/${articleId}`),
  PUBLIC_ARTICLE_BY_ID: (articleId) =>
    gw(`/api/v1/articles/public/${encodeURIComponent(articleId)}`),
  ARTICLES_BY_AUTHOR: (authorId, params = {}) =>
    gw(
      withQuery(`/api/v1/articles/authors/${encodeURIComponent(authorId)}`, {
        page: 0,
        pageSize: 20,
        ...params,
      }),
    ),
  AUTHORS_PUBLISHED: (authorId, params = {}) =>
    gw(
      withQuery(
        `/api/v1/articles/authors/${encodeURIComponent(authorId)}/published`,
        { page: 0, pageSize: 20, ...params },
      ),
    ),
  AUTHOR_ARTICLE: (authorId, articleId) =>
    gw(
      `/api/v1/articles/authors/${encodeURIComponent(authorId)}/articles/${encodeURIComponent(articleId)}`,
    ),
  CREATE_FOR_USER: (userId) =>
    gw(`/api/v1/articles/${encodeURIComponent(userId)}`),
  DRAFT_FOR_USER: (userId) =>
    gw(`/api/v1/articles/drafts/users/${encodeURIComponent(userId)}`),
  WITH_FILES_AUTHOR: (author) =>
    gw(`/api/v1/articles/with-files/author/${encodeURIComponent(author)}`),
  UPDATE_JSON: (articleId, authorId) =>
    gw(
      `/api/v1/articles/${encodeURIComponent(articleId)}/author/${encodeURIComponent(authorId)}`,
    ),
  UPDATE_WITH_FILE: (articleId, authorId) =>
    gw(
      `/api/v1/articles/with-file/${encodeURIComponent(articleId)}/author/${encodeURIComponent(authorId)}`,
    ),
  PUBLISH: (articleId, authorId) =>
    gw(
      `/api/v1/articles/publish/${encodeURIComponent(articleId)}/author/${encodeURIComponent(authorId)}`,
    ),
  DELETE: (articleId, authorId) =>
    gw(
      `/api/v1/articles/${encodeURIComponent(articleId)}/author/${encodeURIComponent(authorId)}`,
    ),
  COMMENTS: (articleId, params = {}) =>
    gw(
      withQuery(
        `/api/v1/articles/${encodeURIComponent(articleId)}/comments`,
        params,
      ),
    ),
  COMMENT_REPLY: (articleId, parentCommentId) =>
    gw(
      `/api/v1/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(parentCommentId)}/replies`,
    ),
  COMMENT_DELETE: (commentId) =>
    gw(`/api/v1/articles/comments/${encodeURIComponent(commentId)}`),
  LIKES: (articleId) =>
    gw(`/api/v1/articles/${encodeURIComponent(articleId)}/likes`),
  LIKE_STATUS: (articleId) =>
    gw(`/api/v1/articles/${encodeURIComponent(articleId)}/likes/me`),
  SHARES: (articleId) =>
    gw(`/api/v1/articles/${encodeURIComponent(articleId)}/shares`),
};

/** Blog binary uploads — `/api/v1/files/upload/...` */
export const BLOG_API_FILES = {
  UPLOAD_IMAGE: (userId, articleId) =>
    gw(
      `/api/v1/files/upload/image/${encodeURIComponent(userId)}/article/${encodeURIComponent(articleId)}`,
    ),
  UPLOAD_VIDEO: (userId, articleId) =>
    gw(
      `/api/v1/files/upload/video/${encodeURIComponent(userId)}/article/${encodeURIComponent(articleId)}`,
    ),
  DELETE_FILE: (fileId, articleId) =>
    gw(
      `/api/v1/files/${encodeURIComponent(fileId)}/author/${encodeURIComponent(articleId)}`,
    ),
};

/** File Service — `/file/...` on the same gateway as `VITE_API_BASE_URL`. */
export const FILE = {
  UNIVERSITY_LOGO: {
    POST: (id) => gw(`/file/university/logo/${encodeURIComponent(id)}`),
    GET: (id) => gw(`/file/university/logo/${encodeURIComponent(id)}`),
    DELETE: (id) => gw(`/file/university/logo/${encodeURIComponent(id)}`),
    DOWNLOAD: (id) =>
      gw(`/file/university/logo/${encodeURIComponent(id)}/download`),
  },
  FACULTY_LOGO: {
    POST: (id) => gw(`/file/faculty/logo/${encodeURIComponent(id)}`),
    GET: (id) => gw(`/file/faculty/logo/${encodeURIComponent(id)}`),
  },
  DEPARTMENT_LOGO: {
    POST: (id) => gw(`/file/department/logo/${encodeURIComponent(id)}`),
    GET: (id) => gw(`/file/department/logo/${encodeURIComponent(id)}`),
  },
  TEACHER_PROFILE: {
    POST: (id) => gw(`/file/teacher/profile/${encodeURIComponent(id)}`),
    GET: (id) => gw(`/file/teacher/profile/${encodeURIComponent(id)}`),
  },
  EMPLOYEE_PROFILE: {
    POST: () => gw(`/file/employee/profile`),
    GET: (id) =>
      id
        ? gw(`/file/employee/profile/${encodeURIComponent(id)}`)
        : gw(`/file/employee/profile`),
  },
  BLOG_UPLOAD: () => gw("/file/blog/upload"),
  BLOG_META: (fileId, ownerId) =>
    gw(
      `/file/blog/${encodeURIComponent(fileId)}/owner/${encodeURIComponent(ownerId)}`,
    ),
  BLOG_LIST_BY_ARTICLE: (articleId, userId) =>
    gw(
      `/file/blog/${encodeURIComponent(articleId)}/user/${encodeURIComponent(userId)}`,
    ),
  STUDENT_PROFILE: {
    POST: (id) => gw(`/file/student/profile/${encodeURIComponent(id)}`),
    GET: (id) => gw(`/file/student/profile/${encodeURIComponent(id)}`),
  },
  CLI_APPLICATION: {
    POST: () => gw("/file/cli-application"),
    POST_VIC_EXE: () => gw("/file/cli-application/vic.exe"),
    DOWNLOAD_LATEST: () => gw("/file/cli-application/latest/download"),
    DOWNLOAD_BY_NAME: (fileName) =>
      gw(`/file/cli-application/download/${encodeURIComponent(fileName)}`),
    DOWNLOAD_RAW: (fileName) =>
      gw(`/file/cli-application/raw/${encodeURIComponent(fileName)}`),
  },
};

/** Notifications — `/api/v1/notifications` */
export const NOTIFICATIONS = {
  ROOT: (params = {}) => gw(withQuery("/api/v1/notifications", params)),
  BY_ID: (id) => gw(`/api/v1/notifications/${encodeURIComponent(id)}`),
  RESEND: (id) => gw(`/api/v1/notifications/${encodeURIComponent(id)}/resend`),
  MARK_READ: (id) =>
    gw(`/api/v1/notifications/${encodeURIComponent(id)}/mark-read`),
  USER: (userId, params = {}) =>
    gw(
      withQuery(`/api/v1/notifications/user/${encodeURIComponent(userId)}`, {
        page: 0,
        size: 20,
        ...params,
      }),
    ),
  USER_BY_TYPE: (userId, type, params = {}) =>
    gw(
      withQuery(
        `/api/v1/notifications/user/${encodeURIComponent(userId)}/type/${encodeURIComponent(type)}`,
        { page: 0, size: 20, ...params },
      ),
    ),
  USER_BY_STATUS: (userId, status, params = {}) =>
    gw(
      withQuery(
        `/api/v1/notifications/user/${encodeURIComponent(userId)}/status/${encodeURIComponent(status)}`,
        { page: 0, size: 20, ...params },
      ),
    ),
  USER_UNREAD_COUNT: (userId) =>
    gw(`/api/v1/notifications/user/${encodeURIComponent(userId)}/unread-count`),
  BY_STATUS: (status, params = {}) =>
    gw(
      withQuery(
        `/api/v1/notifications/status/${encodeURIComponent(status)}`,
        params,
      ),
    ),
  BY_TYPE: (type, params = {}) =>
    gw(
      withQuery(
        `/api/v1/notifications/type/${encodeURIComponent(type)}`,
        params,
      ),
    ),
  BY_REFERENCE: (params) =>
    gw(withQuery(`/api/v1/notifications/reference`, params)),
  ADMIN_RETRY_FAILED: () => gw("/api/v1/notifications/admin/retry-failed"),
  ADMIN_CLEANUP: (daysOld = 30) =>
    gw(`/api/v1/notifications/admin/cleanup?daysOld=${daysOld}`),
  ADMIN_STATS: (params = {}) =>
    gw(withQuery("/api/v1/notifications/admin/stats", params)),
};

/**
 * Version control — mix of `/auth`, `/api/v1/repos`, `/repos/:owner/:repo`.
 * Extend as controllers ship.
 */
export const VC_AUTH = {
  REGISTER: gw("/auth/register"),
  LOGIN: gw("/auth/login"),
  REFRESH: gw("/auth/refresh"),
};

/** Encodes a repo file path for VC API path segments (no leading slash). */
export function vcRepoPathSegments(path) {
  return String(path ?? "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

export const VC = {
  REPOS_CREATE: gw("/api/v1/repos"),
  /**
   * List repositories belonging to `{ownerId}` (`RepositoryResponse` rows).
   * Typical VC controller: `@RequestMapping("/api/v1/repos")` + `GET "/{ownerId}"`.
   * Student workspace sends the gateway user id (`AuthProvider` `user.id`).
   */
  REPOS_BY_ID: (repoId) => gw(`/api/v1/repos/${encodeURIComponent(repoId)}`),
  REPOS_OWNED_BY: (ownerId) =>
    gw(`/api/v1/repos/owner/${encodeURIComponent(ownerId)}`),
  REPOS_ACCESSIBLE_BY: (userId) =>
    gw(`/api/v1/repos/accessible/${encodeURIComponent(userId)}`),
  /** Activity feed parsing can recover `owner/repo` slugs when no list endpoint exists. */
  USER_ACTIVITY: (username, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(username)}/activity`,
        params,
      ),
    ),
  REPO_DETAIL: (owner, repo) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    ),
  REPO_ARCHIVE: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/archive.zip`,
        params,
      ),
    ),
  REPO_PULLS: (owner, repo) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    ),
  REPO_TASK_DASHBOARD: (owner, repo) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/dashboard`,
    ),
  REPO_TASK_CREATE: (owner, repo, username) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/${encodeURIComponent(username)}`,
    ),
  REPO_TASKS: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks`,
        params,
      ),
    ),
  REPO_TASK_SUBMIT: (owner, repo, taskNumber) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/${encodeURIComponent(taskNumber)}/submit`,
    ),
  REPO_TASK_ELIGIBLE_PULLS: (owner, repo, taskNumber) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/${encodeURIComponent(taskNumber)}/eligible-pulls`,
    ),
  REPO_TASK_REVIEW: (owner, repo, taskNumber) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/${encodeURIComponent(taskNumber)}/review`,
    ),
  REPO_TASK_COMPLETE: (owner, repo, taskNumber) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/${encodeURIComponent(taskNumber)}/complete`,
    ),
  REPO_TASK_ASSIGN: (owner, repo, taskNumber, user, assignee) =>
    gw(
      `/api/v1/task/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tasks/${encodeURIComponent(taskNumber)}/assign/${encodeURIComponent(user)}/${encodeURIComponent(assignee)}`,
    ),
  /** Aligns with VC service controllers that POST the body to `/milestones` (no `{writer}` segment). */
  REPO_MILESTONE_CREATE: (owner, repo) =>
    gw(
      `/api/v1/milestone/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones`,
    ),
  REPO_MILESTONES: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/api/v1/milestone/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones`,
        params,
      ),
    ),
  REPO_MILESTONE_BY_NUMBER: (owner, repo, milestoneNumber) =>
    gw(
      `/api/v1/milestone/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones/${encodeURIComponent(milestoneNumber)}`,
    ),
  /** VC `MilestoneController`: PATCH marks milestone closed (`closeMilestone` — path suffix `/open` on server). */
  REPO_MILESTONE_MARK_CLOSED: (owner, repo, milestoneNumber) =>
    gw(
      `/api/v1/milestone/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones/${encodeURIComponent(milestoneNumber)}/open`,
    ),
  /** VC `MilestoneController`: PATCH reopens milestone. */
  REPO_MILESTONE_REOPEN: (owner, repo, milestoneNumber) =>
    gw(
      `/api/v1/milestone/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones/${encodeURIComponent(milestoneNumber)}/re-open`,
    ),
  REPO_STATISTICS: (owner, repo) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/statistics`,
    ),
  /** `GET /api/v1/repos/{owner}/{repo}/contributors` — `ContributorUser` list for this repository. */
  REPO_CONTRIBUTORS: (owner, repo) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors`,
    ),
  REPO_FILE_NOTES: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/notes`,
        params,
      ),
    ),
  REPO_FILE_NOTE: (owner, repo, noteId) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/notes/${encodeURIComponent(noteId)}`,
    ),
  /** Matches `FileViewController` `@RequestMapping("api/v1/repos/{owner}/{repo}")`. */
  REPO_TREE: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree`,
        params,
      ),
    ),
  /** Fallback if a gateway proxies only `/repos/...` (no `/api/v1`). */
  REPO_TREE_LEGACY: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree`,
        params,
      ),
    ),
  /** Raw MinIO-backed object (`RepositoryController`): zlib-compressed Vic object blob. */
  REPO_OBJECT: (owner, repo, hash) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/objects/${encodeURIComponent(String(hash ?? "").trim())}`,
    ),
  /** `RepositoryController`: branch/tag heads + symbolic `HEAD`. */
  REPO_INFO_REFS: (owner, repo) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/info/refs`,
    ),
  /** @param {string} pathSegment e.g. `src/App.java` (no leading slash) */
  REPO_CONTENTS: (owner, repo, pathSegment = "", params = {}) => {
    const base = `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`;
    const suffix = pathSegment
      ? `/${pathSegment
          .split("/")
          .filter(Boolean)
          .map(encodeURIComponent)
          .join("/")}`
      : "";
    return gw(withQuery(`${base}${suffix}`, params));
  },
  /** @deprecated Use `vcRepoPathSegments` — kept for discoverability. */
  REPO_PATH_SEGMENTS: vcRepoPathSegments,
  /** GET `/api/v1/repos/{owner}/{repo}/tree/{branch}/{path}` — raw file at ref (arraybuffer on client). */
  REPO_FILE_AT_REF: (owner, repo, branch, path = "") => {
    const suffix = vcRepoPathSegments(path);
    return gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree/${encodeURIComponent(branch)}${suffix ? `/${suffix}` : ""}`,
    );
  },
  /** Gateway path per `apiEndpoint.md` §5.6 — `?path=&ref=&limit=` */
  REPO_COMMITS: (owner, repo, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
        params,
      ),
    ),
  /** `FileViewController`: `compare/{base}...{head}` */
  REPO_COMPARE: (owner, repo, baseRef, headRef) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${encodeURIComponent(`${baseRef}...${headRef}`)}`,
    ),
  COMMITS_ON_BRANCH: (owner, repo, branch, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(branch)}`,
        params,
      ),
    ),
  COMMIT_DETAIL: (owner, repo, commitSha) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(commitSha)}`,
    ),
  /** GET `/api/v1/repos/.../blame/{path}` — query `ref` (gateway doc) and/or `branch` (legacy) */
  BLAME_FILE: (owner, repo, filePath, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/blame/${vcRepoPathSegments(filePath)}`,
        params,
      ),
    ),
  DOCUMENT_BLAME_FILE: (owner, repo, filePath, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/document-blame/${vcRepoPathSegments(filePath)}`,
        params,
      ),
    ),
  /** GET `/api/v1/repos/.../diff/{baseSha}/{headSha}` */
  DIFF_COMMITS: (owner, repo, baseSha, headSha, params = {}) =>
    gw(
      withQuery(
        `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/diff/${encodeURIComponent(baseSha)}/${encodeURIComponent(headSha)}`,
        params,
      ),
    ),
  REPO_INVITE: (owner, repo, guest) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/invitations/${encodeURIComponent(guest)}`,
    ),
  REPO_INVITATIONS_FOR_REPO: (owner, repo) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/invitations`,
    ),
  REPO_INVITATIONS_MINE: (user) =>
    gw(`/api/v1/repos/invitations/${encodeURIComponent(user)}`),
  REPO_INVITATION_ACCEPT: (invitationId, userId) =>
    gw(
      `/api/v1/repos/invitations/${encodeURIComponent(invitationId)}/accept/${encodeURIComponent(userId)}`,
    ),
  REPO_INVITATION_REJECT: (invitationId, userId) =>
    gw(
      `/api/v1/repos/invitations/${encodeURIComponent(invitationId)}/reject/${encodeURIComponent(userId)}`,
    ),
  PULL_REQUEST_FILES: (owner, repo, number) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(number)}/files`,
    ),
  PULL_REQUEST_FILE_DIFF: (owner, repo, number, fileIndex) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(number)}/files/${encodeURIComponent(fileIndex)}/diff`,
    ),
  MERGE_PULL_REQUEST: (owner, repo, number) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(number)}/merge`,
    ),
  MERGE_CONFLICTS: (owner, repo, number) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(number)}/conflicts`,
    ),
  MERGE_RESOLVE: (owner, repo, number) =>
    gw(
      `/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(number)}/conflicts/resolve`,
    ),
};

/** Student resource on the gateway (`VITE_API_BASE_URL`). */
export const STUDENT = {
  GETALL: gw("/api/student"),
  GETBYID: (id) => gw(`/api/student/${id}`),
  /** Upload profile image (multipart/form-data, field name: `file`). */
  PROFILE_UPLOAD: (id) => gw(`/api/student/profile/${encodeURIComponent(id)}`),
  SEARCH: (keyword = "") => gw(withQuery("/api/student/search", { keyword })),
  /** Resolved student row for the current gateway session / Keycloak subject. */
  ME: gw("/api/student/me"),
  BY_KEYCLOAK: (keycloakSubject) =>
    gw(`/api/student/by-keycloak/${encodeURIComponent(keycloakSubject)}`),
  CREATE: gw("/api/student"),
  UPDATE: (id) => gw(`/api/student/${id}`),
  DELETE: (id) => gw(`/api/student/${id}`),
};

/** Departments on the gateway (`VITE_API_BASE_URL`). */
export const DEPARTMENT = {
  GETALL: gw("/api/department"),
  GETBYID: (id) => gw(`/api/department/${id}`),
  CREATE: gw("/api/department"),
  UPDATE: (id) => gw(`/api/department/${id}`),
  DELETE: (id) => gw(`/api/department/${id}`),
};

/** Faculties on the gateway (`VITE_API_BASE_URL`). */
export const FACULTY = {
  GETALL: gw("/api/faculty"),
  GETBYID: (id) => gw(`/api/faculty/${encodeURIComponent(id)}`),
  CREATE: gw("/api/faculty"),
  UPDATE: (id) => gw(`/api/faculty/${encodeURIComponent(id)}`),
  DELETE: (id) => gw(`/api/faculty/${encodeURIComponent(id)}`),
};

/** Universities on the gateway (`/api/university`) when the faculty service exposes them. */
export const UNIVERSITY = {
  GETALL: gw("/api/university"),
  LIST: (params = {}) => gw(withQuery("/api/university", params)),
};

/** Batches (intake cohorts) — faculty service `/api/batch`. */
export const BATCH = {
  LIST: (params = {}) => gw(withQuery("/api/batch", params)),
  GETALL: gw("/api/batch"),
  GETBYID: (id) => gw(`/api/batch/${encodeURIComponent(id)}`),
  CREATE: gw("/api/batch"),
  UPDATE: (id) => gw(`/api/batch/${encodeURIComponent(id)}`),
  DELETE: (id) => gw(`/api/batch/${encodeURIComponent(id)}`),
};

/** Academic year — `/api/academic-year` */
export const ACADEMIC_YEAR = {
  LIST: (params = {}) => gw(withQuery("/api/academic-year", params)),
  BY_ID: (id) => gw(`/api/academic-year/${encodeURIComponent(id)}`),
  CREATE: gw("/api/academic-year"),
  UPDATE: (id) => gw(`/api/academic-year/${encodeURIComponent(id)}`),
  DELETE: (id) => gw(`/api/academic-year/${encodeURIComponent(id)}`),
};

/** Semester — `/api/semester` */
export const SEMESTER = {
  LIST: (params = {}) => gw(withQuery("/api/semester", params)),
  BY_ID: (id) => gw(`/api/semester/${encodeURIComponent(id)}`),
  /** Semesters for one academic year (faculty gateway). */
  BY_ACADEMIC_YEAR: (academicYearId) =>
    gw(`/api/semester/academic-year/${encodeURIComponent(academicYearId)}`),
  CREATE: gw("/api/semester"),
  UPDATE: (id) => gw(`/api/semester/${encodeURIComponent(id)}`),
  DELETE: (id) => gw(`/api/semester/${encodeURIComponent(id)}`),
};

/** VC / faculty repository catalogue — search by keyword (`RepositoryResponse`). */
export const REPOSITORY = {
  SEARCH: (keyword) => gw(withQuery("/api/v1/repos/search", { keyword })),
};

/** Faculty project — `/api/project` */
export const FACULTY_PROJECT = {
  LIST: (params = {}) => gw(withQuery("/api/project", params)),
  PUBLIC_LIST: (params = {}) => gw(withQuery("/api/project/public", params)),
  BY_ID: (id) => gw(`/api/project/${encodeURIComponent(id)}`),
  PUBLIC_BY_ID: (id) => gw(`/api/project/public/${encodeURIComponent(id)}`),
  PUBLIC_DOWNLOAD: (id) =>
    gw(`/api/project/public/${encodeURIComponent(id)}/download`),
  INVITE: (id) => gw(`/api/project/${encodeURIComponent(id)}/invite`),
  BY_ID_AND_STUDENT: (id, studentId) =>
    gw(
      `/api/project/${encodeURIComponent(id)}/student/${encodeURIComponent(studentId)}`,
    ),
  BY_ID_AND_TEACHER: (id, teacherId) =>
    gw(
      `/api/project/${encodeURIComponent(id)}/teacher/${encodeURIComponent(teacherId)}`,
    ),
  BY_STUDENT: (studentId) =>
    gw(`/api/project/student/${encodeURIComponent(studentId)}`),
  BY_TEACHER: (teacherId) =>
    gw(`/api/project/teacher/${encodeURIComponent(teacherId)}`),
  BY_TEACHER_AND_STUDENT: (teacherId, studentId) =>
    gw(
      `/api/project/teacher/${encodeURIComponent(teacherId)}/student/${encodeURIComponent(studentId)}`,
    ),
  CREATE: gw("/api/project"),
  UPDATE: (id) => gw(`/api/project/${encodeURIComponent(id)}`),
  PUBLIC_RESULT: (id) =>
    gw(`/api/project/${encodeURIComponent(id)}/public-result`),
  COMPLETE: (id) => gw(`/api/project/${encodeURIComponent(id)}/complete`),
  PUBLISH: (id) => gw(`/api/project/${encodeURIComponent(id)}/publish`),
  UNPUBLISH: (id) => gw(`/api/project/${encodeURIComponent(id)}/unpublish`),
  DELETE: (id) => gw(`/api/project/${encodeURIComponent(id)}`),
};

/** Student group — `/api/group` */
export const FACULTY_GROUP = {
  LIST: (params = {}) => gw(withQuery("/api/group", params)),
  BY_ID: (id) => gw(`/api/group/${encodeURIComponent(id)}`),
  CREATE: gw("/api/group"),
  UPDATE: (id) => gw(`/api/group/${encodeURIComponent(id)}`),
  UPDATE_LEADER: (id, leaderId) =>
    gw(
      `/api/group/${encodeURIComponent(id)}/leader/${encodeURIComponent(leaderId)}`,
    ),
  REMOVE_MEMBER: (id, studentId) =>
    gw(
      `/api/group/${encodeURIComponent(id)}/members/${encodeURIComponent(studentId)}`,
    ),
  DELETE: (id) => gw(`/api/group/${encodeURIComponent(id)}`),
};

/** Faculty-service teachers (same gateway base as students unless proxied). */
export const TEACHER = {
  GETALL: gw("/api/teacher"),
  GETBYID: (id) => gw(`/api/teacher/${id}`),
  /** Upload profile image (multipart/form-data, field name: `file`). */
  PROFILE_UPLOAD: (id) => gw(`/api/teacher/profile/${encodeURIComponent(id)}`),
  SEARCH: (keyword = "") => gw(withQuery("/api/teacher/search", { keyword })),
  CREATE: gw("/api/teacher"),
  UPDATE: (id) => gw(`/api/teacher/${id}`),
  DELETE: (id) => gw(`/api/teacher/${id}`),
};

/** Faculty-service employees. */
export const EMPLOYEE = {
  GETALL: gw("/api/employee"),
  GETBYID: (id) => gw(`/api/employee/${id}`),
  /** Upload profile image (multipart/form-data, field name: `file`). */
  PROFILE_UPLOAD: (id) => gw(`/api/employee/profile/${encodeURIComponent(id)}`),
  SEARCH: (keyword = "") => gw(withQuery("/api/employee/search", { keyword })),
  CREATE: gw("/api/employee"),
  UPDATE: (id) => gw(`/api/employee/${id}`),
  DELETE: (id) => gw(`/api/employee/${id}`),
};

/**
 * Flat ROUTES alias for existing apiRoute imports.
 * Prefer AUTH/STUDENT/… in new code.
 */
export const ROUTES = {
  AUTH,
  STUDENT,
  DEPARTMENT,
  FACULTY,
  BATCH,
  ACADEMIC_YEAR,
  SEMESTER,
  REPOSITORY,
  FACULTY_PROJECT,
  FACULTY_GROUP,
  TEACHER,
  EMPLOYEE,
};
