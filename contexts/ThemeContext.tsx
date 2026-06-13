import {
  darkColors,
  lightColors,
  ThemeColors,
} from "@/constants/theme";
import { getDatabase, getMeta, initDatabase, setMeta } from "@/db/database";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

// User-facing preference. "system" defers to the OS setting; the others force it.
export type ThemeMode = "system" | "light" | "dark";

const META_KEY = "theme_mode";

interface ThemeContextValue {
  mode: ThemeMode; // what the user picked
  isDark: boolean; // resolved scheme
  colors: ThemeColors; // active palette
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProviderCustom: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Load the persisted preference once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        const stored = await getMeta(db, META_KEY);
        if (active && (stored === "light" || stored === "dark" || stored === "system")) {
          setModeState(stored);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    (async () => {
      try {
        const db = await getDatabase();
        await setMeta(db, META_KEY, next);
      } catch (error) {
        console.error("Failed to persist theme preference:", error);
      }
    })();
  }, []);

  const isDark =
    mode === "system" ? systemScheme === "dark" : mode === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setMode,
    }),
    [mode, isDark, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProviderCustom");
  }
  return ctx;
};

/**
 * Builds a themed StyleSheet from a factory, memoized by the active palette.
 * Usage:
 *   const styles = useThemedStyles(makeStyles);
 *   const makeStyles = (c: ThemeColors) => StyleSheet.create({ ... });
 */
export const useThemedStyles = <T,>(factory: (colors: ThemeColors) => T): T => {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
};
