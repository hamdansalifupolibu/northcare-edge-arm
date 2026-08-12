import { AdministrationOfflineError, AdministrationForbiddenError } from '../domain/errors';
import { AppStateView } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';

export function AdministrationOfflineState({ onRetry }: { readonly onRetry?: () => void }) {
  const t = useTranslation();
  return (
    <AppStateView
      variant="offline"
      heading={t.adminShell.offlineTitle}
      explanation={t.adminShell.offlineBody}
      primaryActionLabel={onRetry ? t.administration.retry : undefined}
      onPrimaryAction={onRetry}
      testID="administration-offline"
    />
  );
}

export function AdministrationForbiddenState() {
  const t = useTranslation();
  return (
    <AppStateView
      variant="error"
      heading={t.adminShell.forbiddenTitle}
      explanation={t.adminShell.forbiddenBody}
      testID="administration-forbidden"
    />
  );
}

export function mapAdministrationError(error: unknown): 'offline' | 'forbidden' | 'generic' {
  if (error instanceof AdministrationOfflineError) {
    return 'offline';
  }
  if (error instanceof AdministrationForbiddenError) {
    return 'forbidden';
  }
  return 'generic';
}
