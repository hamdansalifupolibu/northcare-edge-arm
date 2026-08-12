import { useSegments } from 'expo-router';
import { StyleSheet, View, type ReactNode } from 'react-native';

import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { resolveWorkerNavTab, shouldShowWorkerBottomNav } from '../domain/workerNav';
import { WorkerBottomNav } from './WorkerBottomNav';

type Props = {
  readonly children: ReactNode;
};

export function WorkerWorkspaceShell({ children }: Props) {
  const segments = useSegments();
  const { colors } = useThemeMode();
  const activeTab = resolveWorkerNavTab(segments);
  const showNav = shouldShowWorkerBottomNav(segments);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="worker-workspace-shell">
      <View style={styles.content}>{children}</View>
      {showNav && activeTab ? <WorkerBottomNav activeTab={activeTab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
