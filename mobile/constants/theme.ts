/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const AppTheme = {
  colors: {
    background: '#0f1720',
    backgroundElevated: '#121c27',
    card: '#172331',
    cardSoft: 'rgba(255, 255, 255, 0.045)',
    cardMuted: 'rgba(255, 255, 255, 0.065)',
    border: 'rgba(148, 163, 184, 0.18)',
    borderStrong: 'rgba(148, 163, 184, 0.28)',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    textSubtle: '#94a3b8',
    primary: '#14b8a6',
    primaryStrong: '#0f766e',
    primarySoft: 'rgba(20, 184, 166, 0.14)',
    primaryBorder: 'rgba(20, 184, 166, 0.34)',
    success: '#34d399',
    successSoft: 'rgba(52, 211, 153, 0.14)',
    warning: '#fbbf24',
    warningSoft: 'rgba(251, 191, 36, 0.13)',
    danger: '#f87171',
    dangerSoft: 'rgba(248, 113, 113, 0.14)',
    input: 'rgba(15, 23, 32, 0.82)',
  },
  radii: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  typography: {
    eyebrowSize: 12,
    bodySize: 15,
    subtitleSize: 16,
    titleSize: 36,
    titleLineHeight: 39,
  },
};

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
