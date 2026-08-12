import type { Clock } from '../../domain/value-objects/clock';
import { createSystemClock } from '../../domain/value-objects/clock';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import { getIdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type { RepositoryContainer } from '../contracts/types';
import { createSqliteAuditEventRepository } from './sqliteAuditEventRepository';
import { createSqliteClientRepository } from './sqliteClientRepository';
import { createSqliteEncounterRepository } from './sqliteEncounterRepository';
import { createSqliteReferralPassportRepository } from './sqliteReferralPassportRepository';
import { createSqliteReferralRepository } from './sqliteReferralRepository';
import { createSqliteScreeningRepository } from './sqliteScreeningRepository';
import { createSqliteSyncQueueRepository } from './sqliteSyncQueueRepository';
import {
  createSqliteSyncConflictRepository,
  createSqliteSyncStateRepository,
} from './sqliteSyncProtocolRepositories';
import { createSqliteNutritionAssessmentRepository } from './sqliteNutritionRepositories';
import {
  createSqliteAttachmentRepository,
  createSqliteCaregiverRepository,
  createSqliteFacilityRepository,
  createSqliteLocalAccountReferenceRepository,
  createSqliteMeasurementRepository,
  createSqliteRiskAssessmentRepository,
} from './sqliteSupportingRepositories';
import { createSqliteAssistantFeedbackRepository } from './sqliteAssistantRepositories';
import { createSqliteAssistantConversationRepository } from './sqliteAssistantConversationRepository';
import {
  createSqliteVoiceCaptureSessionRepository,
  createSqliteVoiceExtractionRunRepository,
  createSqliteVoiceExtractionSuggestionRepository,
  createSqliteVoiceTranscriptRepository,
} from './sqliteVoiceRepositories';
import {
  createSqliteFollowUpReminderRepository,
  createSqliteNotificationPreferencesRepository,
} from './sqliteFollowUpReminderRepository';
import { createSqliteAdminProvisioningRepository } from './sqliteAdminProvisioningRepository';

export function createSqliteRepositories(
  db: SqliteDriver,
  options: {
    readonly ids?: IdGenerator;
    readonly clock?: Clock;
  } = {},
): RepositoryContainer {
  const ids = options.ids ?? getIdGenerator();
  const clock = options.clock ?? createSystemClock();

  return {
    facilities: createSqliteFacilityRepository(db, ids, clock),
    localAccounts: createSqliteLocalAccountReferenceRepository(db, clock),
    clients: createSqliteClientRepository(db, ids, clock),
    caregivers: createSqliteCaregiverRepository(db, ids, clock),
    encounters: createSqliteEncounterRepository(db, ids, clock),
    screenings: createSqliteScreeningRepository(db, ids, clock),
    measurements: createSqliteMeasurementRepository(db, ids, clock),
    riskAssessments: createSqliteRiskAssessmentRepository(db, ids, clock),
    referrals: createSqliteReferralRepository(db, ids, clock),
    referralPassports: createSqliteReferralPassportRepository(db, ids, clock),
    nutritionAssessments: createSqliteNutritionAssessmentRepository(db, ids, clock),
    assistantFeedback: createSqliteAssistantFeedbackRepository(db, ids, clock),
    assistantConversations: createSqliteAssistantConversationRepository(db, ids, clock),
    attachments: createSqliteAttachmentRepository(db, ids, clock),
    syncQueue: createSqliteSyncQueueRepository(db, ids, clock),
    syncState: createSqliteSyncStateRepository(db, clock),
    syncConflicts: createSqliteSyncConflictRepository(db, clock),
    auditEvents: createSqliteAuditEventRepository(db, ids, clock),
    voiceCaptureSessions: createSqliteVoiceCaptureSessionRepository(db, ids, clock),
    voiceTranscripts: createSqliteVoiceTranscriptRepository(db, ids, clock),
    voiceExtractionRuns: createSqliteVoiceExtractionRunRepository(db, ids, clock),
    voiceExtractionSuggestions: createSqliteVoiceExtractionSuggestionRepository(
      db,
      ids,
      clock,
    ),
    followUpReminders: createSqliteFollowUpReminderRepository(db, ids, clock),
    notificationPreferences: createSqliteNotificationPreferencesRepository(db, clock),
    adminProvisioning: createSqliteAdminProvisioningRepository(db),
  };
}
