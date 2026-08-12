import { migration001InitialSchema } from './001_initial_schema';
import { migration002ClientConsentAgeUnit } from './002_client_consent_age_unit';
import { migration003RiskAssessmentEngineFields } from './003_risk_assessment_engine_fields';
import { migration004ReferralPassports } from './004_referral_passports';
import { migration005VoiceCapture } from './005_voice_capture';
import { migration006NutritionAssessmentEngine } from './006_nutrition_assessment_engine';
import { migration007AssistantFeedback } from './007_assistant_feedback';
import { migration008SyncProtocolV1 } from './008_sync_protocol_v1';
import { migration009FollowUpReminders } from './009_follow_up_reminders';
import { migration010NutritionGrowthIndicators } from './010_nutrition_growth_indicators';
import { migration011AdminOfflineProvisioning } from './011_admin_offline_provisioning';
import { migration012AssistantConversations } from './012_assistant_conversations';
import type { Migration } from './types';

const MIGRATIONS: readonly Migration[] = [
  migration001InitialSchema,
  migration002ClientConsentAgeUnit,
  migration003RiskAssessmentEngineFields,
  migration004ReferralPassports,
  migration005VoiceCapture,
  migration006NutritionAssessmentEngine,
  migration007AssistantFeedback,
  migration008SyncProtocolV1,
  migration009FollowUpReminders,
  migration010NutritionGrowthIndicators,
  migration011AdminOfflineProvisioning,
  migration012AssistantConversations,
];

export function getMigrationRegistry(): readonly Migration[] {
  return MIGRATIONS;
}

export function detectDuplicateMigrationVersions(
  migrations: readonly Migration[] = MIGRATIONS,
): number[] {
  const seen = new Map<number, number>();
  for (const migration of migrations) {
    seen.set(migration.version, (seen.get(migration.version) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([version]) => version);
}
