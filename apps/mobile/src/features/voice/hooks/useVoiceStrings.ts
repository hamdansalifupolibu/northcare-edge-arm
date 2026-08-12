import { useTranslation } from '../../../i18n/LanguageProvider';

/**
 * Returns Voice-to-Care UI strings for the active app language.
 */
export function useVoiceStrings() {
  return useTranslation().voice;
}
