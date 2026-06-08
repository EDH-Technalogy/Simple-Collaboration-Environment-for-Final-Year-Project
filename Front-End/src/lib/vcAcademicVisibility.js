/**
 * Who may see VC task/milestone grading metadata (scores, rubric, review feedback)
 * in the student repository UI. Backend remains authoritative.
 */

function normUser(s) {
  return String(s ?? "").trim().toLowerCase();
}

export function repoViewerUsername(user) {
  return String(
    user?.username ?? user?.preferred_username ?? user?.user_name ?? "",
  ).trim();
}

export function usernamesLikelySame(a, b) {
  const x = normUser(a);
  const y = normUser(b);
  return x !== "" && x === y;
}

/** Students (incl. reader `user` facet) see grading context for all issues in the repo. */
export function canViewRepoIssueGradingContext(isStudentFn, user, issueCreatedBy) {
  if (typeof isStudentFn === "function" && isStudentFn()) return true;
  if (userHasRole(user, ["admin", "teacher"])) return true;
  const me = repoViewerUsername(user);
  return usernamesLikelySame(me, issueCreatedBy);
}

export function canViewMilestoneGradingContext(isStudentFn, user, milestoneCreatedBy) {
  return canViewRepoIssueGradingContext(isStudentFn, user, milestoneCreatedBy);
}

/**
 * Creating/editing grading fields on forms: faculty need this even when they are not the creator.
 */
export function canEditIssueOrMilestoneGradingForms({
  isStudent,
  isTeacher,
  isAdmin,
}) {
  return (
    (typeof isStudent === "function" && isStudent()) ||
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin())
  );
}

function taskAssigneeUsername(task) {
  return String(
    task?.assignedTo?.username ??
      task?.assignedTo?.userName ??
      task?.assignee?.username ??
      task?.assignedTo ??
      "",
  ).trim();
}

/** Numeric PR id stored on the task DTO, if the backend sends one. */
export function taskVcSubmissionPullNumber(task) {
  if (!task || typeof task !== "object") return null;
  const keys = [
    "linkedPrId",
    "linked_pr_id",
    "pullRequestId",
    "pull_request_id",
    "submissionPullRequestId",
    "submission_pull_request_id",
  ];
  for (const k of keys) {
    const raw = task[k];
    if (raw == null || raw === "") continue;
    const value = String(raw).trim();
    if (value) return value;
  }
  return null;
}

/**
 * Submission exists on the issue (URLs, refs, stored PR number, etc.).
 * Backend field names vary; callers should expand as DTO evolves.
 */
export function taskVcHasSubmissionSignals(task) {
  if (!task || typeof task !== "object") return false;
  if (taskVcSubmissionPullNumber(task) != null) return true;
  return Boolean(
    task.submissionUrl ||
      task.submission_branch ||
      task.submissionBranch ||
      task.pullRequestUrl ||
      task.pull_request_url ||
      task.submissionCommit ||
      task.submission_commit,
  );
}

/** Assigned implementer submits work via PR details; creators may not self-submit via this UI. */
export function canSubmitAssignedVcTaskWork(user, task) {
  if (!task || typeof task !== "object") return false;
  const status = String(task.status ?? "").trim().toLowerCase();
  if (status === "completed" || status === "done") return false;
  const me = repoViewerUsername(user);
  const assignee = taskAssigneeUsername(task);
  if (!me || !assignee || !usernamesLikelySame(me, assignee)) return false;
  return true;
}

/**
 * Faculty reviewers evaluate the submission after a PR/link is submitted; assignees skip self-review UI.
 */
export function canPerformVcTaskPullSubmissionReview(user, task, reviewerRoleFns = {}) {
  const { isTeacher, isAdmin } = reviewerRoleFns;
  const isReviewerRole =
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin());
  if (!task || typeof task !== "object") return false;
  const me = repoViewerUsername(user);
  const assignee = taskAssigneeUsername(task);
  if (assignee && usernamesLikelySame(me, assignee)) return false;
  return (
    isReviewerRole ||
    (me && task.createdBy && usernamesLikelySame(me, task.createdBy))
  );
}

/**
 * Creator or faculty/admin may attach an assignee. Random collaborators rely on creators/faculty.
 */
export function canManageVcTaskAssignment(user, task, gradingRoleFns = {}) {
  const { isTeacher, isAdmin } = gradingRoleFns;
  if (!task || typeof task !== "object") return false;
  const status = String(task.status ?? "").trim().toLowerCase();
  if (status === "completed" || status === "done") return false;
  if (
    (typeof isTeacher === "function" && isTeacher()) ||
    (typeof isAdmin === "function" && isAdmin())
  )
    return true;
  const me = repoViewerUsername(user);
  if (!me) return false;
  if (task.createdBy && usernamesLikelySame(me, task.createdBy)) return true;
  return false;
}

function userHasRole(user, roles) {
  const wanted = new Set(roles.map((role) => String(role).toLowerCase()));
  const raw = [
    user?.role,
    user?.roles,
    user?.authorities,
    user?.realm_access?.roles,
    user?.resource_access?.account?.roles,
  ];
  return raw.flat().some((role) => {
    const normalized = String(role ?? "")
      .toLowerCase()
      .replace(/^role_/, "");
    return wanted.has(normalized);
  });
}
