/**
 * Internationalization (i18n) module for NorthCare AI.
 *
 * Provides language context, translation hooks, and UI components
 * for switching between English and Dagbanli.
 */

export { en, type AppStrings } from './en';
export { dg, DG_TRANSLATION_STATUS } from './dg';
export {
  LanguageProvider,
  useLanguage,
  useTranslation,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageInfo,
} from './LanguageProvider';
export { LanguageToggle, LanguageToggleCompact } from './LanguageToggle';
export { DagbanliTranslationDisclaimerModal } from './DagbanliTranslationDisclaimerModal';
export { LanguageDisclaimerProvider, useRequestLanguage } from './LanguageDisclaimerProvider';
export { TranslationReviewBanner } from './TranslationReviewBanner';
export { mapTranscriptionLanguage, isDagbanliTranscriptionLanguage } from './transcriptionLanguage';
