import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppText, LoadingState } from '../../../design-system';
import { asHref } from '../../../navigation/href';
import { colors, radii, spacing, themedMintSurface, typography } from '../../../theme';
import type { ColorPalette, SemanticColors } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { mapVoiceServiceError } from '../application/createVoiceServices';
import {
  VoiceExtractedFieldCard,
  VoiceResultsControlNotice,
  VoiceResultsSectionHeader,
  VoiceResultsStepper,
  VoiceUrgencyCheckCard,
  voiceResultsReviewGapStyle,
  type VoiceResultFieldTone,
} from '../components/VoiceResultsReviewUI';
import {
  VoiceTranscriptClientCard,
  VoiceTranscriptHeaderActions,
} from '../components/VoiceTranscriptReviewUI';
import { VoiceToCareShell } from '../components/VoiceToCareShell';
import type { VoiceExtractionSuggestion } from '../domain/types';
import { useVoiceClientContext } from '../hooks/useVoiceClientContext';
import { useVoiceServices } from '../hooks/useVoiceServices';
import { useVoiceStrings } from '../hooks/useVoiceStrings';

type ResultField = {
  readonly key: string;
  readonly suggestionId: string;
  readonly label: string;
  readonly originalValue: string;
  readonly icon: string;
  readonly tone: VoiceResultFieldTone;
  readonly kind: 'extracted' | 'urgency' | 'skip';
};

const FIELD_CONFIG: Record<
  string,
  { readonly icon: string; readonly tone: VoiceResultFieldTone }
> = {
  reason: { icon: '📋', tone: 'mint' },
  symptomsObserved: { icon: '🩺', tone: 'blue' },
  urgencyLevel: { icon: '🛡', tone: 'green' },
  clientName: { icon: '👤', tone: 'mint' },
  babyName: { icon: '👶', tone: 'mint' },
  ageOrDateOfBirth: { icon: '📅', tone: 'blue' },
  temperature: { icon: '🌡', tone: 'blue' },
  weight: { icon: '⚖', tone: 'blue' },
  feedingStatus: { icon: '🍼', tone: 'mint' },
  actionTaken: { icon: '✅', tone: 'green' },
  visitSummary: { icon: '📝', tone: 'mint' },
};

const DISPLAY_ORDER = [
  'reason',
  'symptomsObserved',
  'urgencyLevel',
  'visitSummary',
  'temperature',
  'weight',
  'feedingStatus',
  'actionTaken',
  'clientName',
  'babyName',
  'ageOrDateOfBirth',
] as const;

function fieldLabel(
  key: string,
  voiceStrings: ReturnType<typeof useVoiceStrings>,
): string {
  switch (key) {
    case 'reason':
      return voiceStrings.resultsReasonForVisit;
    case 'symptomsObserved':
      return voiceStrings.resultsSymptomsMentioned;
    case 'urgencyLevel':
      return voiceStrings.resultsUrgentCareCheck;
    case 'temperature':
      return 'Temperature';
    case 'weight':
      return 'Weight';
    case 'feedingStatus':
      return 'Feeding status';
    case 'actionTaken':
      return 'Action taken';
    case 'visitSummary':
      return 'Visit summary';
    case 'ageOrDateOfBirth':
      return 'Age / date of birth';
    default:
      return key;
  }
}

function unwrapFieldValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === 'string') {
      return parsed.trim();
    }
    if (typeof parsed === 'number' || typeof parsed === 'boolean') {
      return String(parsed);
    }
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as { numericValue?: number; unit?: string; value?: string };
      if (obj.numericValue != null) {
        const unit = obj.unit === 'celsius' ? '°C' : obj.unit ?? '';
        return `${obj.numericValue}${unit ? ` ${unit}` : ''}`.trim();
      }
      if (typeof obj.value === 'string') {
        return obj.value.trim();
      }
    }
  } catch {
    // Plain text value.
  }
  return trimmed.replace(/^"|"$/g, '');
}

function isNoUrgentLevel(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === 'low' ||
    normalized.includes('no urgent') ||
    normalized.includes('none') ||
    normalized.includes('not identified')
  );
}

function buildFieldsFromSuggestions(
  suggestions: readonly VoiceExtractionSuggestion[],
  voiceStrings: ReturnType<typeof useVoiceStrings>,
): ResultField[] {
  const mapped = suggestions.map((suggestion) => {
    const config = FIELD_CONFIG[suggestion.targetKey];
    return {
      key: suggestion.targetKey,
      suggestionId: suggestion.id,
      label: fieldLabel(suggestion.targetKey, voiceStrings),
      originalValue: unwrapFieldValue(suggestion.proposedValueJson),
      icon: config?.icon ?? '📄',
      tone: config?.tone ?? 'mint',
      kind:
        suggestion.targetKey === 'urgencyLevel'
          ? ('urgency' as const)
          : suggestion.targetKey === 'clientName' || suggestion.targetKey === 'babyName'
            ? ('skip' as const)
            : ('extracted' as const),
    };
  });

  const orderIndex = (key: string) => {
    const index = DISPLAY_ORDER.indexOf(key as (typeof DISPLAY_ORDER)[number]);
    return index === -1 ? DISPLAY_ORDER.length + 1 : index;
  };

  return mapped.sort((a, b) => orderIndex(a.key) - orderIndex(b.key));
}

export function VoiceResultsScreen() {
  const voiceStrings = useVoiceStrings();
  const router = useRouter();
  const { account, authState } = useAuthSession();
  const services = useVoiceServices();
  const { colors: palette, semantic, isDark } = useThemeMode();
  const styles = useVoiceResultsScreenStyles(semantic, palette, isDark);
  const params = useLocalSearchParams<{
    clientId: string;
    sessionId?: string;
    runId?: string;
    fieldsJson?: string;
  }>();
  const { clientId, sessionId, runId: runIdParam } = params;
  const { context: clientContext, loading: clientLoading } = useVoiceClientContext(clientId);
  const [fields, setFields] = useState<ResultField[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = authState === 'locked';

  const loadResults = useCallback(async () => {
    if (!services || !sessionId) {
      setFields([]);
      setRunId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bundle = await services.getSessionBundle(sessionId);
      const targetRun = runIdParam
        ? bundle?.extractionRuns.find((entry) => entry.run.id === runIdParam)
        : bundle?.extractionRuns[0];

      if (targetRun?.suggestions.length) {
        setRunId(targetRun.run.id);
        setFields(buildFieldsFromSuggestions(targetRun.suggestions, voiceStrings));
      } else {
        setRunId(null);
        setFields([]);
        setError(voiceStrings.resultsMissingRun);
      }
    } catch {
      setError(voiceStrings.missing);
    } finally {
      setLoading(false);
    }
  }, [runIdParam, services, sessionId, voiceStrings]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const visibleFields = useMemo(
    () => fields.filter((field) => field.kind !== 'skip'),
    [fields],
  );
  const extractedFields = useMemo(
    () => visibleFields.filter((field) => field.kind === 'extracted'),
    [visibleFields],
  );
  const urgencyField = useMemo(
    () => visibleFields.find((field) => field.kind === 'urgency'),
    [visibleFields],
  );

  const clientSubtitle = clientContext
    ? [clientContext.categoryLabel, clientContext.sexLabel].filter(Boolean).join(' • ')
    : '';

  const displayValue = (field: ResultField) =>
    (editedValues[field.key] ?? field.originalValue).trim();

  const isEdited = (field: ResultField) =>
    displayValue(field) !== field.originalValue.trim();

  const startEdit = (field: ResultField) => {
    setEditingFieldKey(field.key);
    setEditedValues((current) => ({
      ...current,
      [field.key]: current[field.key] ?? field.originalValue,
    }));
  };

  const cancelEdit = (field: ResultField) => {
    setEditingFieldKey(null);
    setEditedValues((current) => {
      const next = { ...current };
      if (next[field.key] === field.originalValue) {
        delete next[field.key];
      }
      return next;
    });
  };

  const finishEdit = () => {
    setEditingFieldKey(null);
  };

  const handleSave = async () => {
    if (!services || !account?.accountId || !sessionId || locked || !runId) {
      setError(voiceStrings.resultsMissingRun);
      return;
    }
    if (fields.some((field) => field.suggestionId.startsWith('fallback-'))) {
      setError(voiceStrings.resultsMissingRun);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const bundle = await services.getSessionBundle(sessionId);
      const runSuggestions =
        bundle?.extractionRuns.find((entry) => entry.run.id === runId)?.suggestions ?? [];

      for (const suggestion of runSuggestions) {
        const field = fields.find((item) => item.suggestionId === suggestion.id);
        if (!field || field.kind === 'skip') {
          if (suggestion.reviewStatus === 'pendingReview') {
            await services.reviewSuggestion({
              suggestionId: suggestion.id,
              accountId: account.accountId,
              action: 'reject',
              rejectionReasonCode: 'notDiscussed',
            });
          }
          continue;
        }

        const nextValue = displayValue(field);
        if (isEdited(field)) {
          await services.reviewSuggestion({
            suggestionId: field.suggestionId,
            accountId: account.accountId,
            action: 'edit',
            editedValue: nextValue,
          });
        } else if (suggestion.reviewStatus === 'pendingReview') {
          await services.reviewSuggestion({
            suggestionId: field.suggestionId,
            accountId: account.accountId,
            action: 'accept',
          });
        }
      }

      const refreshedBundle = await services.getSessionBundle(sessionId);
      const reviewedSuggestions =
        refreshedBundle?.extractionRuns
          .find((entry) => entry.run.id === runId)
          ?.suggestions.filter(
            (suggestion) =>
              suggestion.reviewStatus === 'accepted' || suggestion.reviewStatus === 'edited',
          ) ?? [];

      if (reviewedSuggestions.length === 0) {
        setError(voiceStrings.resultsEmptyBody);
        return;
      }

      await services.quickApplyExtraction({
        sessionId,
        accountId: account.accountId,
        suggestions: reviewedSuggestions,
        sessionUnlocked: authState === 'authenticated',
      });

      router.replace(asHref(`/(worker)/clients/${clientId}`));
    } catch (caught) {
      console.error('[VoiceResultsScreen] save failed', caught);
      setError(mapVoiceServiceError(caught) || voiceStrings.resultsSaveError);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordAnother = () => {
    router.replace(asHref(`/(worker)/clients/${clientId}/voice`));
  };

  const handleDiscard = () => {
    Alert.alert(
      voiceStrings.resultsDiscardConfirmTitle,
      voiceStrings.resultsDiscardConfirmBody,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: voiceStrings.resultsDiscard,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (services && account?.accountId && sessionId) {
                try {
                  await services.discardSession({
                    sessionId,
                    accountId: account.accountId,
                  });
                } catch {
                  // Navigation still proceeds.
                }
              }
              router.replace(asHref(`/(worker)/clients/${clientId}`));
            })();
          },
        },
      ],
    );
  };

  const handleUrgentInfo = () => {
    Alert.alert(voiceStrings.resultsUrgentInfoTitle, voiceStrings.resultsUrgentInfoBody);
  };

  const handleViewTranscript = () => {
    if (!sessionId) {
      return;
    }
    router.push(
      asHref(`/(worker)/clients/${clientId}/voice/transcript?sessionId=${sessionId}`),
    );
  };

  const renderEditor = (field: ResultField) =>
    editingFieldKey === field.key ? (
      <View style={styles.inlineEditor}>
        <AppText variant="caption" color="secondary">
          {field.label}
        </AppText>
        <TextInput
          value={editedValues[field.key] ?? field.originalValue}
          onChangeText={(text) =>
            setEditedValues((current) => ({ ...current, [field.key]: text }))
          }
          multiline
          autoFocus
          style={styles.inlineEditorInput}
          placeholderTextColor={semantic.text.disabled}
          testID={`voice-results-editor-${field.key}`}
        />
        <View style={styles.editorActions}>
          <AppButton
            label={voiceStrings.resultsCancelEdit}
            variant="tertiary"
            onPress={() => cancelEdit(field)}
            fullWidth={false}
          />
          <AppButton
            label={voiceStrings.resultsDoneEditing}
            variant="secondary"
            onPress={finishEdit}
            fullWidth={false}
          />
        </View>
      </View>
    ) : null;

  if (clientLoading || loading || !services) {
    return (
      <VoiceToCareShell variant="light" testID="voice-results-loading">
        <LoadingState message={voiceStrings.loading} />
      </VoiceToCareShell>
    );
  }

  const footer = (
    <View style={styles.footer}>
      <AppButton
        label={voiceStrings.resultsSaveConfirmed}
        onPress={() => void handleSave()}
        loading={saving}
        disabled={saving || locked || visibleFields.length === 0 || !runId}
        leadingIcon={
          <View style={styles.confirmIconCircle}>
            <AppText variant="caption" color="inverse" style={styles.confirmCheck}>
              ✓
            </AppText>
          </View>
        }
        trailingIcon={
          <AppText variant="button" color="inverse">
            →
          </AppText>
        }
        testID="voice-results-save"
      />
      <AppButton
        label={voiceStrings.resultsRecordAnother}
        variant="secondary"
        onPress={handleRecordAnother}
        leadingIcon={
          <AppText variant="label" color="action">
            🎙
          </AppText>
        }
        testID="voice-results-record-again"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={voiceStrings.resultsDiscard}
        onPress={handleDiscard}
        style={({ pressed }) => [styles.discardButton, pressed ? styles.pressed : null]}
        testID="voice-results-discard"
      >
        <AppText variant="caption" color="urgent" style={styles.discardIcon}>
          🗑
        </AppText>
        <AppText variant="label" color="urgent">
          {voiceStrings.resultsDiscard}
        </AppText>
      </Pressable>
    </View>
  );

  return (
    <VoiceToCareShell
      variant="light"
      onBack={() => router.back()}
      showOnDeviceChip={false}
      rightAction={<VoiceTranscriptHeaderActions />}
      footer={footer}
      testID="voice-results-screen"
    >
      <View style={voiceResultsReviewGapStyle()}>
        {error ? (
          <AppText variant="body" color="urgent">
            {error}
          </AppText>
        ) : null}

        {clientContext ? (
          <VoiceTranscriptClientCard
            clientName={clientContext.clientName}
            categoryLabel={clientSubtitle}
            onChange={() => router.back()}
          />
        ) : null}

        <VoiceResultsStepper />

        <VoiceResultsSectionHeader
          onViewTranscript={sessionId ? handleViewTranscript : undefined}
        />

        {visibleFields.length > 0 ? (
          <View style={styles.fieldStack}>
            {extractedFields.map((field) => (
              <View key={field.key}>
                <VoiceExtractedFieldCard
                  label={field.label}
                  value={displayValue(field)}
                  icon={field.icon}
                  tone={field.tone}
                  edited={isEdited(field)}
                  onEdit={() => startEdit(field)}
                  testID={`voice-results-field-${field.key}`}
                />
                {renderEditor(field)}
              </View>
            ))}

            {urgencyField ? (
              <View>
                <VoiceUrgencyCheckCard
                  summary={
                    isNoUrgentLevel(displayValue(urgencyField))
                      ? voiceStrings.resultsNoUrgentIndicators
                      : displayValue(urgencyField)
                  }
                  noUrgentFound={isNoUrgentLevel(displayValue(urgencyField))}
                  edited={isEdited(urgencyField)}
                  onEdit={() => startEdit(urgencyField)}
                  onInfo={handleUrgentInfo}
                />
                {renderEditor(urgencyField)}
              </View>
            ) : null}

            <VoiceResultsControlNotice />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppText variant="body" color="secondary">
              {voiceStrings.resultsEmptyBody}
            </AppText>
            {sessionId ? (
              <AppButton
                label={voiceStrings.resultsBackToTranscript}
                variant="secondary"
                onPress={handleViewTranscript}
                testID="voice-results-back-to-transcript"
              />
            ) : null}
          </View>
        )}
      </View>
    </VoiceToCareShell>
  );
}

function createVoiceResultsScreenStyles(
  semantic: SemanticColors,
  palette: ColorPalette,
  isDark: boolean,
) {
  return StyleSheet.create({
    fieldStack: {
      gap: spacing.md,
    },
    footer: {
      gap: spacing.sm,
    },
    confirmIconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmCheck: {
      fontSize: 12,
      lineHeight: 14,
      fontWeight: '700',
    },
    discardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingVertical: spacing.sm,
    },
    discardIcon: {
      fontSize: 14,
    },
    emptyState: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: 16,
      backgroundColor: themedMintSurface(palette, isDark),
    },
    inlineEditor: {
      gap: spacing.sm,
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: semantic.surface.primary,
    },
    inlineEditorInput: {
      minHeight: 88,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: semantic.border.default,
      borderRadius: radii.input,
      color: semantic.text.primary,
      fontFamily: typography.styles.bodyLarge.fontFamily,
      fontSize: typography.styles.bodyLarge.fontSize,
      lineHeight: typography.styles.bodyLarge.lineHeight,
      textAlignVertical: 'top',
    },
    editorActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

function useVoiceResultsScreenStyles(
  semantic: SemanticColors,
  palette: ColorPalette,
  isDark: boolean,
) {
  return useMemo(
    () => createVoiceResultsScreenStyles(semantic, palette, isDark),
    [semantic, palette, isDark],
  );
}
