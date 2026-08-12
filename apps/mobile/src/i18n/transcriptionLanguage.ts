import type { LanguageCode } from './LanguageProvider';

/** Maps app UI language to ASR / transcription language codes. */
export function mapTranscriptionLanguage(language: LanguageCode): string {
  return language === 'dg' ? 'dag' : 'en';
}

/** True when transcription should use Dagbanli-capable providers. */
export function isDagbanliTranscriptionLanguage(languageHint: string | null | undefined): boolean {
  return languageHint === 'dag' || languageHint === 'dg';
}
