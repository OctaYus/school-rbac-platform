"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const COLOR_THEMES = [
  { id: "default", label: "Scholaris", from: "#6366f1", to: "#7c3aed" },
  { id: "school", label: "School", from: "#2563eb", to: "#1d4ed8" },
  { id: "bug-bounty", label: "Bug Bounty", from: "#4ade80", to: "#16a34a" },
  { id: "ocean", label: "Ocean", from: "#06b6d4", to: "#0e7490" },
  { id: "sunset", label: "Sunset", from: "#f97316", to: "#e11d48" },
  { id: "forest", label: "Forest", from: "#16a34a", to: "#15803d" },
  { id: "rose", label: "Rose", from: "#f43f5e", to: "#be185d" },
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number]["id"];

const STORAGE_KEY = "scholaris-color-theme";

function applyTheme(theme: ColorTheme) {
  const el = document.documentElement;
  if (theme === "default") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", theme);
}

interface ColorThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextValue>({
  theme: "default",
  setTheme: () => {},
});

export const useColorTheme = () => useContext(ColorThemeContext);

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>("default");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ColorTheme | null;
    const valid = saved && COLOR_THEMES.some((t) => t.id === saved) ? saved : "default";
    setThemeState(valid);
    applyTheme(valid);
  }, []);

  function setTheme(next: ColorTheme) {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <ColorThemeContext.Provider value={{ theme, setTheme }}>{children}</ColorThemeContext.Provider>
  );
}
