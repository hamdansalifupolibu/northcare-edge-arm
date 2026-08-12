import { useTranslation } from '../../../i18n/LanguageProvider';

/**
 * Returns nutrition UI strings for the active app language.
 */
export function useNutritionStrings() {
  return useTranslation().nutrition;
}
