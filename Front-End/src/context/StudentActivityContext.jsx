import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { accumulateMs } from "../lib/studentEngagementStorage";

const StudentActivityContext = createContext(null);

/** @param {{ children: import("react").ReactNode }} props */
export function StudentActivityProvider({ children }) {
  const { pathname } = useLocation();
  const [revision, setRevision] = useState(0);
  const pathStartRef = useRef(Date.now());

  const bump = useCallback(() => setRevision((n) => n + 1), []);

  function flushSegment(forPathname) {
    if (!forPathname.startsWith("/student")) return;
    const now = Date.now();
    const started = pathStartRef.current;
    const delta = Math.min(Math.max(now - started, 0), 120_000);
    if (delta < 2000) return;
    accumulateMs(delta, forPathname);
    pathStartRef.current = Date.now();
    bump();
  }

  useEffect(() => {
    pathStartRef.current = Date.now();

    if (!pathname.startsWith("/student")) return undefined;

    const onHidden = () => flushSegment(pathname);

    window.addEventListener("pagehide", onHidden);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      flushSegment(pathname);
      pathStartRef.current = Date.now();
    }, 15_000);

    return () => {
      window.removeEventListener("pagehide", onHidden);
      window.clearInterval(intervalId);
      flushSegment(pathname);
    };
  }, [pathname, bump]);

  const value = useMemo(() => ({ revision, pathname }), [revision, pathname]);

  return (
    <StudentActivityContext.Provider value={value}>{children}</StudentActivityContext.Provider>
  );
}

export function useStudentActivityEpoch() {
  const ctx = useContext(StudentActivityContext);
  return ctx?.revision ?? 0;
}
