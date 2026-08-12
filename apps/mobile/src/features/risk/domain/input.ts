import type {
  EncounterType,
  MeasurementType,
  MeasurementUnit,
  RiskPriority,
  ScreeningType,
} from '../../../data/domain/enums/domainEnums';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { ScreeningAnswerState } from '../../screening/content/types';

export type InputProvenanceKind =
  | 'screeningAnswer'
  | 'measurement'
  | 'clientCategory'
  | 'dateOnlyField'
  | 'visitContext'
  | 'workerConfirmation'
  | 'derivedAge'
  | 'rulePackConfiguration';

export type InputProvenance = {
  readonly kind: InputProvenanceKind;
  readonly sourceId?: string;
  readonly derivationType?: string;
  readonly sourceFields?: readonly string[];
  readonly derivationVersion?: number;
};

export type EngineAnswerValue =
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'date'; readonly value: string }
  | { readonly kind: 'option'; readonly value: string }
  | { readonly kind: 'multipleOptions'; readonly values: readonly string[] }
  | {
      readonly kind: 'measurement';
      readonly value: number;
      readonly unit: MeasurementUnit;
      readonly originalValue: number;
      readonly originalUnit: MeasurementUnit;
      readonly conversionVersion?: number;
    }
  | { readonly kind: 'acknowledgement'; readonly acknowledged: true };

export type EngineAnswer = {
  readonly questionKey: string;
  readonly state: ScreeningAnswerState | 'unanswered';
  readonly value?: EngineAnswerValue;
  readonly provenance: InputProvenance;
};

export type EngineMeasurement = {
  readonly measurementId: EntityId;
  readonly questionKey: string | null;
  readonly measurementType: MeasurementType;
  readonly numericValue: number;
  readonly unit: MeasurementUnit;
  readonly provenance: InputProvenance;
};

export type DerivedAge = {
  readonly years: number;
  readonly precision: 'exact' | 'approximate';
  readonly provenance: InputProvenance;
};

/**
 * Immutable engine input — no secrets, names, phones, or free-text notes.
 */
export type RiskEngineInput = {
  readonly evaluationId: string;
  readonly clientId: EntityId;
  readonly clientCategory: string;
  readonly dateOfBirth: string | null;
  readonly approximateAgeYears: number | null;
  readonly derivedAge: DerivedAge | null;
  readonly encounterId: EntityId;
  readonly visitType: EncounterType;
  readonly screeningId: EntityId;
  readonly screeningType: ScreeningType;
  readonly screeningTemplateId: string;
  readonly screeningTemplateVersion: number;
  readonly answers: readonly EngineAnswer[];
  readonly measurements: readonly EngineMeasurement[];
  readonly completionState: 'completed' | 'incomplete';
  readonly workerConfirmation: boolean;
  readonly existingRiskAssessmentId: EntityId | null;
  readonly applicableRulePackId: string | null;
  readonly applicableRulePackVersion: number | null;
};

export type MissingInformationRecord = {
  readonly questionKey: string;
  readonly sectionId: string | null;
  readonly reason:
    | 'unknown'
    | 'notAssessed'
    | 'declined'
    | 'unanswered'
    | 'missingMeasurement'
    | 'unsupportedUnit'
    | 'invalidValue'
    | 'insufficientAgePrecision'
    | 'screeningIncomplete'
    | 'workerConfirmationMissing'
    | 'rulePackUnavailable'
    | 'evaluationError';
  readonly requiredByRuleIds: readonly string[];
  readonly workerFacingLabel: string;
  readonly blocking: boolean;
  readonly sourceReference: string | null;
};

export type MatchedFactor = {
  readonly ruleId: string;
  readonly factorCode: string;
  readonly factorLabel: string;
  readonly priority: Exclude<RiskPriority, 'undetermined'>;
  readonly sourceQuestionKey: string | null;
  readonly sourceMeasurementId: EntityId | null;
  readonly explanationId: string;
  readonly explanationSummary: string;
  readonly explanationDetail: string;
  readonly workerActionText: string;
  readonly ruleVersion: string;
  readonly order: number;
};
