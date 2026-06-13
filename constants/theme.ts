/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Semantic color tokens consumed across every screen/component. Both palettes
 * expose the same keys so a themed StyleSheet factory can be written once and
 * render correctly in light or dark mode. The brand accent (`primary`) stays
 * constant; only the neutral surfaces/text invert.
 */
export interface ThemeColors {
  background: string; // screen background
  surface: string; // cards / white panels
  surfaceMuted: string; // subtle alt fill (progress tracks, avatar circle)
  border: string; // hairlines / outlines
  text: string; // primary text
  textSecondary: string; // secondary text
  textMuted: string; // muted labels
  textFaint: string; // faintest (chevrons, placeholders)
  primary: string; // brand accent
  primarySoft: string; // accent-tinted background
  onPrimary: string; // text/icon on top of `primary`
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  infoBorder: string;
  netWorthCard: string; // the dark "net worth" hero card
  onNetWorthCard: string;
  tabBar: string;
  tabBorder: string;
  overlay: string; // modal scrim
}

export const lightColors: ThemeColors = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F0F0",
  border: "#EFEFEF",
  text: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999",
  textFaint: "#CCCCCC",
  primary: "#FF6B6B",
  primarySoft: "#FFF5F5",
  onPrimary: "#FFFFFF",
  success: "#4CAF50",
  successSoft: "#F0FFF4",
  danger: "#FF6B6B",
  dangerSoft: "#FFF5F5",
  info: "#0070FF",
  infoSoft: "#F0F8FF",
  infoBorder: "#E0EFFF",
  netWorthCard: "#2D3748",
  onNetWorthCard: "#FFFFFF",
  tabBar: "#FFFFFF",
  tabBorder: "#EFEFEF",
  overlay: "rgba(0, 0, 0, 0.5)",
};

export const darkColors: ThemeColors = {
  background: "#0F1115",
  surface: "#1B1E24",
  surfaceMuted: "#2A2E37",
  border: "#2C313A",
  text: "#ECEDEE",
  textSecondary: "#B6BBC4",
  textMuted: "#8A909B",
  textFaint: "#5A606B",
  primary: "#FF6B6B",
  primarySoft: "#3A2729",
  onPrimary: "#FFFFFF",
  success: "#5BD16A",
  successSoft: "#1E2C22",
  danger: "#FF7B7B",
  dangerSoft: "#3A2729",
  info: "#4D9BFF",
  infoSoft: "#16233A",
  infoBorder: "#243a5a",
  netWorthCard: "#21262E",
  onNetWorthCard: "#FFFFFF",
  tabBar: "#15171B",
  tabBorder: "#2C313A",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
