import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { colors as lightColors, createSemanticColors } from './colors';
import type { ColorPalette, SemanticColors } from './theme.types';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'northcare.theme-mode.v1';

export type ThemePalette = ColorPalette;

const darkPalette: ColorPalette = {
  primary: lightColors.primary,
  primaryDark: lightColors.primaryDark,
  primaryDarker: lightColors.primaryDarker,
  accent: lightColors.accent,
  accentLight: '#3D3208',
  background: '#0F1715',
  surface: '#1A2422',
  mutedSurface: '#24302D',
  textPrimary: '#F0F5F4',
  textSecondary: '#A8B5B2',
  // On primary/accent surfaces (teal, amber) — keep light for contrast in both modes.
  textInverse: '#FFFFFF',
  border: '#2E3B38',
  danger: lightColors.danger,
  dangerBackground: '#3D1512',
  warning: lightColors.warning,
  warningBackground: '#3D2A0A',
  success: lightColors.success,
  successBackground: '#0F3328',
  info: lightColors.info,
  disabled: lightColors.disabled,
  disabledBackground: '#2A3533',
  overlay: lightColors.overlay,
};

type ThemeModeContextValue = {
  readonly mode: ThemeMode;
  readonly colors: ThemePalette;
  readonly semantic: SemanticColors;
  readonly isDark: boolean;
  readonly toggleMode: () => void;
  readonly setMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { readonly children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const value = useMemo<ThemeModeContextValue>(() => {
    const palette = mode === 'dark' ? darkPalette : lightColors;
    return {
      mode,
      colors: palette,
      semantic: createSemanticColors(palette, mode === 'dark'),
      isDark: mode === 'dark',
      toggleMode,
      setMode,
    };
  }, [mode, setMode, toggleMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return context;
}
