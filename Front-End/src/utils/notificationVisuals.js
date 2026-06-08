/** @typedef {"account"|"invite"|"blog"|"repo"|"neutral"} NotificationTypeGroup */

const ACCOUNT = new Set([
  "USER_REGISTERED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "EMAIL_VERIFIED",
  "ACCOUNT_LOCKED",
]);
const INVITE = new Set(["SYSTEM_INVITATION", "REPOSITORY_INVITATION"]);
const BLOG = new Set([
  "BLOG_NEW_COMMENT",
  "BLOG_COMMENT_REPLY",
  "BLOG_POST_LIKED",
  "BLOG_POST_SHARED",
  "BLOG_POST_PUBLISHED",
]);
const REPO = new Set([
  "REPOSITORY_PUSH",
  "REPOSITORY_INVITATION_SENT",
  "REPOSITORY_INVITATION_ACCEPTED",
  "REPOSITORY_BRANCH_CREATED",
  "REPOSITORY_BRANCH_MERGED",
  "REPOSITORY_PULL_REQUEST_OPENED",
  "REPOSITORY_PULL_REQUEST_MERGED",
]);

/**
 * @param {string | undefined | null} type
 * @returns {NotificationTypeGroup}
 */
export function notificationTypeGroup(type) {
  const t = String(type ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  if (!t) return "neutral";
  if (ACCOUNT.has(t)) return "account";
  if (INVITE.has(t)) return "invite";
  if (BLOG.has(t)) return "blog";
  if (REPO.has(t)) return "repo";
  if (t === "CUSTOM") return "neutral";
  return "neutral";
}

/** Type pill — uses @theme `--color-*-notif-type-*`. */
export function notificationTypePillClasses(type) {
  const g = notificationTypeGroup(type);
  const map = {
    account:
      "border-[color:var(--color-light-notif-type-account-border)] bg-[color:var(--color-light-notif-type-account-bg)] text-[color:var(--color-light-notif-type-account-text)] dark:border-[color:var(--color-dark-notif-type-account-border)] dark:bg-[color:var(--color-dark-notif-type-account-bg)] dark:text-[color:var(--color-dark-notif-type-account-text)]",
    invite:
      "border-[color:var(--color-light-notif-type-invite-border)] bg-[color:var(--color-light-notif-type-invite-bg)] text-[color:var(--color-light-notif-type-invite-text)] dark:border-[color:var(--color-dark-notif-type-invite-border)] dark:bg-[color:var(--color-dark-notif-type-invite-bg)] dark:text-[color:var(--color-dark-notif-type-invite-text)]",
    blog:
      "border-[color:var(--color-light-notif-type-blog-border)] bg-[color:var(--color-light-notif-type-blog-bg)] text-[color:var(--color-light-notif-type-blog-text)] dark:border-[color:var(--color-dark-notif-type-blog-border)] dark:bg-[color:var(--color-dark-notif-type-blog-bg)] dark:text-[color:var(--color-dark-notif-type-blog-text)]",
    repo:
      "border-[color:var(--color-light-notif-type-repo-border)] bg-[color:var(--color-light-notif-type-repo-bg)] text-[color:var(--color-light-notif-type-repo-text)] dark:border-[color:var(--color-dark-notif-type-repo-border)] dark:bg-[color:var(--color-dark-notif-type-repo-bg)] dark:text-[color:var(--color-dark-notif-type-repo-text)]",
    neutral:
      "border-[color:var(--color-light-notif-type-neutral-border)] bg-[color:var(--color-light-notif-type-neutral-bg)] text-[color:var(--color-light-notif-type-neutral-text)] dark:border-[color:var(--color-dark-notif-type-neutral-border)] dark:bg-[color:var(--color-dark-notif-type-neutral-bg)] dark:text-[color:var(--color-dark-notif-type-neutral-text)]",
  };
  return map[g] ?? map.neutral;
}

/** Left border accent by delivery channel */
export function notificationChannelStripeClass(channel) {
  const c = String(channel ?? "")
    .trim()
    .toUpperCase();
  switch (c) {
    case "IN_APP":
      return "border-l-[color:var(--color-light-notif-channel-in-app)] dark:border-l-[color:var(--color-dark-notif-channel-in-app)]";
    case "EMAIL":
      return "border-l-[color:var(--color-light-notif-channel-email)] dark:border-l-[color:var(--color-dark-notif-channel-email)]";
    case "PUSH":
      return "border-l-[color:var(--color-light-notif-channel-push)] dark:border-l-[color:var(--color-dark-notif-channel-push)]";
    case "SMS":
      return "border-l-[color:var(--color-light-notif-channel-sms)] dark:border-l-[color:var(--color-dark-notif-channel-sms)]";
    default:
      return "border-l-[color:var(--color-light-text-muted)]/40 dark:border-l-[color:var(--color-dark-text-muted)]/40";
  }
}

/** Small channel capsule (muted) */
export function notificationChannelPillClasses(channel) {
  const c = String(channel ?? "")
    .trim()
    .toUpperCase();
  switch (c) {
    case "IN_APP":
      return "border-[color:var(--color-light-notif-channel-in-app-border)] bg-[color:var(--color-light-notif-channel-in-app-soft)] text-[color:var(--color-light-notif-channel-in-app-text)] dark:border-[color:var(--color-dark-notif-channel-in-app-border)] dark:bg-[color:var(--color-dark-notif-channel-in-app-soft)] dark:text-[color:var(--color-dark-notif-channel-in-app-text)]";
    case "EMAIL":
      return "border-[color:var(--color-light-notif-channel-email-border)] bg-[color:var(--color-light-notif-channel-email-soft)] text-[color:var(--color-light-notif-channel-email-text)] dark:border-[color:var(--color-dark-notif-channel-email-border)] dark:bg-[color:var(--color-dark-notif-channel-email-soft)] dark:text-[color:var(--color-dark-notif-channel-email-text)]";
    case "PUSH":
      return "border-[color:var(--color-light-notif-channel-push-border)] bg-[color:var(--color-light-notif-channel-push-soft)] text-[color:var(--color-light-notif-channel-push-text)] dark:border-[color:var(--color-dark-notif-channel-push-border)] dark:bg-[color:var(--color-dark-notif-channel-push-soft)] dark:text-[color:var(--color-dark-notif-channel-push-text)]";
    case "SMS":
      return "border-[color:var(--color-light-notif-channel-sms-border)] bg-[color:var(--color-light-notif-channel-sms-soft)] text-[color:var(--color-light-notif-channel-sms-text)] dark:border-[color:var(--color-dark-notif-channel-sms-border)] dark:bg-[color:var(--color-dark-notif-channel-sms-soft)] dark:text-[color:var(--color-dark-notif-channel-sms-text)]";
    default:
      return "border-(--color-light-card-border) bg-(--color-light-app-secondary) text-(--color-light-text-secondary) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-app-secondary) dark:text-(--color-dark-text-secondary)";
  }
}
