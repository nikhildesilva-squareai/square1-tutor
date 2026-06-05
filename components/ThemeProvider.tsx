"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}>({ theme: "system", resolved: "light", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sq1-theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    function apply() {
      let active: "light" | "dark";
      if (theme === "system") {
        active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        active = theme;
      }
      setResolved(active);
      document.documentElement.classList.toggle("dark", active === "dark");
    }

    apply();

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") apply(); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("sq1-theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
