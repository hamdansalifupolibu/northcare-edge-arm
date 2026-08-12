import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableCard } from '../../../design-system/cards/PressableCard';
import { AppButton } from '../../../design-system/buttons/AppButton';
import { LoadingState } from '../../../design-system/states/LoadingState';
import { ScrollableAppScreen } from '../../../design-system/layout/ScrollableAppScreen';
import { EntranceMotion } from '../../../design-system/motion/EntranceMotion';
import { ScreenTitle } from '../../../design-system/headers/ScreenTitle';
import { AppText } from '../../../design-system/text/AppText';
import { resolveAuthenticatedHomeRoute } from '../../auth/navigation/postAuthNavigation';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { WorkspaceId } from '../../auth/domain/workspaces';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';

export function SessionWorkspaceScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { session, selectActiveWorkspace } = useAuthSession();
  const [selected, setSelected] = useState<WorkspaceId | null>(
    session?.activeWorkspace ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!session) {
    return (
      <ScrollableAppScreen testID="session-workspace-loading">
        <LoadingState message={t.splash.preparing} presentation="startup" />
      </ScrollableAppScreen>
    );
  }

  const permitted = session.permittedWorkspaces;
  const showWorker = permitted.includes('worker');
  const showAdministration = permitted.includes('administration');
  const currentLabel =
    session.activeWorkspace === 'administration'
      ? t.adminShell.activeWorkspace
      : session.activeWorkspace === 'worker'
        ? t.workerShell.activeWorkspace
        : null;

  const continueSelected = async (): Promise<void> => {
    if (selected === null) {
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    const result = await selectActiveWorkspace(selected);
    setSaving(false);
    if (!result.ok) {
      setErrorMessage(t.auth.errors.roleMismatch);
      return;
    }
    router.replace(resolveAuthenticatedHomeRoute({ ...session, activeWorkspace: selected }) as Href);
  };

  return (
    <ScrollableAppScreen testID="session-workspace">
      <EntranceMotion>
        <ScreenTitle>{t.sessionWorkspace.title}</ScreenTitle>
        <AppText variant="body" color="secondary">
          {t.sessionWorkspace.explanation}
        </AppText>
        {currentLabel ? (
          <AppText variant="label" color="secondary" testID="session-workspace-current">
            {currentLabel}
          </AppText>
        ) : null}
        <View style={styles.options}>
          {showWorker ? (
            <PressableCard
              title={t.sessionWorkspace.workerTitle}
              subtitle={t.sessionWorkspace.workerDescription}
              selected={selected === 'worker'}
              onPress={() => setSelected('worker')}
              accessibilityHint="Select health worker workspace"
              testID="session-workspace-worker"
            />
          ) : null}
          {showAdministration ? (
            <PressableCard
              title={t.sessionWorkspace.adminTitle}
              subtitle={t.sessionWorkspace.adminDescription}
              selected={selected === 'administration'}
              onPress={() => setSelected('administration')}
              accessibilityHint="Select administration workspace"
              testID="session-workspace-administration"
            />
          ) : null}
        </View>
        <AppText variant="caption" color="secondary">
          {t.sessionWorkspace.scopeNote}
        </AppText>
        {errorMessage ? (
          <AppText variant="body" color="urgent">
            {errorMessage}
          </AppText>
        ) : null}
        <AppButton
          label={t.sessionWorkspace.continue}
          onPress={() => void continueSelected()}
          disabled={selected === null}
          loading={saving}
          testID="session-workspace-continue"
        />
      </EntranceMotion>
    </ScrollableAppScreen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
});
