import type { TextStyleToken, TypographyTokens } from './theme.types';

/** Loaded font family names used with expo-font / @expo-google-fonts. */
export const FONT_FAMILY = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  /** Android-safe fallback when custom fonts fail to load */
  systemFallback: 'sans-serif',
} as const;

function style(
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyleToken['fontWeight'],
  letterSpacing = 0,
): TextStyleToken {
  return { fontFamily, fontSize, lineHeight, fontWeight, letterSpacing };
}

/**
 * Typography from Stitch DESIGN_TOKENS + health_worker_empowerment scale.
 * Font scaling remains enabled (allowFontScaling default true).
 * Font binaries are loaded via `fonts.ts` + App.tsx useFonts.
 */
export const typography = {
  fontFamily: FONT_FAMILY,
  styles: {
    displayLarge: style(FONT_FAMILY.bold, 32, 40, '700', -0.2),
    headingLarge: style(FONT_FAMILY.bold, 26, 34, '700', -0.1),
    headingMedium: style(FONT_FAMILY.semiBold, 22, 30, '600'),
    headingSmall: style(FONT_FAMILY.semiBold, 20, 28, '600'),
    title: style(FONT_FAMILY.semiBold, 18, 26, '600'),
    bodyLarge: style(FONT_FAMILY.regular, 16, 24, '400'),
    body: style(FONT_FAMILY.regular, 14, 22, '400'),
    bodyStrong: style(FONT_FAMILY.semiBold, 14, 22, '600'),
    caption: style(FONT_FAMILY.regular, 13, 18, '400'),
    label: style(FONT_FAMILY.medium, 12, 16, '500', 0.2),
    button: style(FONT_FAMILY.semiBold, 16, 22, '600'),
    riskLabel: style(FONT_FAMILY.bold, 14, 18, '700', 0.4),
    numericHighlight: style(FONT_FAMILY.bold, 28, 34, '700', -0.3),
  },
} as const satisfies TypographyTokens;
