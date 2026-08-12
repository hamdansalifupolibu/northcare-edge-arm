import { colors as lightColors } from '../../../theme';
import type { ColorPalette } from '../../../theme/theme.types';

export type NutritionSectionTheme = {
  readonly accent: string;
  readonly background: string;
  readonly icon: string;
};

const LIGHT_THEMES: Record<string, NutritionSectionTheme> = {
  'section-child-info': {
    accent: lightColors.info,
    background: '#DBEAFE',
    icon: '👤',
  },
  'section-measurements': {
    accent: lightColors.primary,
    background: lightColors.mutedSurface,
    icon: '📏',
  },
  'section-clinical-signs': {
    accent: lightColors.danger,
    background: lightColors.dangerBackground,
    icon: '⚠',
  },
  'section-ebf': {
    accent: lightColors.success,
    background: lightColors.successBackground,
    icon: '🍼',
  },
  'section-feeding': {
    accent: lightColors.primaryDark,
    background: lightColors.mutedSurface,
    icon: '🥣',
  },
  'section-mdd': {
    accent: lightColors.accent,
    background: lightColors.accentLight,
    icon: '🥗',
  },
  'section-feeding-concerns': {
    accent: lightColors.warning,
    background: lightColors.warningBackground,
    icon: '💬',
  },
};

const LIGHT_DEFAULT: NutritionSectionTheme = {
  accent: lightColors.primary,
  background: lightColors.mutedSurface,
  icon: '📋',
};

function darkThemes(palette: ColorPalette): Record<string, NutritionSectionTheme> {
  return {
    'section-child-info': {
      accent: palette.info,
      background: '#1A3050',
      icon: '👤',
    },
    'section-measurements': {
      accent: palette.primary,
      background: palette.mutedSurface,
      icon: '📏',
    },
    'section-clinical-signs': {
      accent: palette.danger,
      background: palette.dangerBackground,
      icon: '⚠',
    },
    'section-ebf': {
      accent: palette.success,
      background: palette.successBackground,
      icon: '🍼',
    },
    'section-feeding': {
      accent: palette.primary,
      background: palette.mutedSurface,
      icon: '🥣',
    },
    'section-mdd': {
      accent: palette.accent,
      background: palette.accentLight,
      icon: '🥗',
    },
    'section-feeding-concerns': {
      accent: palette.warning,
      background: palette.warningBackground,
      icon: '💬',
    },
  };
}

const DARK_DEFAULT = (palette: ColorPalette): NutritionSectionTheme => ({
  accent: palette.primary,
  background: palette.mutedSurface,
  icon: '📋',
});

export function getNutritionSectionTheme(
  sectionId: string,
  palette: ColorPalette = lightColors,
  isDark = false,
): NutritionSectionTheme {
  if (isDark) {
    const themes = darkThemes(palette);
    return themes[sectionId] ?? DARK_DEFAULT(palette);
  }
  return LIGHT_THEMES[sectionId] ?? LIGHT_DEFAULT;
}

export const CRITICAL_NUTRITION_QUESTION_IDS = new Set([
  'bilateral_oedema',
  'visible_wasting',
]);

export function isCriticalNutritionQuestion(questionId: string): boolean {
  return CRITICAL_NUTRITION_QUESTION_IDS.has(questionId);
}
