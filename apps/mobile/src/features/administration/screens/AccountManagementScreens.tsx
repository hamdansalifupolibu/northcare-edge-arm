import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  AppTextInput,
  LoadingState,
  PasswordField,
  ScreenTitle,
  ScrollableAppScreen,
  StatusChip,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import {
  AdministrationOfflineState,
  mapAdministrationError,
} from '../components/AdministrationStateViews';
import { accountStatusChipTone, accountStatusLabelKey } from '../domain/accountStatuses';
import { AdministrationError } from '../domain/errors';
import { allowsOtherProfessionDescription } from '../domain/professions';
import type {
  AdminAccountDetails,
  AdminDevice,
  AdminFacility,
  AdminHistoryEvent,
  ProfessionRegistryItem,
} from '../domain/types';
import {
  validateProfessionalProfileForm,
  validateTemporaryPassword,
  validateWorkerEmail,
} from '../domain/policies';
import { ActivationHandoffCard } from '../components/ActivationHandoffCard';
import { AdminFacilityPicker } from '../components/AdminFacilityPicker';
import { AdminProfessionalProfileFields } from '../components/AdminProfessionalProfileFields';
import { AdminRegistrationReviewSummary } from '../components/AdminRegistrationReviewSummary';
import { useOfflineProvisioningServices } from '../hooks/useOfflineProvisioningServices';
import {
  clearRegisteredActivationHandoff,
  clearRegisterWorkerDraft,
  getRegisteredActivationHandoff,
  getRegisterWorkerDraft,
  setRegisteredActivationHandoff,
  updateRegisterWorkerDraft,
} from '../session/registerWorkerDraftStore';
import { useAdministrationServices } from '../hooks/useAdministrationServices';

type TranslationStrings = ReturnType<typeof useTranslation>;

function statusLabel(
  accountStatus: AdminAccountDetails['accountStatus'],
  t: TranslationStrings,
): string {
  const key = accountStatusLabelKey(accountStatus);
  return t.administration.statuses[key as keyof typeof t.administration.statuses] ?? key;
}

function professionValidationMessage(
  code: 'profession' | 'otherProfessionDescription' | 'emergencyRequiresCommunity' | string,
  t: TranslationStrings,
): string {
  if (code === 'profession') {
    return t.administration.register.validation.profession;
  }
  if (code === 'otherProfessionDescription') {
    return t.administration.register.validation.otherProfessionDescription;
  }
  if (code === 'emergencyRequiresCommunity') {
    return t.administration.register.validation.emergencyRequiresCommunity;
  }
  return t.administration.errorHeading;
}

function professionLabelFor(
  professions: readonly ProfessionRegistryItem[],
  profession: string,
): string {
  return professions.find((item) => item.value === profession)?.label ?? profession;
}

function sortedActiveProfessions(
  professions: readonly ProfessionRegistryItem[],
): readonly ProfessionRegistryItem[] {
  return [...professions]
    .filter((item) => item.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function AccountDetailsScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const { touchActivity } = useAuthSession();
  const services = useAdministrationServices();
  const [account, setAccount] = useState<AdminAccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<'none' | 'offline' | 'generic'>('none');

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setErrorKind('none');
    try {
      setAccount(await services.getAccountDetails(accountId));
    } catch (error) {
      setAccount(null);
      setErrorKind(mapAdministrationError(error) === 'offline' ? 'offline' : 'generic');
    } finally {
      setLoading(false);
    }
  }, [accountId, services]);

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
      <AppScreen testID="admin-account-details">
        <LoadingState message={t.administration.retry} />
      </AppScreen>
    );
  }

  if (errorKind === 'offline') {
    return (
      <AppScreen testID="admin-account-details">
        <AdministrationOfflineState onRetry={() => void load()} />
      </AppScreen>
    );
  }

  if (!account) {
    return (
      <AppScreen testID="admin-account-details">
        <AppStateView variant="error" heading={t.administration.errorHeading} explanation="" />
      </AppScreen>
    );
  }

  const isWorker = account.roles.includes('worker');
  const profile = account.professionalProfile;

  return (
    <AppScreen testID="admin-account-details">
      <ScreenTitle>{t.administration.account.detailsTitle}</ScreenTitle>
      <AppText variant="headingSmall">{account.displayName}</AppText>
      <StatusChip label={statusLabel(account.accountStatus, t)} tone={accountStatusChipTone(account.accountStatus)} />
      <AppText variant="body" color="secondary">
        {t.administration.account.emailLabel}: {account.email ?? '—'}
      </AppText>
      <AppText variant="body" color="secondary">
        {t.administration.account.facilityLabel}: {account.facilityName}
      </AppText>
      <AppText variant="body" color="secondary">
        {t.administration.account.organisationLabel}: {account.organisationName}
      </AppText>
      {isWorker ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="headingSmall">{t.administration.account.professionalProfileTitle}</AppText>
          {profile == null ? (
            <>
              <AppText variant="body" color="secondary">
                {t.administration.account.profileNotConfigured}
              </AppText>
              <AppButton
                label={t.administration.account.addProfileAction}
                variant="secondary"
                onPress={() =>
                  router.push(
                    `/(admin)/accounts/${account.accountId}/professional-profile` as Href,
                  )
                }
              />
            </>
          ) : (
            <>
              <AppText variant="body" color="secondary">
                {t.administration.register.professionLabel}: {profile.profession}
              </AppText>
              {profile.otherProfessionDescription ? (
                <AppText variant="body" color="secondary">
                  {t.administration.register.otherProfessionLabel}:{' '}
                  {profile.otherProfessionDescription}
                </AppText>
              ) : null}
              <AppText variant="body" color="secondary">
                {t.administration.register.communityRequestsLabel}:{' '}
                {profile.communityRequestsEnabled
                  ? t.administration.account.enabled
                  : t.administration.account.disabled}
              </AppText>
              <AppText variant="body" color="secondary">
                {t.administration.register.emergencyRequestsLabel}:{' '}
                {profile.emergencyRequestsEnabled
                  ? t.administration.account.enabled
                  : t.administration.account.disabled}
              </AppText>
              <AppButton
                label={t.administration.account.editProfileAction}
                variant="secondary"
                onPress={() =>
                  router.push(
                    `/(admin)/accounts/${account.accountId}/professional-profile` as Href,
                  )
                }
              />
            </>
          )}
        </View>
      ) : null}
      <AppButton
        label={t.administration.account.facilityAction}
        variant="secondary"
        onPress={() => router.push(`/(admin)/accounts/${account.accountId}/facility` as Href)}
      />
      <AppButton
        label={t.administration.account.statusAction}
        variant="secondary"
        onPress={() => router.push(`/(admin)/accounts/${account.accountId}/status` as Href)}
      />
      <AppButton
        label={t.administration.account.resetAccessAction}
        variant="secondary"
        onPress={() => router.push(`/(admin)/accounts/${account.accountId}/reset-access` as Href)}
      />
      <AppButton
        label={t.administration.account.devicesAction}
        variant="secondary"
        onPress={() => router.push(`/(admin)/accounts/${account.accountId}/devices` as Href)}
      />
      <AppButton
        label={t.administration.account.historyAction}
        variant="tertiary"
        onPress={() => router.push(`/(admin)/accounts/${account.accountId}/history` as Href)}
      />
    </AppScreen>
  );
}

export function AccountProfessionalProfileScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const services = useAdministrationServices();
  const [account, setAccount] = useState<AdminAccountDetails | null>(null);
  const [professions, setProfessions] = useState<readonly ProfessionRegistryItem[]>([]);
  const [profession, setProfession] = useState('');
  const [otherProfessionDescription, setOtherProfessionDescription] = useState('');
  const [communityRequestsEnabled, setCommunityRequestsEnabled] = useState(false);
  const [emergencyRequestsEnabled, setEmergencyRequestsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [details, professionList] = await Promise.all([
          services.getAccountDetails(accountId),
          services.listProfessions(),
        ]);
        setAccount(details);
        setProfessions(professionList);
        const existing = details.professionalProfile;
        setProfession(existing?.profession ?? '');
        setOtherProfessionDescription(existing?.otherProfessionDescription ?? '');
        setCommunityRequestsEnabled(existing?.communityRequestsEnabled ?? false);
        setEmergencyRequestsEnabled(existing?.emergencyRequestsEnabled ?? false);
      } catch (caught) {
        setError(
          mapAdministrationError(caught) === 'offline'
            ? t.administration.offlineMutation
            : t.administration.errorHeading,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId, services]);

  const submit = async (): Promise<void> => {
    if (!account) return;
    const validationCode = validateProfessionalProfileForm({
      profession,
      otherProfessionDescription,
      communityRequestsEnabled,
      emergencyRequestsEnabled,
    });
    if (validationCode) {
      setError(professionValidationMessage(validationCode, t));
      return;
    }
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      await services.upsertProfessionalProfile(account.accountId, {
        profession,
        otherProfessionDescription: allowsOtherProfessionDescription(profession)
          ? otherProfessionDescription.trim()
          : null,
        communityRequestsEnabled,
        emergencyRequestsEnabled,
        expectedProfileVersion: account.professionalProfile?.version ?? null,
      });
      setSavedMessage(t.administration.account.profileUpdatedLabel);
      router.back();
    } catch (caught) {
      if (caught instanceof AdministrationError && caught.code === 'profileVersionConflict') {
        setError(t.administration.account.versionConflict);
      } else {
        setError(
          mapAdministrationError(caught) === 'offline'
            ? t.administration.offlineMutation
            : t.administration.errorHeading,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen testID="admin-account-professional-profile">
        <LoadingState message={t.administration.loading} />
      </AppScreen>
    );
  }

  const activeProfessions = sortedActiveProfessions(professions);

  return (
    <ScrollableAppScreen
      testID="admin-account-professional-profile"
      contentContainerStyle={{ gap: spacing.lg }}
    >
      <ScreenTitle>{t.administration.account.professionalProfileTitle}</ScreenTitle>
      <AdminProfessionalProfileFields
        professions={activeProfessions}
        selectedProfession={profession}
        otherProfessionDescription={otherProfessionDescription}
        communityRequestsEnabled={communityRequestsEnabled}
        emergencyRequestsEnabled={emergencyRequestsEnabled}
        onProfessionChange={setProfession}
        onOtherProfessionDescriptionChange={setOtherProfessionDescription}
        onCommunityRequestsEnabledChange={setCommunityRequestsEnabled}
        onEmergencyRequestsEnabledChange={setEmergencyRequestsEnabled}
      />
      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}
      {savedMessage ? (
        <AppText variant="body" color="secondary">
          {savedMessage}
        </AppText>
      ) : null}
      <AppButton
        label={
          account?.professionalProfile
            ? t.administration.account.editProfileAction
            : t.administration.account.addProfileAction
        }
        loading={saving}
        onPress={() => void submit()}
      />
    </ScrollableAppScreen>
  );
}

export function AccountFacilityScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const services = useAdministrationServices();
  const [account, setAccount] = useState<AdminAccountDetails | null>(null);
  const [facilities, setFacilities] = useState<readonly AdminFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    void (async () => {
      const [details, facilityList] = await Promise.all([
        services.getAccountDetails(accountId),
        services.listFacilities(),
      ]);
      setAccount(details);
      setFacilities(facilityList);
      setSelectedFacilityId(details.facilityId);
    })();
  }, [accountId, services]);

  const submit = async (): Promise<void> => {
    if (!account || !selectedFacilityId) return;
    setSaving(true);
    setError(null);
    try {
      await services.assignWorkerFacility(
        account.accountId,
        selectedFacilityId,
        account.accountVersion,
      );
      router.back();
    } catch (caught) {
      setError(
        mapAdministrationError(caught) === 'offline'
          ? t.administration.offlineMutation
          : t.administration.account.versionConflict,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollableAppScreen testID="admin-account-facility" contentContainerStyle={{ gap: spacing.lg }}>
      <ScreenTitle>{t.administration.account.facilityAction}</ScreenTitle>
      <AdminFacilityPicker
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        onSelect={setSelectedFacilityId}
      />
      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}
      <AppButton label={t.administration.register.confirmRegister} loading={saving} onPress={() => void submit()} />
    </ScrollableAppScreen>
  );
}

export function AccountStatusScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const services = useAdministrationServices();
  const [account, setAccount] = useState<AdminAccountDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    void services.getAccountDetails(accountId).then(setAccount);
  }, [accountId, services]);

  const mutate = async (action: 'deactivate' | 'reactivate'): Promise<void> => {
    if (!account) return;
    setError(null);
    try {
      if (action === 'deactivate') {
        await services.deactivateWorker(account.accountId, account.accountVersion);
      } else {
        await services.reactivateWorker(account.accountId, account.accountVersion);
      }
      router.back();
    } catch (caught) {
      setError(
        mapAdministrationError(caught) === 'offline'
          ? t.administration.offlineMutation
          : t.administration.account.versionConflict,
      );
    }
  };

  const isInactive = account?.accountStatus === 'inactive';

  return (
    <AppScreen testID="admin-account-status">
      <ScreenTitle>{t.administration.account.statusAction}</ScreenTitle>
      {account ? (
        <StatusChip
          label={statusLabel(account.accountStatus, t)}
          tone={accountStatusChipTone(account.accountStatus)}
        />
      ) : null}
      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}
      {isInactive ? (
        <AppButton
          label={t.administration.account.reactivate}
          onPress={() => void mutate('reactivate')}
        />
      ) : (
        <AppButton
          label={t.administration.account.deactivate}
          onPress={() => void mutate('deactivate')}
        />
      )}
    </AppScreen>
  );
}

export function AccountResetAccessScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const services = useAdministrationServices();
  const [account, setAccount] = useState<AdminAccountDetails | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    void services.getAccountDetails(accountId).then(setAccount);
  }, [accountId, services]);

  const submit = async (): Promise<void> => {
    if (!account) return;
    if (!validateTemporaryPassword(temporaryPassword)) {
      setError(t.administration.register.validation.temporaryPassword);
      return;
    }
    setError(null);
    try {
      await services.initiateWorkerAccessReset(
        account.accountId,
        account.accountVersion,
        temporaryPassword,
      );
      setTemporaryPassword('');
      router.back();
    } catch (caught) {
      setError(
        mapAdministrationError(caught) === 'offline'
          ? t.administration.offlineMutation
          : t.administration.account.versionConflict,
      );
    }
  };

  return (
    <AppScreen testID="admin-account-reset-access">
      <ScreenTitle>{t.administration.account.resetTitle}</ScreenTitle>
      <AppText variant="body" color="secondary">
        {t.administration.account.resetBody}
      </AppText>
      <PasswordField
        label={t.administration.register.temporaryPasswordLabel}
        value={temporaryPassword}
        onChangeText={setTemporaryPassword}
        testID="admin-reset-temporary-password"
      />
      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}
      <AppButton label={t.administration.account.resetConfirm} onPress={() => void submit()} />
    </AppScreen>
  );
}

export function AccountDevicesScreen() {
  const t = useTranslation();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const services = useAdministrationServices();
  const [devices, setDevices] = useState<readonly AdminDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      setDevices(await services.listRegisteredDevices(accountId));
    } catch (caught) {
      setError(
        mapAdministrationError(caught) === 'offline'
          ? t.administration.offlineMutation
          : t.administration.errorHeading,
      );
    }
  }, [accountId, services]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const revoke = async (deviceId: string): Promise<void> => {
    if (!accountId) return;
    setError(null);
    try {
      await services.revokeRegisteredDevice(accountId, deviceId);
      await load();
    } catch (caught) {
      setError(
        mapAdministrationError(caught) === 'offline'
          ? t.administration.offlineMutation
          : t.administration.account.versionConflict,
      );
    }
  };

  return (
    <AppScreen testID="admin-account-devices">
      <ScreenTitle>{t.administration.account.devicesAction}</ScreenTitle>
      {error ? (
        <AppText variant="body" color="urgent">
          {error}
        </AppText>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {devices.map((device) => (
          <View key={device.deviceId} style={{ gap: spacing.xs }}>
            <AppText variant="body">
              {device.label ?? device.deviceId}
              {device.isCurrent ? ` (${t.administration.account.currentDevice})` : ''}
            </AppText>
            <AppText variant="caption" color="secondary">
              {device.status}
            </AppText>
            {!device.isCurrent && device.status !== 'revoked' ? (
              <AppButton
                label={t.administration.account.revokeDevice}
                variant="secondary"
                onPress={() => void revoke(device.deviceId)}
              />
            ) : null}
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

export function AccountHistoryScreen() {
  const t = useTranslation();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const services = useAdministrationServices();
  const [items, setItems] = useState<readonly AdminHistoryEvent[]>([]);

  useEffect(() => {
    if (!accountId) return;
    void services.getAdministrationHistory(accountId).then(setItems);
  }, [accountId, services]);

  return (
    <AppScreen testID="admin-account-history">
      <ScreenTitle>{t.administration.account.historyAction}</ScreenTitle>
      {items.length === 0 ? (
        <AppText variant="body" color="secondary">
          {t.administration.account.historyEmpty}
        </AppText>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((item) => (
            <AppText key={item.eventId} variant="body" color="secondary">
              {item.eventType} · {item.result} · {item.createdAt}
            </AppText>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

type RegisterDraft = {
  readonly displayName: string;
  readonly email: string;
  readonly facilityId: string;
  readonly profession: string;
  readonly otherProfessionDescription: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
};

export function RegisterWorkerFlowScreen({
  step,
}: {
  readonly step: 'index' | 'identity' | 'profession' | 'facility' | 'review' | 'success';
}) {
  const t = useTranslation();
  const router = useRouter();
  const services = useAdministrationServices();
  const offlineProvisioning = useOfflineProvisioningServices();
  const { session } = useAuthSession();
  const [facilities, setFacilities] = useState<readonly AdminFacility[]>([]);
  const [professions, setProfessions] = useState<readonly ProfessionRegistryItem[]>([]);
  const initialDraft = getRegisterWorkerDraft();
  const [draft, setDraft] = useState<RegisterDraft>({
    displayName: initialDraft?.displayName ?? '',
    email: initialDraft?.email ?? '',
    facilityId: initialDraft?.facilityId ?? 'fac-dev-001',
    profession: initialDraft?.profession ?? '',
    otherProfessionDescription: initialDraft?.otherProfessionDescription ?? null,
    communityRequestsEnabled: initialDraft?.communityRequestsEnabled ?? false,
    emergencyRequestsEnabled: initialDraft?.emergencyRequestsEnabled ?? false,
  });
  const activationHandoff = getRegisteredActivationHandoff();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReference = async (): Promise<void> => {
      if (!offlineProvisioning) {
        return;
      }
      try {
        const [apiFacilities, apiProfessions] = await Promise.all([
          services.listFacilities(),
          services.listProfessions(),
        ]);
        await offlineProvisioning.cacheReferenceData({
          facilities: apiFacilities,
          professions: apiProfessions,
        });
        setFacilities(apiFacilities);
        setProfessions(apiProfessions);
      } catch {
        const [cachedFacilities, cachedProfessions] = await Promise.all([
          offlineProvisioning.listFacilities(),
          offlineProvisioning.listProfessions(),
        ]);
        setFacilities(cachedFacilities);
        setProfessions(cachedProfessions);
      }
    };
    void loadReference();
  }, [offlineProvisioning, services]);

  const updateDraft = (patch: Partial<RegisterDraft>): void => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      updateRegisterWorkerDraft(next);
      return next;
    });
  };

  const setCommunityEnabled = (enabled: boolean): void => {
    setDraft((current) => {
      const next = {
        ...current,
        communityRequestsEnabled: enabled,
        emergencyRequestsEnabled: enabled ? current.emergencyRequestsEnabled : false,
      };
      updateRegisterWorkerDraft(next);
      return next;
    });
  };

  const submit = async (): Promise<void> => {
    setError(null);
    if (!offlineProvisioning) {
      setError(t.administration.activation.databaseNotReady);
      return;
    }
    if (!session?.accountId || !session.displayName) {
      setError(t.administration.errorHeading);
      return;
    }
    const validationCode = validateProfessionalProfileForm({
      profession: draft.profession,
      otherProfessionDescription: draft.otherProfessionDescription,
      communityRequestsEnabled: draft.communityRequestsEnabled,
      emergencyRequestsEnabled: draft.emergencyRequestsEnabled,
    });
    if (validationCode) {
      setError(professionValidationMessage(validationCode, t));
      return;
    }
    const stored = updateRegisterWorkerDraft(draft);
    const facilityName =
      facilities.find((facility) => facility.facilityId === stored.facilityId)?.name ??
      stored.facilityId;
    try {
      const result = await offlineProvisioning.registerWorkerOffline({
        enrollmentId: stored.idempotencyKey,
        displayName: stored.displayName.trim(),
        email: stored.email.trim().toLowerCase(),
        facilityId: stored.facilityId,
        facilityName,
        profession: stored.profession,
        professionLabel: professionLabelFor(professions, stored.profession),
        otherProfessionDescription: allowsOtherProfessionDescription(stored.profession)
          ? stored.otherProfessionDescription?.trim() ?? null
          : null,
        communityRequestsEnabled: stored.communityRequestsEnabled,
        emergencyRequestsEnabled: stored.emergencyRequestsEnabled,
        adminAccountId: session.accountId,
        adminDisplayName: session.displayName,
        organisationId: session.organisationId,
      });
      setRegisteredActivationHandoff({
        enrollmentId: result.enrollmentId,
        activationUri: result.activationUri,
        expiresAt: result.expiresAt,
        displayName: stored.displayName.trim(),
      });
      router.replace('/(admin)/accounts/register/success' as Href);
    } catch {
      setError(t.administration.errorHeading);
    }
  };

  if (step === 'index' || step === 'identity') {
    return (
      <AppScreen testID="admin-register-identity">
        <ScreenTitle>{t.administration.register.title}</ScreenTitle>
        <AppText variant="body" color="secondary">
          {t.administration.register.roleFixed}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.administration.register.roleNote}
        </AppText>
        <AppTextInput
          label={t.administration.register.displayNameLabel}
          value={draft.displayName}
          onChangeText={(value) => updateDraft({ displayName: value })}
        />
        <AppTextInput
          label={t.administration.register.emailLabel}
          value={draft.email}
          onChangeText={(value) => updateDraft({ email: value })}
          autoCapitalize="none"
        />
        <AppText variant="caption" color="secondary">
          {t.administration.register.offlineIdentityNote}
        </AppText>
        <AppButton
          label={t.onboarding.continue}
          onPress={() => {
            if (draft.displayName.trim().length < 2) {
              setError(t.administration.register.validation.displayName);
              return;
            }
            if (!validateWorkerEmail(draft.email)) {
              setError(t.administration.register.validation.email);
              return;
            }
            setError(null);
            router.push('/(admin)/accounts/register/profession' as Href);
          }}
        />
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
      </AppScreen>
    );
  }

  if (step === 'profession') {
    const activeProfessions = sortedActiveProfessions(professions);

    return (
      <ScrollableAppScreen testID="admin-register-profession" contentContainerStyle={{ gap: spacing.lg }}>
        <ScreenTitle>{t.administration.register.professionHeading}</ScreenTitle>
        <AdminProfessionalProfileFields
          professions={activeProfessions}
          selectedProfession={draft.profession}
          otherProfessionDescription={draft.otherProfessionDescription ?? ''}
          communityRequestsEnabled={draft.communityRequestsEnabled}
          emergencyRequestsEnabled={draft.emergencyRequestsEnabled}
          onProfessionChange={(profession) => updateDraft({ profession })}
          onOtherProfessionDescriptionChange={(value) =>
            updateDraft({ otherProfessionDescription: value || null })
          }
          onCommunityRequestsEnabledChange={setCommunityEnabled}
          onEmergencyRequestsEnabledChange={(emergencyRequestsEnabled) =>
            updateDraft({ emergencyRequestsEnabled })
          }
        />
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={t.onboarding.continue}
          onPress={() => {
            const validationCode = validateProfessionalProfileForm({
              profession: draft.profession,
              otherProfessionDescription: draft.otherProfessionDescription,
              communityRequestsEnabled: draft.communityRequestsEnabled,
              emergencyRequestsEnabled: draft.emergencyRequestsEnabled,
            });
            if (validationCode) {
              setError(professionValidationMessage(validationCode, t));
              return;
            }
            setError(null);
            router.push('/(admin)/accounts/register/facility' as Href);
          }}
        />
      </ScrollableAppScreen>
    );
  }

  if (step === 'facility') {
    return (
      <ScrollableAppScreen testID="admin-register-facility" contentContainerStyle={{ gap: spacing.lg }}>
        <ScreenTitle>{t.administration.register.facilityHeading}</ScreenTitle>
        <AdminFacilityPicker
          facilities={facilities}
          selectedFacilityId={draft.facilityId || null}
          onSelect={(facilityId) => updateDraft({ facilityId })}
        />
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={t.onboarding.continue}
          onPress={() => {
            if (!draft.facilityId) {
              setError(t.administration.register.validation.facility);
              return;
            }
            setError(null);
            router.push('/(admin)/accounts/register/review' as Href);
          }}
        />
      </ScrollableAppScreen>
    );
  }

  if (step === 'review') {
    return (
      <ScrollableAppScreen testID="admin-register-review" contentContainerStyle={{ gap: spacing.lg }}>
        <ScreenTitle>{t.administration.register.reviewHeading}</ScreenTitle>
        <AdminRegistrationReviewSummary
          draft={draft}
          facilities={facilities}
          professionLabel={professionLabelFor(professions, draft.profession)}
        />
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}
        <AppButton label={t.administration.register.confirmRegister} onPress={() => void submit()} />
      </ScrollableAppScreen>
    );
  }

  return (
    <AppScreen testID="admin-register-success">
      {activationHandoff?.activationUri ? (
        <ActivationHandoffCard
          activationUri={activationHandoff.activationUri}
          expiresAt={activationHandoff.expiresAt}
          workerName={activationHandoff.displayName}
          title={t.administration.register.successHeading}
          body={t.administration.register.successBody}
          expiryLabel={t.administration.activation.expiresAt}
          syncFutureNote={t.administration.activation.syncFutureNote}
        />
      ) : (
        <>
          <ScreenTitle>{t.administration.register.successHeading}</ScreenTitle>
          <AppText variant="body" color="secondary">
            {t.administration.register.successBody}
          </AppText>
        </>
      )}
      <AppButton
        label={t.administration.register.registerAnother}
        variant="secondary"
        onPress={() => {
          clearRegisterWorkerDraft();
          clearRegisteredActivationHandoff();
          router.replace('/(admin)/accounts/register' as Href);
        }}
      />
      <AppButton
        label={t.administration.register.backToAccounts}
        variant="tertiary"
        onPress={() => router.replace('/(admin)/accounts' as Href)}
      />
    </AppScreen>
  );
}
