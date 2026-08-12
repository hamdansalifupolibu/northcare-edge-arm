import { StyleSheet, View } from 'react-native';

import { AppButton } from '../design-system/buttons/AppButton';
import { AppText } from '../design-system/text/AppText';
import { spacing } from '../theme';

import { useLanguage, useTranslation, type LanguageCode } from './LanguageProvider';
import { useRequestLanguage } from './LanguageDisclaimerProvider';

interface LanguageToggleProps {
  /** Test ID for automation */
  testID?: string;
}

/**
 * A toggle button that switches between English and Dagbanli.
 *
 * Displays the current language and switches to the other on press.
 * Language preference is persisted automatically via LanguageProvider.
 */
export function LanguageToggle({ testID = 'language-toggle' }: LanguageToggleProps) {
  const t = useTranslation();
  const { language, getLanguageInfo } = useLanguage();
  const { requestLanguage } = useRequestLanguage();

  const currentInfo = getLanguageInfo(language);
  const nextLanguage: LanguageCode = language === 'en' ? 'dg' : 'en';
  const nextInfo = getLanguageInfo(nextLanguage);

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="caption" color="secondary" style={styles.label}>
        {currentInfo.nativeName}
      </AppText>
      <AppButton
        label={nextLanguage === 'dg' ? t.language.switchToDagbanli : t.language.switchToEnglish}
        variant="tertiary"
        size="small"
        onPress={() => requestLanguage(nextLanguage)}
        testID={`${testID}-button`}
        accessibilityLabel={`Change language to ${nextInfo.englishName}`}
        accessibilityHint={`Currently using ${currentInfo.englishName}. Tap to switch to ${nextInfo.englishName}.`}
      />
    </View>
  );
}

/**
 * A compact inline toggle showing both language options.
 *
 * Useful for settings screens or prominent placement.
 */
export function LanguageToggleCompact({ testID = 'language-toggle-compact' }: LanguageToggleProps) {
  const { language, supportedLanguages } = useLanguage();
  const { requestLanguage } = useRequestLanguage();

  return (
    <View style={styles.compactContainer} testID={testID}>
      {supportedLanguages.map((lang) => {
        const isActive = lang.code === language;
        return (
          <AppButton
            key={lang.code}
            label={lang.nativeName}
            variant={isActive ? 'primary' : 'secondary'}
            size="small"
            onPress={() => requestLanguage(lang.code)}
            testID={`${testID}-${lang.code}`}
            accessibilityLabel={`${lang.englishName}${isActive ? ' (current)' : ''}`}
            accessibilityState={{ selected: isActive }}
            style={styles.compactButton}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  label: {
    marginRight: spacing.sm,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactButton: {
    minWidth: 80,
  },
});
