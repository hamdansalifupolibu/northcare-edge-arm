import { getAppConfig } from '../../../../../config/appConfig';
import type { AppEnvironment } from '../../../../../types/env';
import { VoiceError } from '../../../domain/errors';
import { SYNTHETIC_DEV_EXTRACTION_SCHEMA } from './development/syntheticDevExtractionSchema';
import type { ExtractionSchemaContentStatus, ExtractionSchemaDefinition } from './types';

const ALL_SCHEMAS: readonly ExtractionSchemaDefinition[] = [
  SYNTHETIC_DEV_EXTRACTION_SCHEMA,
  // approved/ remains empty until clinically reviewed APPROVED_FOR_PILOT schemas exist.
];

function allowedStatusesForEnvironment(
  environment: AppEnvironment,
): readonly ExtractionSchemaContentStatus[] {
  if (environment === 'production') {
    return ['APPROVED_FOR_PILOT'];
  }
  return ['APPROVED_FOR_DEVELOPMENT', 'APPROVED_FOR_PILOT'];
}

export function listLoadableExtractionSchemas(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly ExtractionSchemaDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  return ALL_SCHEMAS.filter(
    (schema) =>
      allowed.has(schema.status) &&
      schema.status !== 'RETIRED' &&
      schema.status !== 'DRAFT' &&
      schema.status !== 'REVIEW_REQUIRED',
  );
}

export function getExtractionSchema(
  schemaId: string,
  environment: AppEnvironment = getAppConfig().appEnv,
): ExtractionSchemaDefinition | null {
  return listLoadableExtractionSchemas(environment).find((s) => s.schemaId === schemaId) ?? null;
}

export function requireDefaultExtractionSchema(
  environment: AppEnvironment = getAppConfig().appEnv,
): ExtractionSchemaDefinition {
  const schemas = listLoadableExtractionSchemas(environment);
  if (schemas.length === 0) {
    throw new VoiceError(
      'schemaUnavailable',
      'No approved voice extraction schema is available in this environment.',
    );
  }
  return schemas[0]!;
}

export function listAllRegisteredExtractionSchemasForInventory(): readonly ExtractionSchemaDefinition[] {
  return ALL_SCHEMAS;
}

export function countApprovedForPilotExtractionSchemas(): number {
  return ALL_SCHEMAS.filter((s) => s.status === 'APPROVED_FOR_PILOT').length;
}
