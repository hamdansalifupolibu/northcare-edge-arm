import type { ColorPalette, HexColor, SemanticColors } from './theme.types';

/**
 * Approved NorthCare AI brand and status colours.
 * Values align with Stitch `03_DESIGN_TOKENS.json` and product-approved palette.
 */
export const colors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryDarker: '#064E49',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  background: '#F7FAF9',
  surface: '#FFFFFF',
  textPrimary: '#17211F',
  textSecondary: '#52615E',
  textInverse: '#FFFFFF',
  border: '#DDE7E4',
  mutedSurface: '#EEF5F3',
  danger: '#B42318',
  dangerBackground: '#FEE4E2',
  warning: '#B54708',
  warningBackground: '#FEF0C7',
  success: '#067647',
  successBackground: '#D1FADF',
  info: '#1570EF',
  disabled: '#98A9A5',
  disabledBackground: '#E8EFED',
  overlay: '#17211F',
} as const satisfies ColorPalette;

/**
 * Build semantic aliases from any palette (light or dark).
 */
export function createSemanticColors(palette: ColorPalette, isDark = false): SemanticColors {
  return {
    background: {
      primary: palette.background,
      secondary: palette.mutedSurface,
    },
    surface: {
      primary: palette.surface,
      muted: palette.mutedSurface,
    },
    text: {
      primary: palette.textPrimary,
      secondary: palette.textSecondary,
      inverse: palette.textInverse,
      disabled: palette.disabled,
    },
    border: {
      default: palette.border,
      strong: palette.primaryDark,
    },
    action: {
      primary: palette.primary,
      primaryPressed: palette.primaryDark,
      primaryDarker: palette.primaryDarker,
      accent: palette.accent,
      disabled: palette.disabled,
      disabledBackground: palette.disabledBackground,
      destructive: palette.danger,
      destructiveBackground: palette.dangerBackground,
    },
    status: {
      urgent: palette.danger,
      urgentBackground: palette.dangerBackground,
      warning: palette.warning,
      warningBackground: palette.warningBackground,
      stable: palette.success,
      stableBackground: palette.successBackground,
      info: palette.info,
      infoBackground: isDark ? '#1A3050' : '#DBEAFE',
      offline: palette.textSecondary,
      offlineBackground: palette.mutedSurface,
    },
  };
}

/** Mint/teal accent surfaces used in worker feature cards and banners. */
export function themedFeatureIconBackground(
  palette: ColorPalette,
  isDark: boolean,
  lightTint: HexColor,
): HexColor {
  return isDark ? palette.mutedSurface : lightTint;
}

export function themedQuickActionCardBackground(
  palette: ColorPalette,
  isDark: boolean,
  lightTint: HexColor,
): HexColor {
  return isDark ? palette.mutedSurface : lightTint;
}

export function themedMintSurface(palette: ColorPalette, isDark: boolean): HexColor {
  return isDark ? palette.mutedSurface : '#E6F7F5';
}

export function themedMintBorder(palette: ColorPalette, isDark: boolean): HexColor {
  return isDark ? palette.border : '#C5E3DC';
}

export function themedSecurityBanner(palette: ColorPalette, isDark: boolean): {
  readonly background: HexColor;
  readonly border: HexColor;
} {
  return isDark
    ? { background: palette.mutedSurface, border: palette.border }
    : { background: '#E8F5F0', border: '#C5E3DC' };
}

/**
 * Semantic aliases — prefer useThemeMode().semantic in components that must react to light/dark.
 */
export const semanticColors = createSemanticColors(colors, false);
