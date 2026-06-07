"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  COLOR_THEME_STORAGE_KEY,
  COLOR_THEMES,
  DEFAULT_COLOR_THEME,
  isColorThemeId,
  type ColorThemeId,
} from "@/lib/constants/color-themes";

interface ColorThemeContextValue {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
  ready: boolean;
}

const ColorThemeContext = createContext<ColorThemeContextValue>({
  colorTheme: DEFAULT_COLOR_THEME,
  setColorTheme: () => undefined,
  ready: false,
});

function applyColorTheme(theme: ColorThemeId) {
  document.documentElement.setAttribute("data-color", theme);
}

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] =
    useState<ColorThemeId>(DEFAULT_COLOR_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (stored && isColorThemeId(stored)) {
      setColorThemeState(stored);
      applyColorTheme(stored);
    } else {
      applyColorTheme(DEFAULT_COLOR_THEME);
    }
    setReady(true);
  }, []);

  const setColorTheme = (theme: ColorThemeId) => {
    if (!COLOR_THEMES.some((item) => item.id === theme)) return;
    setColorThemeState(theme);
    applyColorTheme(theme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, ready }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  return useContext(ColorThemeContext);
}
