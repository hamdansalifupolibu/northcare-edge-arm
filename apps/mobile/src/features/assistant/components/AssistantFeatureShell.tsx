import type { ReactNode } from 'react';
import { View } from 'react-native';

import { NutritionCentreShell } from '../../nutrition/components/centre/NutritionCentreShell';
import { WorkerHubHeader } from '../../worker-home/components/WorkerHubHeader';
import { spacing } from '../../../theme';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack: () => void;
  readonly onHome?: () => void;
  readonly children: ReactNode;
  readonly testID: string;
  readonly bottomClearance?: number;
};

export function AssistantFeatureShell({
  title,
  subtitle,
  onBack,
  onHome,
  children,
  testID,
  bottomClearance = spacing.xl,
}: Props) {
  return (
    <NutritionCentreShell testID={testID}>
      <WorkerHubHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        onHome={onHome}
        showConnectivity
      />
      {children}
      <View style={{ height: bottomClearance }} />
    </NutritionCentreShell>
  );
}
