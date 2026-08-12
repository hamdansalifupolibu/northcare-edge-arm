import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Client } from '../../../data/domain/entities/entities';
import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import { CLIENT_CATEGORIES } from '../../../data/domain/enums/clientCategory';
import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  LoadingState,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../../worker-home/domain/workerNav';
import { ClientListItem } from '../components/ClientListItem';
import { ClientListScreenHeader } from '../components/ClientListScreenHeader';
import { ClientListSearchField } from '../components/ClientListSearchField';
import { ClientListUserPlusIcon } from '../components/ClientListIcons';
import { useClientServices } from '../hooks/useClientServices';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useVoiceServices } from '../../voice/hooks/useVoiceServices';

export function ClientListScreen() {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useThemeMode();
  const { isOnline, checking } = useConnectivity();
  const { mode, tempUri, durationMs, purpose } = useLocalSearchParams<{
    mode?: string;
    tempUri?: string;
    durationMs?: string;
    purpose?: string;
  }>();
  const isVoiceMode = mode === 'voice' || mode === 'voice-assign';
  const isNutritionMode = purpose === 'nutrition';
  const isReferralMode = purpose === 'referral';
  const { session, account, touchActivity } = useAuthSession();
  const services = useClientServices();
  const voiceServices = useVoiceServices();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [category, setCategory] = useState<ClientCategory | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const screenTitle = isReferralMode
    ? t.clients.referralSelectTitle
    : isNutritionMode
      ? t.clients.nutritionSelectTitle
      : isVoiceMode
        ? t.clients.voiceSelectTitle
        : t.clients.title;
  const screenSubtitle = isReferralMode
    ? t.clients.referralSelectSubtitle
    : isNutritionMode
      ? t.clients.nutritionSelectSubtitle
      : isVoiceMode
        ? t.clients.voiceSelectSubtitle
        : t.clients.subtitle;

  const load = useCallback(async () => {
    if (!services || !session) {
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const rows = await services.searchClients({
        query: debouncedQuery,
        category,
        facilityId: session.facilityId,
      });
      setClients(rows);
    } catch {
      setError(true);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [services, session, debouncedQuery, category]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const goRegister = () => {
    router.push('/(worker)/clients/register');
  };

  const handleSelectClient = async (clientId: string) => {
    if (mode === 'voice-assign' && tempUri && voiceServices && account?.accountId) {
      setAssigning(true);
      try {
        const decodedUri = decodeURIComponent(tempUri);
        const file = new File(decodedUri);
        if (!file.exists) {
          throw new Error(`Temp recording file not found at path: ${decodedUri}`);
        }

        const vSession = await voiceServices.startSession({
          clientId,
          accountId: account.accountId,
        });
        await voiceServices.recordConsent({
          sessionId: vSession.id,
          status: 'recorded',
          accountId: account.accountId,
        });
        await voiceServices.saveRecording({
          sessionId: vSession.id,
          tempUri: decodedUri,
          durationMs: Number(durationMs) || 1000,
          accountId: account.accountId,
        });

        try {
          file.delete();
        } catch (delError) {
          console.warn('Failed to delete temp recording file:', delError);
        }

        router.push(`/(worker)/clients/${clientId}/voice/transcript?sessionId=${vSession.id}`);
      } catch (err: unknown) {
        console.error('FAILED TO ASSIGN RECORDING:', err);
        Alert.alert(
          t.clients.voiceAssignFailedTitle,
          mapUserFacingError(err, t.clients.voiceAssignFailedBody),
        );
        setAssigning(false);
      }
    } else if (isVoiceMode) {
      router.push(`/(worker)/clients/${clientId}/voice`);
    } else if (isNutritionMode) {
      router.push(`/(worker)/clients/${clientId}/nutrition/start`);
    } else if (isReferralMode) {
      router.push(`/(worker)/clients/${clientId}/referrals/create?origin=workerInitiated`);
    } else {
      router.push(`/(worker)/clients/${clientId}`);
    }
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <ClientListScreenHeader
        title={screenTitle}
        subtitle={screenSubtitle}
        isOnline={isOnline}
        checking={checking}
        onBack={() =>
          router.replace(isReferralMode ? '/(worker)/referrals' : '/(worker)')
        }
        onRegister={goRegister}
      />

      <AppButton
        label={t.clients.register}
        onPress={goRegister}
        leadingIcon={<ClientListUserPlusIcon />}
        testID="client-list-register"
      />

      {isReferralMode ? (
        <AppText variant="body" color="secondary">
          {t.clients.referralSelectHint}
        </AppText>
      ) : null}

      {isVoiceMode ? (
        <AppText variant="body" color="secondary">
          {t.clients.voiceSelectHint}
        </AppText>
      ) : null}

      <ClientListSearchField
        value={query}
        placeholder={t.clients.searchPlaceholder}
        onChangeText={setQuery}
        testID="client-list-search"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        testID="client-list-filters"
      >
        <FilterChip
          label={t.clients.filterAll}
          selected={category === null}
          onPress={() => setCategory(null)}
        />
        {CLIENT_CATEGORIES.map((item) => (
          <FilterChip
            key={item}
            label={t.clients.categories[item]}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const listEmpty = !loading && !error ? (
    !debouncedQuery && !category ? (
      <AppStateView
        variant="empty"
        heading={t.clients.emptyHeading}
        explanation={t.clients.emptyBody}
        primaryActionLabel={t.clients.emptyAction}
        onPrimaryAction={goRegister}
        testID="client-list-empty"
      />
    ) : (
      <AppStateView
        variant="noResults"
        heading={t.clients.noResultsHeading}
        explanation={t.clients.noResultsBody}
        testID="client-list-no-results"
      />
    )
  ) : null;

  if (assigning) {
    return (
      <AppScreen>
        <LoadingState message={t.clients.voiceAssigning} />
      </AppScreen>
    );
  }

  return (
    <AppScreen testID="client-list-screen" padded={false}>
      <FlatList
        data={!loading && !error ? clients : []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <LoadingState message={t.clients.loading} />
            </View>
          ) : error ? (
            <AppStateView
              variant="error"
              heading={t.clients.errorHeading}
              explanation={t.clients.errorBody}
              primaryActionLabel={t.clients.retry}
              onPrimaryAction={() => {
                void load();
              }}
              testID="client-list-error"
            />
          ) : (
            <View style={{ height: spacing.sm }} />
          )
        }
        renderItem={({ item }) => (
          <ClientListItem
            client={item}
            onPress={() => void handleSelectClient(item.id)}
            testID={`client-list-item-${item.id}`}
          />
        )}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + WORKER_BOTTOM_NAV_CLEARANCE + spacing.lg,
          backgroundColor: themeColors.background,
        }}
        showsVerticalScrollIndicator={false}
        testID="client-list"
      />
    </AppScreen>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <AppText
        variant="caption"
        style={[
          styles.chipLabel,
          { color: selected ? colors.textInverse : colors.primary },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterRow: {
    gap: spacing.xs,
    paddingRight: spacing.base,
  },
  chip: {
    minHeight: 36,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontWeight: '600',
  },
  loadingWrap: {
    paddingVertical: spacing.xl,
  },
});
