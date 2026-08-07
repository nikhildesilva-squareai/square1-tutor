"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark" | "system";

// Dark mode is an APP-SHELL feature. The public funnel (landing, diagnostic,
// /try, signup, business, research…) is designed light-only — applying .dark
// there flips the token-driven surfaces (body → near-black) under pages whose
// text is hardcoded light-design navy, producing the half-dark mess seen on
// OS-dark phones. So the class only ever applies on these authed surfaces.
// (/portfolio is deliberately absent: /portfolio/[studentId] is a public share.)
const DARK_SURFACES = [
  "/dashboard", "/learn", "/courses", "/projects", "/progress", "/settings",
  "/notes", "/tutor", "/messages", "/community", "/certificate", "/inbox", "/admin",
  "/career",
];
function isAppSurface(pathname: string): boolean {
  return DARK_SURFACES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

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
  const pathname = usePathname();

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sq1-theme") as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  // Apply theme class to <html> — but only on app surfaces (see DARK_SURFACES).
  // pathname is a dependency so client-side navigation between the app and the
  // public site adds/removes the class at the boundary in both directions.
  useEffect(() => {
    function apply() {
      let active: "light" | "dark";
      if (theme === "system") {
        active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        active = theme;
      }
      setResolved(active);
      document.documentElement.classList.toggle("dark", active === "dark" && isAppSurface(pathname));
    }

    apply();

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") apply(); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, pathname]);

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
