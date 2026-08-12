import { colors as lightColors } from '../../../theme';
import type { ColorPalette } from '../../../theme/theme.types';
import type { nutritionStrings } from '../i18n/nutritionStrings';

export type NutritionClassificationStyle = {
  readonly bg: string;
  readonly border: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly textColor: string;
  readonly urgent: boolean;
};

type NutritionUiStrings = typeof nutritionStrings;

export function getNutritionClassificationStyle(
  code: string | null | undefined,
  strings: NutritionUiStrings,
  palette: ColorPalette = lightColors,
): NutritionClassificationStyle {
  if (code === 'sam') {
    return {
      bg: palette.dangerBackground,
      border: palette.danger,
      label: strings.classificationSam,
      shortLabel: strings.classificationSamShort,
      textColor: palette.danger,
      urgent: true,
    };
  }
  if (code === 'mam') {
    return {
      bg: palette.warningBackground,
      border: palette.warning,
      label: strings.classificationMam,
      shortLabel: strings.classificationMamShort,
      textColor: palette.warning,
      urgent: false,
    };
  }
  if (code === 'nutritionNormal') {
    return {
      bg: palette.successBackground,
      border: palette.success,
      label: strings.classificationAdequate,
      shortLabel: strings.classificationAdequateShort,
      textColor: palette.success,
      urgent: false,
    };
  }
  return {
    bg: palette.mutedSurface,
    border: palette.border,
    label: strings.classificationPending,
    shortLabel: strings.pendingStatus,
    textColor: palette.textSecondary,
    urgent: false,
  };
}

export type NutritionListFilter = 'all' | 'sam' | 'mam' | 'adequate' | 'draft';

export function matchesNutritionFilter(input: {
  readonly filter: NutritionListFilter;
  readonly status: string;
  readonly interpretationCode: string | null;
}): boolean {
  if (input.filter === 'all') {
    return true;
  }
  if (input.filter === 'draft') {
    return input.status === 'draft';
  }
  if (input.status !== 'completed') {
    return false;
  }
  if (input.filter === 'sam') {
    return input.interpretationCode === 'sam';
  }
  if (input.filter === 'mam') {
    return input.interpretationCode === 'mam';
  }
  if (input.filter === 'adequate') {
    return input.interpretationCode === 'nutritionNormal';
  }
  return true;
}
