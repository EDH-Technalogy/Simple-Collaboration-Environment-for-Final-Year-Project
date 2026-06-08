const subscribers = new Set();
const completing = new Set();

export function subscribeCompleting(cb) {
  subscribers.add(cb);
  try {
    cb(new Set(completing));
  } catch {}
  return () => subscribers.delete(cb);
}

export function addCompleting(taskNumber) {
  const key = String(taskNumber);
  completing.add(key);
  for (const cb of subscribers) {
    try {
      cb(new Set(completing));
    } catch {}
  }
}

export function removeCompleting(taskNumber) {
  const key = String(taskNumber);
  completing.delete(key);
  for (const cb of subscribers) {
    try {
      cb(new Set(completing));
    } catch {}
  }
}

export function hasCompleting(taskNumber) {
  return completing.has(String(taskNumber));
}

export function getCompletingSet() {
  return new Set(completing);
}

export default {
  subscribeCompleting,
  addCompleting,
  removeCompleting,
  hasCompleting,
  getCompletingSet,
};
