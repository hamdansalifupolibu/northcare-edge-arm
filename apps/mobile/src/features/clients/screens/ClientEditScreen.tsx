import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AGE_UNITS, type AgeUnit } from '../../../data/domain/enums/ageUnit';
import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import { isClientSex, type ClientSex } from '../../../data/domain/enums/clientSex';
import {
  CONSENT_STATUSES,
  type ConsentStatus,
} from '../../../data/domain/enums/domainEnums';
import { isRepositoryError } from '../../../data';
import {
  AppStateView,
  AppTextInput,
  CheckboxField,
  FormErrorText,
  FormLabel,
  LoadingState,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { NORTHERN_GHANA_REGIONS } from '../domain/locationOptions';
import {
  type EditClientDraft,
  type FieldError,
  validateEditClientDraft,
} from '../application/validation';
import { useClientServices } from '../hooks/useClientServices';
import {
  ClientEditMetaCard,
  ClientEditShell,
  ClientEditStaleBanner,
} from '../components/ClientEditShell';
import {
  RegisterFormError,
  RegisterSelectCard,
  RegisterSexSelector,
  RegisterStepHeading,
  RegisterUnitChipRow,
} from '../components/ClientRegisterSharedUi';

function resolveAgeMode(client: {
  dateOfBirth: string | null;
  approximateAge: number | null;
}): EditClientDraft['ageMode'] {
  if (client.dateOfBirth) {
    return 'dateOfBirth';
  }
  if (client.approximateAge != null) {
    return 'approximateAge';
  }
  return 'unknown';
}

export function ClientEditScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const t = useTranslation();
  const services = useClientServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [localVersion, setLocalVersion] = useState(1);
  const [clientCode, setClientCode] = useState('');
  const [clientCategory, setClientCategory] = useState<ClientCategory | null>(null);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [facilityLabel, setFacilityLabel] = useState('');
  const [originalConsent, setOriginalConsent] = useState<ConsentStatus | null>(null);
  const [draft, setDraft] = useState<EditClientDraft>({
    givenName: '',
    familyName: '',
    preferredName: '',
    sex: '',
    ageMode: 'unknown',
    dateOfBirth: '',
    approximateAge: '',
    approximateAgeUnit: null,
    pregnancyStatus: '',
    estimatedDeliveryDate: '',
    phoneNumber: '',
    phoneNotAvailable: true,
    community: '',
    district: '',
    region: '',
    consentStatus: null,
    notes: '',
  });

  const patch = (partial: Partial<EditClientDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const errorFor = (field: string) => fieldErrors.find((item) => item.field === field);

  const resolveError = (error: FieldError | undefined): string => {
    if (!error) {
      return '';
    }
    const map = t.clients.validation as Record<string, string>;
    const short = error.messageKey.replace('clients.validation.', '');
    return map[short] ?? error.messageKey;
  };

  const load = useCallback(async () => {
    if (!services || !clientId) {
      return;
    }
    setLoading(true);
    setStale(false);
    setError(null);
    setFieldErrors([]);
    try {
      const profile = await services.getClientProfile(clientId);
      if (!profile || profile.client.isDeleted) {
        setError('missing');
        return;
      }
      const { client } = profile;
      setLocalVersion(client.localVersion);
      setClientCode(client.clientCode);
      setClientCategory(client.category);
      setCategoryLabel(t.clients.categories[client.category]);
      setFacilityLabel(profile.facility?.name ?? '—');
      setOriginalConsent(client.consentStatus);
      setDraft({
        givenName: client.givenName,
        familyName: client.familyName,
        preferredName: client.preferredName ?? '',
        sex: client.sex ?? '',
        ageMode: resolveAgeMode(client),
        dateOfBirth: client.dateOfBirth ?? '',
        approximateAge:
          client.approximateAge != null ? String(client.approximateAge) : '',
        approximateAgeUnit: client.approximateAgeUnit,
        pregnancyStatus: client.pregnancyStatus ?? '',
        estimatedDeliveryDate: client.estimatedDeliveryDate ?? '',
        phoneNumber: client.phoneNumber ?? '',
        phoneNotAvailable: !client.phoneNumber?.trim(),
        community: client.community ?? '',
        district: client.district ?? '',
        region: client.region ?? '',
        consentStatus: client.consentStatus,
        notes: client.notes ?? '',
      });
    } finally {
      setLoading(false);
    }
  }, [services, clientId, t]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const persist = async () => {
    if (!services || !session || !clientId) {
      return;
    }
    const validation = validateEditClientDraft(draft);
    if (validation.length > 0) {
      setFieldErrors(validation);
      setError(t.clients.edit.formIncomplete);
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors([]);
    try {
      const phoneNumber = draft.phoneNotAvailable ? null : draft.phoneNumber.trim() || null;
      await services.updateClient({
        id: clientId,
        expectedLocalVersion: localVersion,
        accountId: session.accountId,
        givenName: draft.givenName.trim(),
        familyName: draft.familyName.trim(),
        preferredName: draft.preferredName.trim() || null,
        sex: draft.sex.trim() || null,
        dateOfBirth: draft.ageMode === 'dateOfBirth' ? draft.dateOfBirth : null,
        approximateAge:
          draft.ageMode === 'approximateAge' ? Number(draft.approximateAge) : null,
        approximateAgeUnit:
          draft.ageMode === 'approximateAge' ? draft.approximateAgeUnit : null,
        pregnancyStatus: draft.pregnancyStatus.trim() || null,
        estimatedDeliveryDate: draft.estimatedDeliveryDate.trim() || null,
        phoneNumber,
        community: draft.community.trim(),
        district: draft.district.trim() || null,
        region: draft.region.trim(),
        consentStatus: draft.consentStatus!,
        notes: draft.notes.trim() || null,
      });
      router.replace(`/(worker)/clients/${clientId}`);
    } catch (err) {
      if (isRepositoryError(err) && err.category === 'conflict') {
        setStale(true);
      } else {
        setError(t.clients.registration.saveError);
      }
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    const validation = validateEditClientDraft(draft);
    if (validation.length > 0) {
      setFieldErrors(validation);
      setError(t.clients.edit.formIncomplete);
      return;
    }
    const consentChanged =
      originalConsent != null &&
      draft.consentStatus != null &&
      draft.consentStatus !== originalConsent;
    if (consentChanged) {
      Alert.alert(t.clients.edit.consentConfirmTitle, t.clients.edit.consentConfirmBody, [
        { text: t.clients.archive.cancel, style: 'cancel' },
        {
          text: t.clients.edit.save,
          onPress: () => {
            void persist();
          },
        },
      ]);
      return;
    }
    void persist();
  };

  if (loading) {
    return <LoadingState message={t.clients.loading} />;
  }

  if (error === 'missing') {
    return (
      <AppStateView
        variant="empty"
        heading={t.clients.profile.missingHeading}
        explanation={t.clients.profile.missingBody}
        primaryActionLabel={t.clients.registration.returnToList}
        onPrimaryAction={() => router.replace('/(worker)/clients')}
      />
    );
  }

  const selectedSex = isClientSex(draft.sex) ? draft.sex : null;
  const showPregnancyFields =
    clientCategory === 'pregnant' || clientCategory === 'postnatal';

  return (
    <ClientEditShell
      title={t.clients.edit.title}
      subtitle={t.clients.edit.subtitle}
      onBack={() => router.back()}
      onSave={save}
      onCancel={() => router.back()}
      saveLabel={t.clients.edit.save}
      cancelLabel={t.clients.archive.cancel}
      securityTitle={t.clients.registration.securityTitle}
      securityBody={t.clients.registration.securityBody}
      saving={saving}
      testID="client-edit-screen"
    >
      <ClientEditMetaCard
        clientCode={clientCode}
        categoryLabel={categoryLabel}
        facilityLabel={facilityLabel}
      />

      {stale ? (
        <ClientEditStaleBanner
          heading={t.clients.edit.staleHeading}
          body={t.clients.edit.staleBody}
          reloadLabel={t.clients.edit.staleReload}
          onReload={() => void load()}
        />
      ) : null}

      {error && error !== 'missing' ? <FormErrorText>{error}</FormErrorText> : null}

      <View style={styles.section}>
        <RegisterStepHeading
          heading={t.clients.registration.identityHeading}
          instruction={t.clients.registration.identityInstruction}
        />
        <View style={styles.form}>
          <AppTextInput
            label={t.clients.fields.givenName}
            value={draft.givenName}
            onChangeText={(givenName) => patch({ givenName })}
            required
            testID="edit-given-name"
          />
          <RegisterFormError message={resolveError(errorFor('givenName'))} />
          <AppTextInput
            label={t.clients.fields.familyName}
            value={draft.familyName}
            onChangeText={(familyName) => patch({ familyName })}
            required
            testID="edit-family-name"
          />
          <RegisterFormError message={resolveError(errorFor('familyName'))} />
          <AppTextInput
            label={t.clients.fields.preferredName}
            value={draft.preferredName}
            onChangeText={(preferredName) => patch({ preferredName })}
          />
          <RegisterSexSelector
            label={t.clients.fields.sex}
            required
            selectedSex={selectedSex}
            onSelect={(sex: ClientSex) => patch({ sex })}
            errorMessage={resolveError(errorFor('sex'))}
            sexLabel={(sex) => t.clients.fields.sexOptions[sex]}
          />
          {showPregnancyFields ? (
            <>
              <AppTextInput
                label={t.clients.fields.pregnancyStatus}
                value={draft.pregnancyStatus}
                onChangeText={(pregnancyStatus) => patch({ pregnancyStatus })}
              />
              <AppTextInput
                label={t.clients.fields.estimatedDeliveryDate}
                value={draft.estimatedDeliveryDate}
                onChangeText={(estimatedDeliveryDate) => patch({ estimatedDeliveryDate })}
                placeholder="YYYY-MM-DD"
                testID="edit-edd"
              />
              <RegisterFormError message={resolveError(errorFor('estimatedDeliveryDate'))} />
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <RegisterStepHeading
          heading={t.clients.registration.ageHeading}
          instruction={t.clients.registration.ageInstruction}
        />
        <View style={styles.form}>
          {(
            [
              ['dateOfBirth', t.clients.registration.ageExact],
              ['approximateAge', t.clients.registration.ageApproximate],
              ['unknown', t.clients.registration.ageUnknown],
            ] as const
          ).map(([mode, label]) => (
            <RegisterSelectCard
              key={mode}
              label={label}
              selected={draft.ageMode === mode}
              onPress={() => patch({ ageMode: mode })}
              testID={`edit-age-mode-${mode}`}
            />
          ))}
          {draft.ageMode === 'dateOfBirth' ? (
            <AppTextInput
              label={t.clients.fields.dateOfBirth}
              value={draft.dateOfBirth}
              onChangeText={(dateOfBirth) => patch({ dateOfBirth })}
              placeholder="YYYY-MM-DD"
              testID="edit-date-of-birth"
            />
          ) : null}
          {draft.ageMode === 'approximateAge' ? (
            <>
              <AppTextInput
                label={t.clients.fields.ageValue}
                value={draft.approximateAge}
                onChangeText={(approximateAge) => patch({ approximateAge })}
                keyboardType="number-pad"
                testID="edit-approx-age"
              />
              <RegisterUnitChipRow
                label={t.clients.fields.ageUnit}
                required
                units={AGE_UNITS}
                selectedUnit={draft.approximateAgeUnit}
                onSelect={(unit: AgeUnit) => patch({ approximateAgeUnit: unit })}
                unitLabel={(unit) => t.clients.fields.ageUnits[unit]}
                errorMessage={resolveError(errorFor('approximateAgeUnit'))}
              />
            </>
          ) : null}
          <RegisterFormError message={resolveError(errorFor('dateOfBirth'))} />
          <RegisterFormError message={resolveError(errorFor('approximateAge'))} />
        </View>
      </View>

      <View style={styles.section}>
        <RegisterStepHeading
          heading={t.clients.registration.locationHeading}
          instruction={t.clients.registration.locationInstruction}
        />
        <View style={styles.form}>
          <AppTextInput
            label={t.clients.fields.community}
            value={draft.community}
            onChangeText={(community) => patch({ community })}
            required
            testID="edit-community"
          />
          <RegisterFormError message={resolveError(errorFor('community'))} />
          <AppTextInput
            label={t.clients.fields.district}
            value={draft.district}
            onChangeText={(district) => patch({ district })}
          />
          <FormLabel required>{t.clients.fields.region}</FormLabel>
          {NORTHERN_GHANA_REGIONS.map((region) => (
            <RegisterSelectCard
              key={region}
              label={region}
              selected={draft.region === region}
              onPress={() => patch({ region })}
              testID={`edit-region-${region}`}
            />
          ))}
          <RegisterFormError message={resolveError(errorFor('region'))} />
        </View>
      </View>

      <View style={styles.section}>
        <RegisterStepHeading
          heading={t.clients.registration.phoneHeading}
          instruction={t.clients.registration.phoneOptional}
        />
        <View style={styles.form}>
          <CheckboxField
            label={t.clients.registration.phoneNotAvailable}
            checked={draft.phoneNotAvailable}
            onChange={(phoneNotAvailable) =>
              patch({
                phoneNotAvailable,
                phoneNumber: phoneNotAvailable ? '' : draft.phoneNumber,
              })
            }
            testID="edit-phone-unavailable"
          />
          {!draft.phoneNotAvailable ? (
            <AppTextInput
              label={t.clients.registration.phoneOptional}
              value={draft.phoneNumber}
              onChangeText={(phoneNumber) => patch({ phoneNumber })}
              keyboardType="phone-pad"
              autoComplete="off"
              testID="edit-phone"
            />
          ) : null}
          <RegisterFormError message={resolveError(errorFor('phoneNumber'))} />
        </View>
      </View>

      <View style={styles.section}>
        <RegisterStepHeading
          heading={t.clients.registration.consentHeading}
          instruction={t.clients.registration.consentInstruction}
        />
        <View style={styles.form}>
          {CONSENT_STATUSES.map((status) => (
            <RegisterSelectCard
              key={status}
              label={t.clients.consent[status as ConsentStatus]}
              selected={draft.consentStatus === status}
              onPress={() => patch({ consentStatus: status })}
              testID={`edit-consent-${status}`}
            />
          ))}
          <RegisterFormError message={resolveError(errorFor('consentStatus'))} />
        </View>
      </View>

      <View style={styles.section}>
        <RegisterStepHeading
          heading={t.clients.fields.notes}
          instruction={t.clients.registration.reviewInstruction}
        />
        <AppTextInput
          label={t.clients.fields.notes}
          value={draft.notes}
          onChangeText={(notes) => patch({ notes })}
          testID="edit-notes"
        />
      </View>
    </ClientEditShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
});
