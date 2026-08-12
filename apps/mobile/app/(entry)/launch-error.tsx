import { AppStateView } from '../../src/design-system';
import { useTranslation } from '../../src/i18n/LanguageProvider';
import { useLaunch } from '../../src/launch/LaunchProvider';

export default function LaunchErrorRoute() {
  const t = useTranslation();
  const { refresh } = useLaunch();

  return (
    <AppStateView
      variant="error"
      heading={t.launchError.title}
      explanation={t.launchError.body}
      primaryActionLabel={t.launchError.retry}
      onPrimaryAction={() => {
        void refresh({ retryDatabase: true });
      }}
      testID="launch-error"
    />
  );
}
