import { AppLinearGradient } from '../../../design-system/layout/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { AppButton } from '../../../design-system/buttons/AppButton';
import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { ScrollableAppScreen } from '../../../design-system/layout/ScrollableAppScreen';
import { EntranceMotion } from '../../../design-system/motion/EntranceMotion';
import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { useLaunch } from '../../../launch/LaunchProvider';
import { createLogger } from '../../../logging/logger';
import type { WorkspacePreference } from '../../../preferences';
import { borders, layout, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  AdminRoleIcon,
  LockNoticeIcon,
  SwitchWorkspaceIcon,
  WorkerRoleIcon,
} from '../components/WorkspaceRoleIcons';
import { WorkspaceAmbientDecor } from '../components/WorkspaceAmbientDecor';
import { WorkspaceOptionCard } from '../components/WorkspaceOptionCard';

const logger = createLogger({ environment: getAppConfig().appEnv });

export function WorkspaceSelectionScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { selectWorkspace } = useLaunch();
  const { semantic, isDark } = useThemeMode();
  const [selected, setSelected] = useState<WorkspacePreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginRouteFor = (workspace: WorkspacePreference): '/(auth)/worker-login' | '/(auth)/admin-login' =>
    workspace === 'worker' ? '/(auth)/worker-login' : '/(auth)/admin-login';

  const chooseWorkspace = async (workspace: WorkspacePreference): Promise<void> => {
    setSelected(workspace);
    setSaving(true);
    setErrorMessage(null);
    try {
      await selectWorkspace(workspace);
      router.replace(loginRouteFor(workspace));
    } catch (error) {
      logger.error('Workspace selection save failed', {
        message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
      });
      setErrorMessage(t.preferenceError.body);
      setSaving(false);
    }
  };

  const continueSelected = async (): Promise<void> => {
    if (selected === null) {
      return;
    }
    await chooseWorkspace(selected);
  };

  return (
    <ScrollableAppScreen testID="workspace-selection" background="primary">
      <WorkspaceAmbientDecor />
      <View style={styles.backdrop} pointerEvents="none">
        <AppLinearGradient
          colors={
            isDark
              ? ['rgba(15, 118, 110, 0.18)', 'transparent']
              : ['rgba(15, 118, 110, 0.08)', 'transparent']
          }
          style={styles.topGlow}
        />
        <View
          style={[
            styles.bottomGlow,
            {
              backgroundColor: isDark
                ? 'rgba(15, 118, 110, 0.12)'
                : 'rgba(15, 118, 110, 0.05)',
            },
          ]}
        />
      </View>

      <EntranceMotion style={styles.content}>
        <View style={styles.header}>
          <NorthCareLogo variant="stacked" size="md" testID="workspace-logo" />
          <AppText variant="headingLarge" color="action" align="center" style={styles.title}>
            {t.workspace.title}
          </AppText>
          <AppText variant="body" color="secondary" align="center">
            {t.workspace.explanation}
          </AppText>
        </View>

        <View style={styles.options}>
          <WorkspaceOptionCard
            title={t.workspace.workerTitle}
            description={t.workspace.workerDescription}
            icon={<WorkerRoleIcon />}
            selected={selected === 'worker'}
            onPress={() => void chooseWorkspace('worker')}
            accessibilityHint="Select frontline health worker workspace"
            testID="workspace-worker"
          />

          <WorkspaceOptionCard
            title={t.workspace.adminTitle}
            description={t.workspace.adminDescription}
            icon={<AdminRoleIcon />}
            selected={selected === 'administrator'}
            onPress={() => void chooseWorkspace('administrator')}
            accessibilityHint="Select administrator workspace"
            testID="workspace-admin"
          />
        </View>

        <View
          style={[
            styles.notice,
            {
              backgroundColor: semantic.background.secondary,
              borderColor: semantic.border.default,
            },
          ]}
        >
          <LockNoticeIcon />
          <AppText variant="caption" color="secondary" style={styles.noticeText}>
            {t.workspace.securityNote}
          </AppText>
        </View>

        {errorMessage ? (
          <AppText variant="body" color="urgent">
            {errorMessage}
          </AppText>
        ) : null}

        <AppButton
          label={t.workspace.continue}
          onPress={() => void continueSelected()}
          disabled={selected === null}
          loading={saving}
          variant="accent"
          trailingIcon={
            <AppText variant="bodyStrong" color="inverse">
              →
            </AppText>
          }
          testID="workspace-continue"
        />

        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <View style={[styles.footerLine, { backgroundColor: semantic.border.default }]} />
            <SwitchWorkspaceIcon />
            <View style={[styles.footerLine, { backgroundColor: semantic.border.default }]} />
          </View>
          <AppText variant="caption" color="secondary" align="center">
            {t.workspace.switchLater}
          </AppText>
        </View>
      </EntranceMotion>
    </ScrollableAppScreen>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  topGlow: {
    height: 220,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomGlow: {
    borderRadius: 180,
    bottom: -80,
    height: 180,
    left: -40,
    position: 'absolute',
    right: -40,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    maxWidth: layout.contentMaxWidth,
  },
  options: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  notice: {
    alignItems: 'flex-start',
    borderRadius: radii.card,
    borderWidth: borders.widthThin,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noticeText: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  footerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  footerLine: {
    flex: 1,
    height: 1,
  },
});
