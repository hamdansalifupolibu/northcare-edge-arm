/**
 * Strongly typed theme contracts for NorthCare AI.
 * Authoritative runtime tokens live in this TypeScript module tree.
 * Keep `implementation/design-tokens.json` aligned (see docs/design/DESIGN_TOKENS.md).
 */

export type HexColor = `#${string}`;

export type ColorPalette = {
  readonly primary: HexColor;
  readonly primaryDark: HexColor;
  readonly primaryDarker: HexColor;
  readonly accent: HexColor;
  readonly accentLight: HexColor;
  readonly background: HexColor;
  readonly surface: HexColor;
  readonly textPrimary: HexColor;
  readonly textSecondary: HexColor;
  readonly textInverse: HexColor;
  readonly border: HexColor;
  readonly mutedSurface: HexColor;
  readonly danger: HexColor;
  readonly dangerBackground: HexColor;
  readonly warning: HexColor;
  readonly warningBackground: HexColor;
  readonly success: HexColor;
  readonly successBackground: HexColor;
  readonly info: HexColor;
  readonly disabled: HexColor;
  readonly disabledBackground: HexColor;
  readonly overlay: HexColor;
};

export type SemanticColors = {
  readonly background: {
    readonly primary: HexColor;
    readonly secondary: HexColor;
  };
  readonly surface: {
    readonly primary: HexColor;
    readonly muted: HexColor;
  };
  readonly text: {
    readonly primary: HexColor;
    readonly secondary: HexColor;
    readonly inverse: HexColor;
    readonly disabled: HexColor;
  };
  readonly border: {
    readonly default: HexColor;
    readonly strong: HexColor;
  };
  readonly action: {
    readonly primary: HexColor;
    readonly primaryPressed: HexColor;
    readonly primaryDarker: HexColor;
    readonly accent: HexColor;
    readonly disabled: HexColor;
    readonly disabledBackground: HexColor;
    readonly destructive: HexColor;
    readonly destructiveBackground: HexColor;
  };
  readonly status: {
    readonly urgent: HexColor;
    readonly urgentBackground: HexColor;
    readonly warning: HexColor;
    readonly warningBackground: HexColor;
    readonly stable: HexColor;
    readonly stableBackground: HexColor;
    readonly info: HexColor;
    readonly infoBackground: HexColor;
    readonly offline: HexColor;
    readonly offlineBackground: HexColor;
  };
};

export type SpacingScale = {
  readonly none: number;
  readonly xxs: number;
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly base: number;
  readonly lg: number;
  readonly xl: number;
  readonly '2xl': number;
  readonly '3xl': number;
  readonly '4xl': number;
  readonly '5xl': number;
};

export type LayoutTokens = {
  readonly screenHorizontalPadding: number;
  readonly screenTopSpacing: number;
  readonly screenBottomSpacing: number;
  readonly sectionSpacing: number;
  readonly cardPadding: number;
  readonly formFieldSpacing: number;
  readonly compactRowGap: number;
  readonly bottomNavigationClearance: number;
  readonly minTouchTarget: number;
  readonly contentMaxWidth: number;
  readonly headerHeight: number;
  readonly iconSizeSm: number;
  readonly iconSizeMd: number;
  readonly iconSizeLg: number;
};

export type RadiusTokens = {
  readonly none: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly pill: number;
  readonly card: number;
  readonly input: number;
  readonly button: number;
  readonly modal: number;
  readonly image: number;
};

export type BorderTokens = {
  readonly widthHairline: number;
  readonly widthThin: number;
  readonly widthMedium: number;
  readonly widthThick: number;
};

export type ShadowStyle = {
  readonly shadowColor: HexColor;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number;
};

export type ShadowTokens = {
  readonly none: ShadowStyle;
  readonly sm: ShadowStyle;
  readonly md: ShadowStyle;
};

export type FontWeightToken = '400' | '500' | '600' | '700';

export type TextStyleToken = {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: FontWeightToken;
  readonly letterSpacing: number;
};

export type TypographyTokens = {
  readonly fontFamily: {
    readonly regular: string;
    readonly medium: string;
    readonly semiBold: string;
    readonly bold: string;
    readonly systemFallback: string;
  };
  readonly styles: {
    readonly displayLarge: TextStyleToken;
    readonly headingLarge: TextStyleToken;
    readonly headingMedium: TextStyleToken;
    readonly headingSmall: TextStyleToken;
    readonly title: TextStyleToken;
    readonly bodyLarge: TextStyleToken;
    readonly body: TextStyleToken;
    readonly bodyStrong: TextStyleToken;
    readonly caption: TextStyleToken;
    readonly label: TextStyleToken;
    readonly button: TextStyleToken;
    readonly riskLabel: TextStyleToken;
    readonly numericHighlight: TextStyleToken;
  };
};

export type MotionTokens = {
  readonly duration: {
    readonly instant: number;
    readonly fast: number;
    readonly standard: number;
    readonly emphasised: number;
    readonly slow: number;
  };
  readonly easing: {
    readonly standard: string;
    readonly emphasised: string;
    readonly decelerate: string;
  };
  readonly distance: {
    readonly entrance: number;
  };
  readonly scale: {
    readonly press: number;
    readonly entrance: number;
  };
};

export type OpacityTokens = {
  readonly disabled: number;
  readonly pressed: number;
  readonly overlay: number;
  readonly subtle: number;
};

export type Theme = {
  readonly colors: ColorPalette;
  readonly semantic: SemanticColors;
  readonly spacing: SpacingScale;
  readonly layout: LayoutTokens;
  readonly radii: RadiusTokens;
  readonly borders: BorderTokens;
  readonly shadows: ShadowTokens;
  readonly typography: TypographyTokens;
  readonly motion: MotionTokens;
  readonly opacity: OpacityTokens;
};
