import { View } from 'react-native';

import { ReferralQrCode } from '../../referrals/components/ReferralQrCode';
import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';

type Props = {
  readonly activationUri: string;
  readonly expiresAt: string;
  readonly workerName: string;
  readonly title: string;
  readonly body: string;
  readonly expiryLabel: (expiresAt: string) => string;
  readonly syncFutureNote: string;
};

export function ActivationHandoffCard({
  activationUri,
  expiresAt,
  workerName,
  title,
  body,
  expiryLabel,
  syncFutureNote,
}: Props) {
  return (
    <View style={{ gap: spacing.md }} testID="activation-handoff-card">
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" color="secondary">
        {body}
      </AppText>
      <AppText variant="body">{workerName}</AppText>
      <ReferralQrCode value={activationUri} size={220} />
      <AppText variant="caption" color="secondary">
        {expiryLabel(expiresAt)}
      </AppText>
      <AppText variant="caption" color="secondary">
        {syncFutureNote}
      </AppText>
    </View>
  );
}
