/**
 * Client-side validation for VC milestone / task payloads so requests match
 * backend DTOs (MilestoneRequest, TaskRequest, SubmissionRequest, ReviewRequest)
 * and fail fast with ApiClientValidationError before hitting the network.
 */

const MAX_TITLE_LEN = 512;
const MAX_DESCRIPTION_LEN = 16_000;
const MAX_RUBRIC_LEN = 32_000;
const MAX_FEEDBACK_LEN = 32_000;
const MAX_SUBMISSION_DESC_LEN = 16_000;
const MAX_SCORE_VALUE = 1_000_000;
const MAX_REQUIRED_TASKS = 100_000;
const MAX_ESTIMATED_HOURS = 100_000;
const MAX_LABELS = 24;
const MAX_LABEL_LEN = 64;
const MAX_REQUIREMENTS = 100;
const MAX_REQUIREMENT_LINE_LEN = 2_000;
const MAX_SUBMISSION_FILES = 200;
const MAX_FILE_ENTRY_LEN = 2_048;
const MAX_REVIEW_CHECKED = 100;
const MAX_REVIEW_CHECKED_LINE_LEN = 512;
/** Fits common PR id columns; adjust if your backend uses bigint. */
const MAX_PULL_REQUEST_ID = 2_147_483_647;

const TASK_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const KNOWN_TASK_LABELS = new Set([
  "BUG",
  "DOCUMENTATION",
  "DUPLICATE",
  "INVALID",
  "QUESTION",
]);

const USERNAME_RE = /^[a-zA-Z0-9._-]{1,128}$/;
const LABEL_RE = /^[A-Z][A-Z0-9_]*$/;
const COMMIT_HASH_RE = /^[0-9a-fA-F]{7,128}$/;

function throwVcValidation(message, i18nKey) {
  const err = new Error(message);
  err.name = "ApiClientValidationError";
  err.i18nKey = i18nKey;
  throw err;
}

function assertValidIsoInstant(value, i18nKey) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  const t = Date.parse(s);
  if (Number.isNaN(t)) {
    throwVcValidation("Invalid due date.", i18nKey);
  }
  return s;
}

function parseOptionalNonNegativeInt(raw, i18nKey) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > MAX_SCORE_VALUE) {
    throwVcValidation("Invalid numeric value.", i18nKey);
  }
  return n;
}

function parseOptionalPositiveInt(raw, i18nKey) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > MAX_SCORE_VALUE) {
    throwVcValidation("Invalid milestone number.", i18nKey);
  }
  return n;
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export function normalizeVcMilestoneBodyForCreate(raw) {
  const title = String(raw?.title ?? "").trim();
  if (!title) {
    throwVcValidation("Milestone title is required.", "apiErrors.validation.vc.milestoneTitleRequired");
  }
  if (title.length > MAX_TITLE_LEN) {
    throwVcValidation("Milestone title is too long.", "apiErrors.validation.vc.milestoneTitleMaxLen");
  }

  const descriptionRaw = raw?.description;
  const description =
    descriptionRaw == null || descriptionRaw === ""
      ? null
      : String(descriptionRaw).trim();
  if (description && description.length > MAX_DESCRIPTION_LEN) {
    throwVcValidation("Description is too long.", "apiErrors.validation.vc.milestoneDescriptionMaxLen");
  }

  const rubricRaw = raw?.rubric;
  const rubric =
    rubricRaw == null || rubricRaw === "" ? null : String(rubricRaw).trim();
  if (rubric && rubric.length > MAX_RUBRIC_LEN) {
    throwVcValidation("Rubric is too long.", "apiErrors.validation.vc.milestoneRubricMaxLen");
  }

  const dueDate = assertValidIsoInstant(
    raw?.dueDate,
    "apiErrors.validation.vc.milestoneDueDateInvalid",
  );

  const maxScore = parseOptionalNonNegativeInt(
    raw?.maxScore,
    "apiErrors.validation.vc.milestoneScoresInvalid",
  );
  const passingScore = parseOptionalNonNegativeInt(
    raw?.passingScore,
    "apiErrors.validation.vc.milestoneScoresInvalid",
  );
  const requiredTasksRaw = raw?.requiredTasks;
  let requiredTasks = null;
  if (requiredTasksRaw != null && requiredTasksRaw !== "") {
    const n = Number(requiredTasksRaw);
    if (
      !Number.isFinite(n) ||
      !Number.isInteger(n) ||
      n < 1 ||
      n > MAX_REQUIRED_TASKS
    ) {
      throwVcValidation("Required tasks must be at least 1.", "apiErrors.validation.vc.milestoneRequiredTasksInvalid");
    }
    requiredTasks = n;
  }

  if (maxScore != null && passingScore != null && passingScore > maxScore) {
    throwVcValidation(
      "Passing score cannot exceed maximum score.",
      "apiErrors.validation.vc.milestonePassingExceedsMax",
    );
  }

  return {
    title,
    description,
    dueDate,
    maxScore,
    passingScore,
    rubric,
    requiredTasks,
  };
}

/** Same rules as create; UI always sends a full milestone shape on patch. */
export function normalizeVcMilestoneBodyForPatch(raw) {
  return normalizeVcMilestoneBodyForCreate(raw);
}

function normalizeLabels(raw) {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [];
  if (list.length > MAX_LABELS) {
    throwVcValidation("Too many labels.", "apiErrors.validation.vc.taskLabelsInvalid");
  }
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const s = String(item ?? "").trim().toUpperCase();
    if (!s) continue;
    if (s.length > MAX_LABEL_LEN || !LABEL_RE.test(s)) {
      throwVcValidation("Invalid label.", "apiErrors.validation.vc.taskLabelsInvalid");
    }
    if (!KNOWN_TASK_LABELS.has(s)) {
      throwVcValidation("Unsupported label.", "apiErrors.validation.vc.taskLabelsInvalid");
    }
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function normalizeRequirementsList(raw) {
  if (raw == null) return null;
  if (!Array.isArray(raw)) {
    throwVcValidation("Invalid requirements.", "apiErrors.validation.vc.taskRequirementsInvalid");
  }
  if (raw.length > MAX_REQUIREMENTS) {
    throwVcValidation("Too many requirements.", "apiErrors.validation.vc.taskRequirementsInvalid");
  }
  const lines = [];
  for (const row of raw) {
    const line = String(row ?? "").trim();
    if (!line) continue;
    if (line.length > MAX_REQUIREMENT_LINE_LEN) {
      throwVcValidation("A requirement line is too long.", "apiErrors.validation.vc.taskRequirementsInvalid");
    }
    lines.push(line);
  }
  return lines.length ? lines : null;
}

function normalizePriority(raw) {
  const p = String(raw ?? "MEDIUM").trim().toUpperCase();
  if (!TASK_PRIORITIES.has(p)) {
    throwVcValidation("Invalid priority.", "apiErrors.validation.vc.taskPriorityInvalid");
  }
  return p;
}

/**
 * Drops unknown fields; omits milestoneId / requirementsChecklist (not in TaskRequest).
 * @param {Record<string, unknown>} raw
 */
export function normalizeVcTaskCreateBody(raw) {
  const title = String(raw?.title ?? "").trim();
  if (!title) {
    throwVcValidation("Task title is required.", "apiErrors.validation.vc.taskTitleRequired");
  }
  if (title.length > MAX_TITLE_LEN) {
    throwVcValidation("Task title is too long.", "apiErrors.validation.vc.taskTitleMaxLen");
  }

  const descriptionRaw = raw?.description;
  const description =
    descriptionRaw == null || descriptionRaw === ""
      ? null
      : String(descriptionRaw).trim();
  if (description && description.length > MAX_DESCRIPTION_LEN) {
    throwVcValidation("Description is too long.", "apiErrors.validation.vc.taskDescriptionMaxLen");
  }

  const milestoneNumber = parseOptionalPositiveInt(
    raw?.milestoneNumber,
    "apiErrors.validation.vc.taskMilestoneNumberInvalid",
  );

  const priority = normalizePriority(raw?.priority);
  const labels = normalizeLabels(raw?.labels);
  const dueDate = assertValidIsoInstant(
    raw?.dueDate,
    "apiErrors.validation.vc.taskDueDateInvalid",
  );

  const estimatedHours = parseOptionalNonNegativeInt(
    raw?.estimatedHours,
    "apiErrors.validation.vc.taskNumericFieldInvalid",
  );
  if (estimatedHours != null && estimatedHours > MAX_ESTIMATED_HOURS) {
    throwVcValidation("Estimated hours is too large.", "apiErrors.validation.vc.taskNumericFieldInvalid");
  }

  const maxScore = parseOptionalNonNegativeInt(
    raw?.maxScore,
    "apiErrors.validation.vc.taskNumericFieldInvalid",
  );

  const requirements = normalizeRequirementsList(raw?.requirements);

  const body = {
    title,
    description,
    priority,
    labels,
    dueDate,
    estimatedHours,
    maxScore,
  };
  if (milestoneNumber != null) body.milestoneNumber = milestoneNumber;
  if (requirements != null) body.requirements = requirements;
  return body;
}

function trimOrNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/**
 * @param {Record<string, unknown>} raw
 */
export function normalizeVcSubmissionBody(raw) {
  const description = trimOrNull(raw?.description);
  if (description && description.length > MAX_SUBMISSION_DESC_LEN) {
    throwVcValidation("Submission description is too long.", "apiErrors.validation.vc.submissionDescriptionMaxLen");
  }

  const branchName = trimOrNull(raw?.branchName);
  if (branchName) {
    const badCtrl = [...branchName].some((ch) => {
      const c = ch.charCodeAt(0);
      return (c < 32 && c !== 9) || c === 127;
    });
    if (branchName.length > 512 || badCtrl) {
      throwVcValidation("Invalid branch name.", "apiErrors.validation.vc.submissionBranchInvalid");
    }
  }

  const commitHash = trimOrNull(raw?.commitHash);
  if (commitHash) {
    if (!COMMIT_HASH_RE.test(commitHash)) {
      throwVcValidation("Invalid commit hash.", "apiErrors.validation.vc.submissionCommitInvalid");
    }
  }

  const pullRequestUrl = trimOrNull(raw?.pullRequestUrl);
  if (pullRequestUrl) {
    try {
      const u = new URL(pullRequestUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        throwVcValidation("Pull request URL must be http(s).", "apiErrors.validation.vc.submissionUrlInvalid");
      }
    } catch {
      throwVcValidation("Invalid pull request URL.", "apiErrors.validation.vc.submissionUrlInvalid");
    }
  }

  let pullRequestId = null;
  const prIdRaw =
    raw?.pullRequestId ??
    raw?.pull_request_id ??
    raw?.submissionPullRequestId;
  if (prIdRaw != null && prIdRaw !== "") {
    const normalized = trimOrNull(prIdRaw);
    if (!normalized || normalized.length > 128) {
      throwVcValidation(
        "Invalid pull request id.",
        "apiErrors.validation.vc.submissionPullRequestIdInvalid",
      );
    }
    pullRequestId = normalized;
  }

  let files = [];
  if (raw?.files != null) {
    if (!Array.isArray(raw.files)) {
      throwVcValidation("Files must be a list.", "apiErrors.validation.vc.submissionFilesInvalid");
    }
    if (raw.files.length > MAX_SUBMISSION_FILES) {
      throwVcValidation("Too many file entries.", "apiErrors.validation.vc.submissionFilesInvalid");
    }
    files = raw.files.map((f) => {
      const entry = trimOrNull(f);
      if (!entry) {
        throwVcValidation("File entry cannot be empty.", "apiErrors.validation.vc.submissionFilesInvalid");
      }
      if (entry.length > MAX_FILE_ENTRY_LEN) {
        throwVcValidation("A file entry is too long.", "apiErrors.validation.vc.submissionFilesInvalid");
      }
      return entry;
    });
  }

  const hasSignal =
    pullRequestId != null ||
    Boolean(description) ||
    Boolean(branchName) ||
    Boolean(commitHash) ||
    Boolean(pullRequestUrl) ||
    files.length > 0;
  if (!hasSignal) {
    throwVcValidation(
      "Add a pull request id, PR link, description, branch, commit, or file paths.",
      "apiErrors.validation.vc.submissionNeedsArtifact",
    );
  }

  return {
    ...(description ? { description } : {}),
    ...(branchName ? { branchName } : {}),
    ...(commitHash ? { commitHash } : {}),
    ...(pullRequestUrl ? { pullRequestUrl } : {}),
    ...(pullRequestId != null ? { pullRequestId } : {}),
    ...(files.length ? { files } : {}),
  };
}

/**
 * @param {Record<string, unknown>} raw
 */
export function normalizeVcReviewBody(raw) {
  const feedback = trimOrNull(raw?.feedback);
  if (feedback && feedback.length > MAX_FEEDBACK_LEN) {
    throwVcValidation("Feedback is too long.", "apiErrors.validation.vc.reviewFeedbackMaxLen");
  }

  let score = null;
  if (raw?.score != null && raw.score !== "") {
    const n = Number(raw.score);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > MAX_SCORE_VALUE) {
      throwVcValidation("Invalid review score.", "apiErrors.validation.vc.reviewScoreInvalid");
    }
    score = n;
  }

  const approved = Boolean(raw?.approved);

  let checkedRequirements = [];
  if (raw?.checkedRequirements != null) {
    if (!Array.isArray(raw.checkedRequirements)) {
      throwVcValidation("Invalid checklist.", "apiErrors.validation.vc.reviewChecklistInvalid");
    }
    if (raw.checkedRequirements.length > MAX_REVIEW_CHECKED) {
      throwVcValidation("Too many checklist items.", "apiErrors.validation.vc.reviewChecklistInvalid");
    }
    checkedRequirements = raw.checkedRequirements.map((item) => {
      const s = trimOrNull(item);
      if (!s) {
        throwVcValidation("Invalid checklist entry.", "apiErrors.validation.vc.reviewChecklistInvalid");
      }
      if (s.length > MAX_REVIEW_CHECKED_LINE_LEN) {
        throwVcValidation("Checklist entry is too long.", "apiErrors.validation.vc.reviewChecklistInvalid");
      }
      return s;
    });
  }

  let pullRequestId = null;
  const revPrRaw =
    raw?.pullRequestId ?? raw?.pull_request_id ?? raw?.submissionPullRequestId;
  if (revPrRaw != null && revPrRaw !== "") {
    const n = Number(String(revPrRaw).trim());
    if (
      !Number.isFinite(n) ||
      !Number.isInteger(n) ||
      n < 1 ||
      n > MAX_PULL_REQUEST_ID
    ) {
      throwVcValidation(
        "Invalid pull request id.",
        "apiErrors.validation.vc.reviewPullRequestIdInvalid",
      );
    }
    pullRequestId = n;
  }

  const out = { approved };
  if (feedback) out.feedback = feedback;
  if (score != null) out.score = score;
  if (checkedRequirements.length) out.checkedRequirements = checkedRequirements;
  if (pullRequestId != null) out.pullRequestId = pullRequestId;
  return out;
}

export function assertVcAssignUsernames(actorUsername, assigneeUsername) {
  const actor = String(actorUsername ?? "").trim();
  const assignee = String(assigneeUsername ?? "").trim();
  if (!USERNAME_RE.test(actor)) {
    throwVcValidation("Invalid actor username.", "apiErrors.validation.vc.assignUsernameInvalid");
  }
  if (!USERNAME_RE.test(assignee)) {
    throwVcValidation("Invalid assignee username.", "apiErrors.validation.vc.assignUsernameInvalid");
  }
}
