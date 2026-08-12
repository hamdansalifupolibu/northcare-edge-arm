import { Pressable, View } from 'react-native';

import { AppText, StatusChip } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { layout, radii, semanticColors, spacing } from '../../../theme';
import {
  communityRequestCategoryLabel,
  communityRequestStatusLabel,
  communityRequestStatusTone,
  communityRequestTypeLabel,
  formatCommunityRequestSubmittedAt,
  isEmergencyRequest,
} from '../domain/labels';
import type { WorkerRequestListItem } from '../domain/types';

export function CommunityRequestListItem(props: {
  readonly item: WorkerRequestListItem;
  readonly onPress: () => void;
}) {
  const t = useTranslation();
  const { item } = props;
  const emergency = isEmergencyRequest(item.category, item.requestType);
  const categoryLabel = communityRequestCategoryLabel(item.category, t.communityRequests);
  const typeLabel = communityRequestTypeLabel(item.requestType, t.communityRequests);
  const statusLabel = communityRequestStatusLabel(item.status, t.communityRequests);
  const accessibilityParts = [
    emergency ? t.communityRequests.emergencyLabel : categoryLabel,
    statusLabel,
    item.communityOrLandmark,
    item.assignedToCaller ? t.communityRequests.assignedToMe : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityParts.join(', ')}
      accessibilityHint="Open community request details"
      style={{
        minHeight: layout.minTouchTarget,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: semanticColors.border.default,
        borderLeftWidth: emergency ? 3 : 0,
        borderLeftColor: emergency ? semanticColors.status.urgent : 'transparent',
        gap: spacing.xs,
      }}
      testID={`community-request-item-${item.requestId}`}
    >
      {emergency ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{
              minWidth: 28,
              minHeight: 28,
              borderRadius: radii.sm,
              borderWidth: 1,
              borderColor: semanticColors.status.urgent,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing.xs,
            }}
          >
            <AppText variant="label" color="urgent">
              {t.communityRequests.emergencyIconGlyph}
            </AppText>
          </View>
          <AppText
            variant="label"
            color="urgent"
            testID={`community-request-emergency-${item.requestId}`}
          >
            {t.communityRequests.emergencyLabel}
          </AppText>
        </View>
      ) : (
        <AppText variant="bodyStrong">{categoryLabel}</AppText>
      )}
      <AppText variant="caption" color="secondary">
        {typeLabel}
      </AppText>
      <AppText variant="caption" color="secondary">
        {item.communityOrLandmark}
      </AppText>
      <AppText variant="caption" color="secondary">
        {t.communityRequests.preferredLanguage}: {item.preferredLanguage}
      </AppText>
      <AppText variant="caption" color="secondary">
        {t.communityRequests.submittedAt}: {formatCommunityRequestSubmittedAt(item.createdAt)}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' }}>
        <StatusChip label={statusLabel} tone={communityRequestStatusTone(item.status)} />
        {item.assignedToCaller ? (
          <AppText variant="caption" color="secondary">
            {t.communityRequests.assignedToMe}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
