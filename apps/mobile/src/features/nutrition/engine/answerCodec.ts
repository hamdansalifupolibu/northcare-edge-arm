import type {
  NutritionAssessmentAnswer,
  ScreeningAnswer,
} from '../../../data/domain/entities/entities';
import type { SaveNutritionAnswerInput } from '../../../data/repositories/contracts/nutritionTypes';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import { encodeAnswerForPersistence, decodePersistedAnswer } from '../../screening/engine/answerCodec';

/**
 * Adapts Stage 8 answer codec to nutrition assessment answer persistence.
 * Preserves answered / unknown / notAssessed / declined / notApplicable semantics.
 */
export function encodeNutritionAnswerForPersistence(input: {
  readonly nutritionAssessmentId: EntityId;
  readonly answer: RecordedScreeningAnswer;
  readonly accountId?: EntityId | null;
}): SaveNutritionAnswerInput {
  const encoded = encodeAnswerForPersistence({
    screeningId: input.nutritionAssessmentId,
    answer: input.answer,
    accountId: input.accountId,
  });
  return {
    nutritionAssessmentId: input.nutritionAssessmentId,
    questionKey: encoded.questionKey,
    valueType: encoded.valueType,
    booleanValue: encoded.booleanValue,
    numberValue: encoded.numberValue,
    textValue: encoded.textValue,
    dateValue: encoded.dateValue,
    optionValue: encoded.optionValue,
    multipleOptionsJson: encoded.multipleOptionsJson,
    accountId: encoded.accountId,
  };
}

export function decodePersistedNutritionAnswer(
  row: NutritionAssessmentAnswer,
): RecordedScreeningAnswer {
  const asScreeningAnswer: ScreeningAnswer = {
    id: row.id,
    screeningId: row.nutritionAssessmentId,
    questionKey: row.questionKey,
    valueType: row.valueType,
    booleanValue: row.booleanValue,
    numberValue: row.numberValue,
    textValue: row.textValue,
    dateValue: row.dateValue,
    optionValue: row.optionValue,
    multipleOptionsJson: row.multipleOptionsJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdByAccountId: row.createdByAccountId,
    updatedByAccountId: row.updatedByAccountId,
    localVersion: row.localVersion,
    serverVersion: row.serverVersion,
    syncStatus: row.syncStatus,
    lastSyncedAt: row.lastSyncedAt,
    deletedAt: row.deletedAt,
    isDeleted: row.isDeleted,
  };
  return decodePersistedAnswer(asScreeningAnswer);
}
