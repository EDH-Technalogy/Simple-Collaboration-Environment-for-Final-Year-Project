export const STORAGE_KEY = "edu_student_engagement_v1";

/** @typedef {{ version: 1; dailyMs: Record<string, number>; lastPath?: string; lastBump?: number }} EngagementState */

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function loadEngagement() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return /** @type {EngagementState} */ ({
        version: 1,
        dailyMs: {},
        lastBump: Date.now(),
      });
    }
    const p = JSON.parse(raw);
    if (!p || p.version !== 1 || typeof p.dailyMs !== "object") {
      return /** @type {EngagementState} */ ({
        version: 1,
        dailyMs: {},
        lastBump: Date.now(),
      });
    }
    return /** @type {EngagementState} */ ({
      version: 1,
      dailyMs: { ...p.dailyMs },
      lastPath: typeof p.lastPath === "string" ? p.lastPath : "",
      lastBump: typeof p.lastBump === "number" ? p.lastBump : Date.now(),
    });
  } catch {
    return /** @type {EngagementState} */ ({
      version: 1,
      dailyMs: {},
      lastBump: Date.now(),
    });
  }
}

export function persistEngagement(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function accumulateMs(ms, pathname) {
  const st = loadEngagement();
  const day = todayKey();
  st.dailyMs[day] = (st.dailyMs[day] ?? 0) + ms;
  st.lastBump = Date.now();
  if (pathname) st.lastPath = pathname;
  persistEngagement(st);
}

export function readEngagementDailyMs() {
  return loadEngagement().dailyMs;
}

export { todayKey };
