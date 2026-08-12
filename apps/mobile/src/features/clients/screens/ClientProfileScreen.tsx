import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isClientSex } from '../../../data/domain/enums/clientSex';
import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  LoadingState,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { asHref } from '../../../navigation/href';
import { spacing, colors } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../../worker-home/domain/workerNav';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import type { VisitHistoryItem } from '../../visits/application/createVisitServices';
import { useVisitServices } from '../../visits/hooks/useVisitServices';
import type { ClientProfile } from '../application/createClientServices';
import { formatAgePresentation, resolveAgePresentation } from '../domain/agePresentation';
import { useClientServices } from '../hooks/useClientServices';
import {
  ClientProfileDualColumn,
  ClientProfileDualColumnItem,
  ClientProfileHistoryButton,
  ClientProfileIdentityCard,
  ClientProfileLastUpdated,
  ClientProfileQuickActionCard,
  ClientProfileQuickActionsGrid,
  ClientProfileRecentCareEmpty,
  ClientProfileRecentCareItem,
  ClientProfileSectionCard,
  ClientProfileDetailRow,
  ClientProfileSecurityBanner,
  ClientProfileStartVisitButton,
  ClientProfileTopBar,
  useClientProfileQuickActionColors,
} from '../components/ClientProfileComponents';
import {
  ProfileCaregiverIcon,
  ProfileClipboardIcon,
  ProfileConsentIcon,
  ProfileFacilityIcon,
  ProfileLocationIcon,
  ProfileMicIcon,
  ProfilePhoneIcon,
  ProfileReferralIcon,
  ProfileRegionIcon,
  ProfileReminderIcon,
} from '../components/ClientProfileIcons';

const VOICE_MARKER = 'VOICE_EXTRACTION_JSON:';
const HORIZONTAL_PADDING = spacing.base;

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${date} at ${time}`;
  } catch {
    return iso;
  }
}

function formatLastUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) {
      return `Today, ${time}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${time}`;
    }
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${date}, ${time}`;
  } catch {
    return iso;
  }
}

export function ClientProfileScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors: themeColors } = useThemeMode();
  const clientProfileQuickActionColors = useClientProfileQuickActionColors();
  const { isOnline, checking } = useConnectivity();
  const { touchActivity } = useAuthSession();
  const t = useTranslation();
  const services = useClientServices();
  const visitServices = useVisitServices();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [visits, setVisits] = useState<readonly VisitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const quickActionCardWidth =
    (windowWidth - HORIZONTAL_PADDING * 2 - spacing.sm) / 2;

  const load = useCallback(async () => {
    if (!services || !clientId) {
      return;
    }
    setLoading(true);
    try {
      const result = await services.getClientProfile(clientId);
      setProfile(result);
      setMissing(result == null);
      if (visitServices && result) {
        setVisits(await visitServices.getClientVisitHistory(clientId));
      } else {
        setVisits([]);
      }
    } finally {
      setLoading(false);
    }
  }, [services, visitServices, clientId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={t.clients.loading} />
      </AppScreen>
    );
  }

  if (missing || !profile) {
    return (
      <AppScreen testID="client-profile-missing">
        <AppStateView
          variant="empty"
          heading={t.clients.profile.missingHeading}
          explanation={t.clients.profile.missingBody}
          primaryActionLabel={t.clients.registration.returnToList}
          onPrimaryAction={() => router.replace('/(worker)/clients')}
        />
      </AppScreen>
    );
  }

  const { client } = profile;
  const displayName =
    client.preferredName?.trim() || `${client.givenName} ${client.familyName}`.trim();
  const initials =
    `${client.givenName.trim().charAt(0)}${client.familyName.trim().charAt(0)}`.toUpperCase() ||
    '?';
  const age = formatAgePresentation(
    resolveAgePresentation({
      dateOfBirth: client.dateOfBirth,
      approximateAge: client.approximateAge,
      approximateAgeUnit: client.approximateAgeUnit,
    }),
    {
      unknown: t.clients.age.unknown,
      approximate: (value, unit) => t.clients.age.approximate(value, unit),
      bornOn: (date) => t.clients.age.bornOn(date),
    },
  );
  const sexLabel =
    client.sex && isClientSex(client.sex) ? t.clients.fields.sexOptions[client.sex] : null;
  const identitySubtitle = sexLabel
    ? `${t.clients.categories[client.category]} · ${sexLabel}`
    : t.clients.categories[client.category];
  const locationLine = [client.community, client.region].filter(Boolean).join(', ') || '—';
  const facilityName = profile.facility?.name ?? '—';
  const phoneValue = client.phoneNumber?.trim()
    ? client.phoneNumber
    : t.clients.profile.phoneNotAvailable;
  const consentBadgeLabel =
    client.consentStatus === 'recorded'
      ? t.clients.consent.recorded
      : t.clients.consent[client.consentStatus];
  const consentDetailLabel =
    client.consentStatus === 'recorded'
      ? t.clients.profile.consentRecorded
      : t.clients.consent[client.consentStatus];
  const recentVisits = visits.slice(0, 3);

  return (
    <AppScreen testID="client-profile-screen" padded={false}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + WORKER_BOTTOM_NAV_CLEARANCE + spacing.lg,
            backgroundColor: themeColors.background,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ClientProfileTopBar
          isOnline={isOnline}
          checking={checking}
          onBack={() => router.replace('/(worker)/clients')}
        />

        {client.isDeleted ? (
          <AppText variant="body" color="warning">
            {t.clients.profile.archivedBanner}
          </AppText>
        ) : null}

        <ClientProfileIdentityCard
          initials={initials}
          displayName={displayName}
          subtitle={identitySubtitle}
          clientCode={client.clientCode}
          ageLabel={age}
          consentLabel={consentBadgeLabel}
          locationLine={locationLine}
          facilityName={facilityName}
          onEdit={() => router.push(`/(worker)/clients/${client.id}/edit`)}
        />

        {!client.isDeleted ? (
          <>
            <ClientProfileStartVisitButton
              onPress={() => router.push(`/(worker)/clients/${client.id}/visits/start`)}
            />

            <View style={styles.sectionBlock}>
              <AppText variant="headingSmall">{t.clients.profile.quickActionsTitle}</AppText>
              <ClientProfileQuickActionsGrid>
                <ClientProfileQuickActionCard
                  title={t.clients.profile.quickActions.nutritionTitle}
                  description={t.clients.profile.quickActions.nutritionDescription}
                  backgroundColor={clientProfileQuickActionColors.nutrition.card}
                  iconBackgroundColor={clientProfileQuickActionColors.nutrition.icon}
                  icon={<ProfileClipboardIcon />}
                  cardWidth={quickActionCardWidth}
                  onPress={() => router.push(`/(worker)/clients/${client.id}/nutrition`)}
                  testID="client-profile-nutrition"
                />
                <ClientProfileQuickActionCard
                  title={t.clients.profile.quickActions.voiceTitle}
                  description={t.clients.profile.quickActions.voiceDescription}
                  backgroundColor={clientProfileQuickActionColors.voice.card}
                  iconBackgroundColor={clientProfileQuickActionColors.voice.icon}
                  icon={<ProfileMicIcon />}
                  cardWidth={quickActionCardWidth}
                  onPress={() => router.push(`/(worker)/clients/${client.id}/voice`)}
                  testID="client-profile-voice"
                />
                <ClientProfileQuickActionCard
                  title={t.clients.profile.quickActions.referralTitle}
                  description={t.clients.profile.quickActions.referralDescription}
                  backgroundColor={clientProfileQuickActionColors.referral.card}
                  iconBackgroundColor={clientProfileQuickActionColors.referral.icon}
                  icon={<ProfileReferralIcon />}
                  cardWidth={quickActionCardWidth}
                  onPress={() => router.push(`/(worker)/clients/${client.id}/referrals`)}
                  testID="client-profile-referrals"
                />
                <ClientProfileQuickActionCard
                  title={t.clients.profile.quickActions.reminderTitle}
                  description={t.clients.profile.quickActions.reminderDescription}
                  backgroundColor={clientProfileQuickActionColors.reminder.card}
                  iconBackgroundColor={clientProfileQuickActionColors.reminder.icon}
                  icon={<ProfileReminderIcon />}
                  cardWidth={quickActionCardWidth}
                  onPress={() =>
                    router.push(
                      `/(worker)/more/reminders/create?clientId=${client.id}` as Href,
                    )
                  }
                  testID="client-profile-create-reminder"
                />
              </ClientProfileQuickActionsGrid>
            </View>
          </>
        ) : null}

        <ClientProfileDualColumn>
          <ClientProfileDualColumnItem>
            <ClientProfileSectionCard title={t.clients.profile.detailsTitle} testID="client-profile-details">
              <View style={styles.detailList}>
                <ClientProfileDetailRow
                  icon={<ProfileLocationIcon size={14} />}
                  label={t.clients.profile.community}
                  value={client.community ?? '—'}
                />
                <ClientProfileDetailRow
                  icon={<ProfileRegionIcon size={14} />}
                  label={t.clients.profile.region}
                  value={client.region ?? '—'}
                />
                <ClientProfileDetailRow
                  icon={<ProfileFacilityIcon size={14} />}
                  label={t.clients.profile.facility}
                  value={facilityName}
                />
                <ClientProfileDetailRow
                  icon={<ProfilePhoneIcon size={14} />}
                  label={t.clients.profile.phone}
                  value={phoneValue}
                />
                <ClientProfileDetailRow
                  icon={<ProfileConsentIcon size={14} color={colors.success} />}
                  label={t.clients.registration.consentFieldLabel}
                  value={consentDetailLabel}
                />
                {profile.caregivers.map(({ caregiver, relationship }) => (
                  <ClientProfileDetailRow
                    key={relationship.id}
                    icon={<ProfileCaregiverIcon size={14} />}
                    label={t.clients.profile.caregiver}
                    value={`${caregiver.givenName} ${caregiver.familyName} (${t.clients.relationships[relationship.relationshipType]})`}
                  />
                ))}
              </View>
              <ClientProfileLastUpdated
                label={t.clients.profile.lastUpdatedAt(formatLastUpdated(client.updatedAt))}
              />
            </ClientProfileSectionCard>
          </ClientProfileDualColumnItem>

          <ClientProfileDualColumnItem>
            <ClientProfileSectionCard title={t.clients.profile.recentCareTitle} testID="client-profile-recent-care">
              {recentVisits.length === 0 ? (
                <ClientProfileRecentCareEmpty body={t.clients.profile.recentCareEmpty} />
              ) : (
                <View style={styles.recentList}>
                  {recentVisits.map(({ encounter }) => {
                    const isVoice = encounter.notes?.startsWith(VOICE_MARKER) ?? false;
                    const rawNotes = encounter.notes ?? '';
                    const firstLine = rawNotes.split('\n')[0] ?? '';
                    const fieldsJson = firstLine.startsWith(VOICE_MARKER)
                      ? firstLine.slice(VOICE_MARKER.length)
                      : '[]';

                    return (
                      <ClientProfileRecentCareItem
                        key={encounter.id}
                        title={
                          isVoice
                            ? t.clients.profile.recentVoiceLabel
                            : t.clients.profile.recentVisitLabel
                        }
                        subtitle={formatDateTime(encounter.createdAt)}
                        onPress={() => {
                          if (isVoice) {
                            router.push(
                              asHref(
                                `/(worker)/clients/${client.id}/voice/results?sessionId=${encounter.id}&fieldsJson=${encodeURIComponent(fieldsJson)}`,
                              ),
                            );
                            return;
                          }
                          router.push(`/(worker)/clients/${client.id}/visits/${encounter.id}`);
                        }}
                      />
                    );
                  })}
                </View>
              )}
              <ClientProfileHistoryButton
                label={t.clients.profile.viewFullHistory}
                onPress={() => router.push(`/(worker)/clients/${client.id}/history`)}
              />
            </ClientProfileSectionCard>
          </ClientProfileDualColumnItem>
        </ClientProfileDualColumn>

        <ClientProfileSecurityBanner
          title={t.clients.registration.securityTitle}
          body={t.clients.registration.securityBody}
        />

        {!client.isDeleted ? (
          <AppButton
            label={t.clients.profile.archive}
            variant="destructive"
            onPress={() => router.push(`/(worker)/clients/${client.id}/archive`)}
            testID="client-profile-delete"
          />
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: spacing.base,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  detailList: {
    gap: spacing.md,
  },
  recentList: {
    gap: spacing.sm,
  },
});
