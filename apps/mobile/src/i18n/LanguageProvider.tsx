import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { en, type AppStrings } from './en';
import { dg } from './dg';

/**
 * Supported language codes.
 * - `en`: English (default)
 * - `dg`: Dagbanli
 */
export type LanguageCode = 'en' | 'dg';

/**
 * Language display metadata for UI.
 */
export interface LanguageInfo {
  code: LanguageCode;
  /** Native name of the language */
  nativeName: string;
  /** English name of the language */
  englishName: string;
}

/**
 * Available languages with display metadata.
 */
export const SUPPORTED_LANGUAGES: readonly LanguageInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'dg', nativeName: 'Dagbanli', englishName: 'Dagbanli' },
] as const;

const LANGUAGE_STORAGE_KEY = 'northcare_language_preference';
const DEFAULT_LANGUAGE: LanguageCode = 'en';

/**
 * String map keyed by language code.
 */
const STRING_MAPS: Record<LanguageCode, AppStrings> = {
  en,
  dg,
};

interface LanguageContextValue {
  /** Current active language code */
  language: LanguageCode;
  /** Current language strings */
  strings: AppStrings;
  /** Change the active language (persists to storage) */
  setLanguage: (code: LanguageCode) => Promise<void>;
  /** Whether language preference is still loading from storage */
  isLoading: boolean;
  /** Get display info for a language code */
  getLanguageInfo: (code: LanguageCode) => LanguageInfo;
  /** List of all supported languages */
  supportedLanguages: readonly LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
  /** Override initial language for testing (bypasses AsyncStorage load) */
  initialLanguage?: LanguageCode;
}

/**
 * Provides language context for the entire application.
 *
 * Persists language preference to AsyncStorage and restores it on app launch.
 * Wrap the app root with this provider to enable translations.
 */
export function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(
    initialLanguage ?? DEFAULT_LANGUAGE
  );
  const [isLoading, setIsLoading] = useState(!initialLanguage);

  useEffect(() => {
    if (initialLanguage) {
      return;
    }

    async function loadStoredLanguage() {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored && isValidLanguageCode(stored)) {
          setLanguageState(stored);
        }
      } catch {
        // Silently fall back to default on storage error
      } finally {
        setIsLoading(false);
      }
    }

    void loadStoredLanguage();
  }, [initialLanguage]);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      // Language is set in memory even if storage fails
    }
  }, []);

  const getLanguageInfo = useCallback((code: LanguageCode): LanguageInfo => {
    return (
      SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ??
      SUPPORTED_LANGUAGES[0]
    );
  }, []);

  const strings = useMemo(() => STRING_MAPS[language], [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      strings,
      setLanguage,
      isLoading,
      getLanguageInfo,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, strings, setLanguage, isLoading, getLanguageInfo]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context.
 *
 * @throws Error if used outside LanguageProvider
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook to access translated strings for the current language.
 *
 * This is the primary hook for components that need translated text.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const t = useTranslation();
 *   return <Text>{t.workerShell.title}</Text>;
 * }
 * ```
 */
export function useTranslation(): AppStrings {
  const { strings } = useLanguage();
  return strings;
}

/**
 * Type guard for valid language codes.
 */
function isValidLanguageCode(value: string): value is LanguageCode {
  return value === 'en' || value === 'dg';
}
