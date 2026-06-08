import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import i18n, { setDocumentDirection } from "../i18n";

const STORAGE_KEY = "app_language";
const SUPPORTED_LANGUAGES = ["en", "prs", "ps"];

function normalizeLanguage(value) {
  if (value === "fa") return "prs";
  return SUPPORTED_LANGUAGES.includes(value) ? value : "en";
}

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
});

export const LanguageProvider = ({ children, defaultLang }) => {
  const initial =
    typeof window !== "undefined"
      ? normalizeLanguage(
          window.localStorage.getItem(STORAGE_KEY) ||
            defaultLang ||
            i18n.language,
        )
      : normalizeLanguage(defaultLang || i18n.language);

  const [lang, setLangState] = useState(initial);

  const setLang = useCallback((next) => {
    const nextLang = normalizeLanguage(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLang);
    } catch (e) {
      // ignore
    }
    i18n.changeLanguage(nextLang);
    setDocumentDirection(nextLang);
    setLangState(nextLang);
  }, []);

  // initialize
  useEffect(() => {
    setLang(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // listen for storage events to sync across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue && e.newValue !== lang) {
        i18n.changeLanguage(e.newValue);
        setDocumentDirection(e.newValue);
        setLangState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export default LanguageContext;
