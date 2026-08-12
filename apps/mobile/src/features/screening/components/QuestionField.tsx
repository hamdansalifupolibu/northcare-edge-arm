import { useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, AppTextInput } from '../../../design-system';
import { spacing } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageProvider';
import type {
  RecordedScreeningAnswer,
  ScreeningQuestionDefinition,
} from '../content/types';

type Props = {
  readonly question: ScreeningQuestionDefinition;
  readonly answer: RecordedScreeningAnswer | undefined;
  readonly onChange: (answer: RecordedScreeningAnswer) => void;
};

/**
 * Presentational question field — no repository access.
 * Does not default clinical Yes/No or invent thresholds.
 */
export function QuestionField({ question, answer, onChange }: Props) {
  const t = useTranslation();
  const strings = t.visits.screening;

  const setState = (
    state: RecordedScreeningAnswer['state'],
    value?: RecordedScreeningAnswer['value'],
  ) => {
    onChange({ questionId: question.id, state, value });
  };

  return (
    <View style={{ gap: spacing.sm }} testID={`question-${question.id}`}>
      <AppText variant="body">{question.label}</AppText>
      {question.helpText ? (
        <AppText variant="caption" color="secondary">
          {question.helpText}
        </AppText>
      ) : null}

      {question.answerType === 'yesNo' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <AppButton
            label={strings.yes}
            variant={answer?.value?.kind === 'boolean' && answer.value.value ? 'primary' : 'secondary'}
            onPress={() => setState('answered', { kind: 'boolean', value: true })}
            fullWidth={false}
          />
          <AppButton
            label={strings.no}
            variant={
              answer?.value?.kind === 'boolean' && answer.value.value === false
                ? 'primary'
                : 'secondary'
            }
            onPress={() => setState('answered', { kind: 'boolean', value: false })}
            fullWidth={false}
          />
        </View>
      ) : null}

      {question.answerType === 'singleChoice' ? (
        <View style={{ gap: spacing.sm }}>
          {(question.options ?? []).map((option) => (
            <AppButton
              key={option.id}
              label={option.label}
              variant={
                answer?.value?.kind === 'option' && answer.value.value === option.id
                  ? 'primary'
                  : 'secondary'
              }
              onPress={() => setState('answered', { kind: 'option', value: option.id })}
            />
          ))}
        </View>
      ) : null}

      {question.answerType === 'multipleChoice' ? (
        <View style={{ gap: spacing.sm }}>
          {(question.options ?? []).map((option) => {
            const selected =
              answer?.value?.kind === 'multipleOptions' &&
              answer.value.values.includes(option.id);
            return (
              <AppButton
                key={option.id}
                label={option.label}
                variant={selected ? 'primary' : 'secondary'}
                onPress={() => {
                  const current =
                    answer?.value?.kind === 'multipleOptions' ? [...answer.value.values] : [];
                  const next = selected
                    ? current.filter((id) => id !== option.id)
                    : [...current, option.id];
                  setState('answered', { kind: 'multipleOptions', values: next });
                }}
              />
            );
          })}
        </View>
      ) : null}

      {question.answerType === 'text' ? (
        <AppTextInput
          label={question.label}
          value={answer?.value?.kind === 'text' ? answer.value.value : ''}
          onChangeText={(text) => setState('answered', { kind: 'text', value: text })}
          accessibilityLabel={question.label}
        />
      ) : null}

      {question.answerType === 'integer' || question.answerType === 'decimal' ? (
        <NumericInput
          question={question}
          answer={answer}
          setState={setState}
        />
      ) : null}

      {question.answerType === 'date' || question.answerType === 'time' ? (
        <AppTextInput
          label={question.label}
          value={
            answer?.value?.kind === 'date' || answer?.value?.kind === 'time'
              ? answer.value.value
              : ''
          }
          placeholder={question.answerType === 'date' ? 'YYYY-MM-DD' : 'HH:mm'}
          onChangeText={(text) =>
            setState('answered', {
              kind: question.answerType === 'date' ? 'date' : 'time',
              value: text,
            })
          }
          accessibilityLabel={question.label}
        />
      ) : null}

      {question.answerType === 'measurement' ? (
        <MeasurementInput
          question={question}
          answer={answer}
          setState={setState}
        />
      ) : null}

      {question.answerType === 'informationAcknowledgement' ? (
        <AppButton
          label={
            answer?.state === 'answered' ? strings.acknowledged : strings.acknowledge
          }
          variant={answer?.state === 'answered' ? 'primary' : 'secondary'}
          onPress={() => setState('answered', { kind: 'acknowledgement', acknowledged: true })}
        />
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {question.allowUnknown ? (
          <AppButton
            label={strings.unknown}
            variant={answer?.state === 'unknown' ? 'primary' : 'tertiary'}
            onPress={() => setState('unknown')}
            fullWidth={false}
          />
        ) : null}
        {question.allowNotAssessed ? (
          <AppButton
            label={strings.notAssessed}
            variant={answer?.state === 'notAssessed' ? 'primary' : 'tertiary'}
            onPress={() => setState('notAssessed')}
            fullWidth={false}
          />
        ) : null}
        {question.allowDeclined ? (
          <AppButton
            label={strings.declined}
            variant={answer?.state === 'declined' ? 'primary' : 'tertiary'}
            onPress={() => setState('declined')}
            fullWidth={false}
          />
        ) : null}
        {question.allowNotApplicable ? (
          <AppButton
            label={strings.notApplicable}
            variant={answer?.state === 'notApplicable' ? 'primary' : 'tertiary'}
            onPress={() => setState('notApplicable')}
            fullWidth={false}
          />
        ) : null}
      </View>
    </View>
  );
}

function MeasurementInput({
  question,
  answer,
  setState,
}: {
  readonly question: ScreeningQuestionDefinition;
  readonly answer: RecordedScreeningAnswer | undefined;
  readonly setState: (state: string, value?: RecordedScreeningAnswer['value']) => void;
}) {
  const initial =
    (answer?.value?.kind === 'measurement' || answer?.value?.kind === 'number') && answer.value.value !== 0
      ? String(answer.value.value)
      : '';
  const [localText, setLocalText] = useState(initial);

  return (
    <AppTextInput
      label={`${question.label} (${question.measurementUnit ?? ''})`}
      value={localText}
      keyboardType="decimal-pad"
      onChangeText={(text) => {
        setLocalText(text);
        const trimmed = text.trim();
        if (trimmed === '') {
          setState('answered', {
            kind: 'measurement',
            value: 0,
            unit: question.measurementUnit ?? 'other',
          });
          return;
        }
        if (trimmed.endsWith('.')) {
          return;
        }
        const parsed = Number(trimmed);
        if (!Number.isNaN(parsed) && question.measurementUnit) {
          setState('answered', {
            kind: 'measurement',
            value: parsed,
            unit: question.measurementUnit,
          });
        }
      }}
      accessibilityLabel={question.label}
    />
  );
}

function NumericInput({
  question,
  answer,
  setState,
}: {
  readonly question: ScreeningQuestionDefinition;
  readonly answer: RecordedScreeningAnswer | undefined;
  readonly setState: (state: string, value?: RecordedScreeningAnswer['value']) => void;
}) {
  const initial = answer?.value?.kind === 'number' && answer.value.value !== 0
    ? String(answer.value.value)
    : '';
  const [localText, setLocalText] = useState(initial);

  return (
    <AppTextInput
      label={question.label}
      value={localText}
      keyboardType={question.answerType === 'decimal' ? 'decimal-pad' : 'number-pad'}
      onChangeText={(text) => {
        setLocalText(text);
        const trimmed = text.trim();
        if (trimmed === '') {
          return;
        }
        if (trimmed.endsWith('.')) {
          return;
        }
        const parsed =
          question.answerType === 'integer' ? Number.parseInt(trimmed, 10) : Number(trimmed);
        if (!Number.isNaN(parsed)) {
          setState('answered', { kind: 'number', value: parsed });
        }
      }}
      accessibilityLabel={question.label}
    />
  );
}
