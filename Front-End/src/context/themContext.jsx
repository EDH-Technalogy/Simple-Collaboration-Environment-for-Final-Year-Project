import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "theme";
const APPEARANCE_OPTIONS = ["light", "dark", "system"];

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function normalizeAppearance(value) {
  return APPEARANCE_OPTIONS.includes(value) ? value : "system";
}

export const ThemeProvider = ({ children }) => {
  const [appearance, setAppearanceState] = useState("system");
  const [theme, setTheme] = useState("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let savedAppearance = "system";

    try {
      savedAppearance = normalizeAppearance(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      savedAppearance = "system";
    }

    setAppearanceState(savedAppearance);
    setTheme(savedAppearance === "system" ? getSystemTheme() : savedAppearance);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const resolvedTheme = appearance === "system" ? getSystemTheme() : appearance;
    setTheme(resolvedTheme);

    try {
      localStorage.setItem(STORAGE_KEY, appearance);
    } catch (e) {
      // ignore storage failures
    }

    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [appearance, isInitialized]);

  useEffect(() => {
    if (!isInitialized || appearance !== "system" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = (event) => {
      const resolvedTheme = event.matches ? "dark" : "light";
      setTheme(resolvedTheme);

      if (resolvedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    media.addEventListener?.("change", onSystemThemeChange);
    return () => media.removeEventListener?.("change", onSystemThemeChange);
  }, [appearance, isInitialized]);

  const setAppearance = (nextAppearance) => {
    setAppearanceState(normalizeAppearance(nextAppearance));
  };

  const toggleTheme = () => {
    setAppearanceState((prevAppearance) => {
      const currentTheme =
        prevAppearance === "system" ? getSystemTheme() : prevAppearance;
      return currentTheme === "light" ? "dark" : "light";
    });
  };

  return (
    <ThemeContext.Provider
      value={{ theme, appearance, setAppearance, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
