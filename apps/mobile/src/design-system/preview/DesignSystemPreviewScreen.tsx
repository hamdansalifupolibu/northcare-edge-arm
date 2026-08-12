import { useState } from 'react';
import { View } from 'react-native';

import { colors, semanticColors, spacing } from '../../theme';
import { NorthCareLogo } from '../brand/NorthCareLogo';
import { AppButton } from '../buttons/AppButton';
import { AppCard } from '../cards/AppCard';
import { PressableCard } from '../cards/PressableCard';
import { AppTextInput } from '../forms/AppTextInput';
import { CheckboxField } from '../forms/CheckboxField';
import { PasswordField } from '../forms/PasswordField';
import { SearchInput } from '../forms/SearchInput';
import { EntranceMotion } from '../motion/EntranceMotion';
import { AppHeader } from '../headers/AppHeader';
import { SectionHeader } from '../headers/SectionHeader';
import { Divider } from '../layout/Divider';
import { ScreenSection } from '../layout/ScreenSection';
import { ScrollableAppScreen } from '../layout/ScrollableAppScreen';
import { ConnectivityBanner } from '../offline/ConnectivityBanner';
import { LocalSaveConfirmation } from '../offline/LocalSaveConfirmation';
import { OfflineNotice } from '../offline/OfflineNotice';
import { SyncStatusIndicator } from '../offline/SyncStatusIndicator';
import { RiskBadge } from '../risk/RiskBadge';
import { RiskSummaryCard } from '../risk/RiskSummaryCard';
import { AppStateView } from '../states/AppStateView';
import { LoadingState } from '../states/LoadingState';
import { CountBadge } from '../status/CountBadge';
import { StatusChip } from '../status/StatusChip';
import { AppText } from '../text/AppText';

export type DesignSystemPreviewScreenProps = {
  readonly onClose?: () => void;
};

/**
 * DEVELOPMENT ONLY — not a production user screen.
 * Synthetic labels only. No clinical workflows or fake patient data.
 */
export function DesignSystemPreviewScreen({
  onClose,
}: DesignSystemPreviewScreenProps) {
  const [checked, setChecked] = useState(false);
  const [passwordDemo, setPasswordDemo] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);

  return (
    <ScrollableAppScreen testID="design-system-preview">
      <AppHeader
        title="Development Preview"
        subtitle="Design system gallery — not a clinical screen"
        onBack={onClose}
      />

      <AppText variant="caption" color="warning">
        Development Preview — synthetic labels only. No patient data.
      </AppText>

      <Divider />

      <ScreenSection title="Brand">
        <NorthCareLogo size="lg" />
        <AppText variant="headingLarge">NorthCare AI</AppText>
        <AppText variant="body" color="secondary">
          Smarter care. Stronger communities.
        </AppText>
      </ScreenSection>

      <ScreenSection title="Typography">
        <AppText variant="displayLarge">Display large</AppText>
        <AppText variant="headingLarge">Heading large</AppText>
        <AppText variant="headingMedium">Heading medium</AppText>
        <AppText variant="headingSmall">Heading small</AppText>
        <AppText variant="title">Title</AppText>
        <AppText variant="bodyLarge">Body large — field-readable copy.</AppText>
        <AppText variant="body">Body — secondary supporting text.</AppText>
        <AppText variant="bodyStrong">Body strong</AppText>
        <AppText variant="caption">Caption</AppText>
        <AppText variant="label">LABEL</AppText>
        <AppText variant="button">Button label</AppText>
        <AppText variant="riskLabel" color="urgent">
          RISK LABEL
        </AppText>
        <AppText variant="numericHighlight">128</AppText>
      </ScreenSection>

      <ScreenSection title="Colour swatches">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[
            ['Primary', colors.primary],
            ['Accent', colors.accent],
            ['Background', colors.background],
            ['Urgent', colors.danger],
            ['Warning', colors.warning],
            ['Stable', colors.success],
          ].map(([name, hex]) => (
            <View
              key={name}
              style={{
                width: 96,
                height: 64,
                borderRadius: 8,
                backgroundColor: hex,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: semanticColors.border.default,
              }}
            >
              <AppText
                variant="label"
                color={name === 'Background' ? 'primary' : 'inverse'}
              >
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </ScreenSection>

      <ScreenSection title="Buttons">
        <AppButton label="Primary action" onPress={() => undefined} />
        <AppButton
          label="Secondary action"
          variant="secondary"
          onPress={() => undefined}
        />
        <AppButton
          label="Tertiary action"
          variant="tertiary"
          onPress={() => undefined}
          fullWidth={false}
        />
        <AppButton
          label="Delete sample item"
          variant="destructive"
          onPress={() => undefined}
          accessibilityHint="Destructive action — confirmation required in real flows"
        />
        <AppButton label="Disabled" onPress={() => undefined} disabled />
        <AppButton
          label={loadingDemo ? 'Working…' : 'Show loading'}
          loading={loadingDemo}
          onPress={() => {
            setLoadingDemo(true);
            setTimeout(() => setLoadingDemo(false), 800);
          }}
        />
      </ScreenSection>

      <ScreenSection title="Inputs">
        <AppTextInput
          label="Sample field"
          placeholder="Enter a synthetic value"
          helperText="Helper text supports longer translations."
        />
        <AppTextInput
          label="Sample with error"
          errorText="Please complete this field"
          defaultValue=""
        />
        <PasswordField
          label="Sample password"
          value={passwordDemo}
          onChangeText={setPasswordDemo}
          helperText="Show/hide is hidden by default and resets on leave."
          testID="preview-password"
        />
        <SearchInput placeholder="Search sample list" />
        <CheckboxField
          label="I understand this is a development preview"
          checked={checked}
          onChange={setChecked}
        />
      </ScreenSection>

      <ScreenSection title="Motion">
        <EntranceMotion>
          <AppText variant="body" color="secondary">
            Entrance motion uses React Native Animated and respects reduce-motion.
          </AppText>
        </EntranceMotion>
      </ScreenSection>

      <ScreenSection title="Cards">
        <AppCard title="Sample card" subtitle="Non-clinical surface">
          <AppText variant="body" color="secondary">
            Card padding and border follow approved tokens.
          </AppText>
        </AppCard>
        <PressableCard
          title="Pressable sample"
          subtitle="Opens nothing — preview only"
          onPress={() => undefined}
        />
      </ScreenSection>

      <ScreenSection title="Status">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <StatusChip label="Neutral" tone="neutral" />
          <StatusChip label="Information" tone="information" />
          <StatusChip label="Success" tone="success" />
          <StatusChip label="Warning" tone="warning" />
          <StatusChip label="Urgent" tone="urgent" />
          <StatusChip label="Offline" tone="offline" />
          <StatusChip label="Syncing" tone="syncing" />
          <StatusChip label="Synced" tone="synced" />
          <CountBadge count={3} />
        </View>
      </ScreenSection>

      <ScreenSection
        title="Risk presentation"
        description="Visual labels only — no calculation or clinical data."
      >
        <RiskBadge level="red" />
        <RiskBadge level="amber" />
        <RiskBadge level="green" />
        <RiskSummaryCard level="red" detail="Synthetic preview label" />
        <RiskSummaryCard level="amber" />
        <RiskSummaryCard level="green" />
      </ScreenSection>

      <ScreenSection title="Offline and sync (presentation)">
        <ConnectivityBanner status="offline" />
        <ConnectivityBanner status="online" />
        <SyncStatusIndicator status="waitingForConnection" />
        <SyncStatusIndicator status="syncing" />
        <SyncStatusIndicator status="synced" />
        <SyncStatusIndicator status="syncFailed" />
        <LocalSaveConfirmation />
        <OfflineNotice />
      </ScreenSection>

      <ScreenSection title="Loading">
        <LoadingState message="Loading preview samples…" />
      </ScreenSection>

      <ScreenSection title="State views">
        <AppStateView
          variant="empty"
          heading="Nothing here yet"
          explanation="This is a synthetic empty state for layout review."
          primaryActionLabel="Primary action"
          onPrimaryAction={() => undefined}
        />
        <AppStateView
          variant="error"
          heading="Something went wrong"
          explanation="This is a synthetic error state. No health data is shown."
          primaryActionLabel="Try again"
          onPrimaryAction={() => undefined}
          secondaryActionLabel="Dismiss"
          onSecondaryAction={() => undefined}
        />
      </ScreenSection>

      <SectionHeader
        title="Section header"
        description="Used for grouping content on future screens."
      />
    </ScrollableAppScreen>
  );
}
