import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';

export function NotificationPrivacyNotice() {
  const t = useTranslation();
  return (
    <AppText
      variant="caption"
      color="secondary"
      accessibilityLabel={t.reminders.privacyNotice}
      testID="notification-privacy-notice"
    >
      {t.reminders.privacyNotice}
    </AppText>
  );
}
