import type { NutritionDetails } from '../application/createNutritionServices';
import type { nutritionStrings } from '../i18n/nutritionStrings';

type NutritionUiStrings = typeof nutritionStrings;

export function resolveNutritionSuccessMessage(
  details: NutritionDetails | null,
  strings: NutritionUiStrings,
): string {
  if (!details) {
    return strings.successMessages.generic;
  }

  const code = details.referenceEvaluation?.interpretationCode ?? null;
  const iycf = details.iycfEvaluation;

  if (iycf?.ageBand === 'under6') {
    if (iycf.ebf?.exclusiveBreastfeeding === true) {
      return strings.successMessages.ebfConfirmed;
    }
    if (iycf.ebf?.exclusiveBreastfeeding === false) {
      return strings.successMessages.ebfCounsel;
    }
  }

  if (code === 'sam') {
    return strings.successMessages.sam;
  }
  if (code === 'mam') {
    return strings.successMessages.mam;
  }
  if (code === 'nutritionNormal') {
    if (iycf?.minimumAcceptableDiet === false) {
      return strings.successMessages.adequateMuacFeedingConcern;
    }
    if (iycf?.minimumAcceptableDiet === true) {
      return strings.successMessages.adequateMuacMadMet;
    }
    return strings.successMessages.adequateMuac;
  }

  return strings.successMessages.generic;
}
