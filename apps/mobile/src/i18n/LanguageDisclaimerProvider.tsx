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

import { DagbanliTranslationDisclaimerModal } from './DagbanliTranslationDisclaimerModal';
import { useLanguage, type LanguageCode } from './LanguageProvider';

const DISCLAIMER_SKIP_STORAGE_KEY = 'northcare_dg_disclaimer_skipped';

type LanguageDisclaimerContextValue = {
  readonly requestLanguage: (code: LanguageCode) => void;
};

const LanguageDisclaimerContext = createContext<LanguageDisclaimerContextValue | null>(null);

export function LanguageDisclaimerProvider({ children }: { readonly children: ReactNode }) {
  const { language, setLanguage } = useLanguage();
  const [pendingLanguage, setPendingLanguage] = useState<LanguageCode | null>(null);
  const [skipDisclaimer, setSkipDisclaimer] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(DISCLAIMER_SKIP_STORAGE_KEY);
        setSkipDisclaimer(stored === 'true');
      } catch {
        setSkipDisclaimer(false);
      }
    })();
  }, []);

  const requestLanguage = useCallback(
    (code: LanguageCode) => {
      if (code === language) {
        return;
      }
      if (code === 'dg' && language === 'en' && !skipDisclaimer) {
        setDontShowAgain(false);
        setPendingLanguage('dg');
        return;
      }
      void setLanguage(code);
    },
    [language, setLanguage, skipDisclaimer],
  );

  const confirmPendingLanguage = useCallback(async () => {
    if (!pendingLanguage) {
      return;
    }
    if (dontShowAgain) {
      setSkipDisclaimer(true);
      try {
        await AsyncStorage.setItem(DISCLAIMER_SKIP_STORAGE_KEY, 'true');
      } catch {
        // Preference is optional; language switch still proceeds.
      }
    }
    await setLanguage(pendingLanguage);
    setPendingLanguage(null);
  }, [dontShowAgain, pendingLanguage, setLanguage]);

  const cancelPendingLanguage = useCallback(() => {
    setPendingLanguage(null);
    setDontShowAgain(false);
  }, []);

  const value = useMemo<LanguageDisclaimerContextValue>(
    () => ({ requestLanguage }),
    [requestLanguage],
  );

  return (
    <LanguageDisclaimerContext.Provider value={value}>
      {children}
      <DagbanliTranslationDisclaimerModal
        visible={pendingLanguage === 'dg'}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        onContinue={() => void confirmPendingLanguage()}
        onCancel={cancelPendingLanguage}
      />
    </LanguageDisclaimerContext.Provider>
  );
}

export function useRequestLanguage(): LanguageDisclaimerContextValue {
  const context = useContext(LanguageDisclaimerContext);
  if (!context) {
    throw new Error('useRequestLanguage must be used within LanguageDisclaimerProvider');
  }
  return context;
}
