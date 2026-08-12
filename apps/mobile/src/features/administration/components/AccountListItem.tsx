import { View } from 'react-native';

import { PressableCard, StatusChip } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { accountStatusChipTone, accountStatusLabelKey } from '../domain/accountStatuses';
import type { AdminAccountSummary } from '../domain/types';

export function AccountListItem({
  account,
  onPress,
}: {
  readonly account: AdminAccountSummary;
  readonly onPress: () => void;
}) {
  const t = useTranslation();
  const statusKey = accountStatusLabelKey(account.accountStatus);
  const statusLabel =
    t.administration.statuses[statusKey as keyof typeof t.administration.statuses] ?? statusKey;
  const subtitle = [account.email, account.facilityName].filter(Boolean).join(' · ');

  return (
    <PressableCard
      title={account.displayName}
      subtitle={subtitle || undefined}
      onPress={onPress}
      accessibilityLabel={`${account.displayName}, ${statusLabel}`}
      accessibilityHint="Open account details"
      testID={`account-item-${account.accountId}`}
    >
      <View style={{ marginTop: spacing.xxs }}>
        <StatusChip
          label={statusLabel}
          tone={accountStatusChipTone(account.accountStatus)}
          hidePrefix
        />
      </View>
    </PressableCard>
  );
}
