import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface NotificationPrefs {
  likes: boolean;
  follows: boolean;
  comments: boolean;
  mentions: boolean;
  reposts: boolean;
  sound: boolean;
}

export interface DisplayPrefs {
  fontSize: "sm" | "base" | "lg";
  reducedMotion: boolean;
}

const THEME_KEY = "app.theme";
const NOTIF_KEY = "app.notifications";
const DISPLAY_KEY = "app.display";

const defaultNotif: NotificationPrefs = {
  likes: true,
  follows: true,
  comments: true,
  mentions: true,
  reposts: true,
  sound: false,
};

const defaultDisplay: DisplayPrefs = {
  fontSize: "base",
  reducedMotion: false,
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export function applyDisplay(display: DisplayPrefs) {
  const root = document.documentElement;
  const map = { sm: "14px", base: "16px", lg: "18px" };
  root.style.fontSize = map[display.fontSize];
  root.classList.toggle("reduce-motion", display.reducedMotion);
}

export function useSettings() {
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (localStorage.getItem(THEME_KEY) as ThemeMode) || "light"
  );
  const [notifications, setNotificationsState] = useState<NotificationPrefs>(
    () => readJSON(NOTIF_KEY, defaultNotif)
  );
  const [display, setDisplayState] = useState<DisplayPrefs>(
    () => readJSON(DISPLAY_KEY, defaultDisplay)
  );

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    applyDisplay(display);
    localStorage.setItem(DISPLAY_KEY, JSON.stringify(display));
  }, [display]);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), []);
  const setNotification = useCallback(
    (key: keyof NotificationPrefs, value: boolean) =>
      setNotificationsState((prev) => ({ ...prev, [key]: value })),
    []
  );
  const setDisplay = useCallback(
    <K extends keyof DisplayPrefs>(key: K, value: DisplayPrefs[K]) =>
      setDisplayState((prev) => ({ ...prev, [key]: value })),
    []
  );

  return { theme, setTheme, notifications, setNotification, display, setDisplay };
}
