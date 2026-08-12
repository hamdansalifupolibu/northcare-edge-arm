import { borders } from './borders';
import { colors, semanticColors } from './colors';
import { layout } from './layout';
import { motion } from './motion';
import { opacity } from './opacity';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import type { Theme } from './theme.types';
import { typography } from './typography';

export { borders } from './borders';
export { colors, semanticColors, createSemanticColors, themedMintSurface, themedMintBorder, themedSecurityBanner, themedFeatureIconBackground, themedQuickActionCardBackground } from './colors';
export { layout } from './layout';
export { motion } from './motion';
export { opacity } from './opacity';
export { radii } from './radii';
export { shadows } from './shadows';
export { spacing } from './spacing';
export { useReducedMotion } from './useReducedMotion';
export type {
  BorderTokens,
  ColorPalette,
  HexColor,
  LayoutTokens,
  MotionTokens,
  OpacityTokens,
  RadiusTokens,
  SemanticColors,
  ShadowStyle,
  ShadowTokens,
  SpacingScale,
  TextStyleToken,
  Theme,
  TypographyTokens,
} from './theme.types';
export { useThemeStyles } from './useThemeStyles';
export { plusJakartaFontMap } from './fonts';
export { FONT_FAMILY, typography } from './typography';

/**
 * Immutable theme object. Prefer importing named token modules in components.
 */
export const theme: Theme = {
  colors,
  semantic: semanticColors,
  spacing,
  layout,
  radii,
  borders,
  shadows,
  typography,
  motion,
  opacity,
} as const;
