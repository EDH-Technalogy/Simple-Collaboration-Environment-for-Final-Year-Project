import { useMemo } from "react";

function activityEvent(event) {
  if (!event || typeof event !== "object") return event;
  const nested = event.json ?? event.payload ?? event.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...event, ...nested };
  }
  if (typeof nested === "string") {
    try {
      const parsed = JSON.parse(nested);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...event, ...parsed };
      }
    } catch {
      return event;
    }
  }
  return event;
}

function eventTimestamp(event) {
  const ev = activityEvent(event);
  if (!ev || typeof ev !== "object") return 0;
  const raw =
    ev.timestamp ??
    ev.time ??
    ev.createdAt ??
    ev.created_at ??
    ev.date ??
    ev.occurredAt ??
    ev.occurred_at ??
    ev.updatedAt ??
    "";
  const date = typeof raw === "number" ? new Date(raw) : new Date(String(raw));
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function positiveNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function isoDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function blankDetails() {
  return {
    commits: 0,
    pushes: 0,
    pulls: 0,
    merges: 0,
    tasks: 0,
    operations: 0,
  };
}

function eventBreakdown(event) {
  const ev = activityEvent(event);
  const typeRaw = String(
    ev?.eventType ??
      ev?.event_type ??
      ev?.type ??
      ev?.kind ??
      ev?.action ??
      ev?.metadata?.displayType ??
      "",
  ).toLowerCase();
  const actionRaw = String(ev?.action ?? ev?.status ?? ev?.state ?? "")
    .toLowerCase();
  const hay = JSON.stringify(ev ?? {}).toLowerCase();
  const counts = blankDetails();
  const isTask =
    hay.includes("task") &&
    (hay.includes("completed") || hay.includes("complete"));
  const isMerge =
    typeRaw.includes("merge") ||
    actionRaw.includes("merge") ||
    hay.includes("pull_request_merged") ||
    hay.includes("merged pull request") ||
    hay.includes(" merged ");
  const isPull =
    typeRaw.includes("pull_request") ||
    typeRaw.includes("pull") ||
    hay.includes("pull request") ||
    hay.includes("/pulls/");
  const isPush =
    typeRaw.includes("repository_push") ||
    typeRaw.includes("repository_pushed") ||
    typeRaw.includes("push") ||
    hay.includes(" pushed ");
  const isCommit =
    typeRaw.includes("commit") ||
    Boolean(ev?.commitId ?? ev?.commit_id) ||
    hay.includes("commitid") ||
    hay.includes("commitmessage");
  const commitCount = positiveNumber(
    ev?.commitCount,
    ev?.commit_count,
    ev?.commitsCount,
    ev?.commits_count,
    Array.isArray(ev?.commits) ? ev.commits.length : 0,
  );

  if (isMerge) counts.merges += 1;
  else if (isPull) counts.pulls += 1;

  if (isPush) counts.pushes += 1;
  if (isPush || isCommit) counts.commits += commitCount || 1;
  if (isTask) counts.tasks += 1;

  if (
    counts.commits +
      counts.pushes +
      counts.pulls +
      counts.merges +
      counts.tasks ===
    0
  ) {
    counts.operations += 1;
  }

  return counts;
}

export default function useActivityHeatmap(events) {
  return useMemo(() => {
    const counts = {};
    const details = {};
    for (const event of Array.isArray(events) ? events : []) {
      const time = eventTimestamp(event);
      if (!time) continue;
      const key = isoDay(new Date(time));
      const breakdown = eventBreakdown(event);
      const value = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
      counts[key] = (counts[key] ?? 0) + value;
      details[key] = details[key] ?? blankDetails();
      for (const [kind, amount] of Object.entries(breakdown)) {
        details[key][kind] = (details[key][kind] ?? 0) + amount;
      }
    }

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - 364);
    const days = Array.from({ length: start.getDay() }, () => null);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = isoDay(d);
      days.push({
        key,
        date: new Date(d),
        value: counts[key] ?? 0,
        details: details[key] ?? blankDetails(),
      });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    const filledDays = days.filter(Boolean);
    return {
      weeks,
      total: filledDays.reduce((sum, day) => sum + day.value, 0),
      max: Math.max(1, ...filledDays.map((day) => day.value)),
    };
  }, [events]);
}
