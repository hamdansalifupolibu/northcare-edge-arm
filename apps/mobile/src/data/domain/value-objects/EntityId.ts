/**
 * Stable offline-first entity identifier (UUID v4 string).
 * Autoincrement rowids are never used as domain IDs.
 */
export type EntityId = string;

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isEntityId(value: unknown): value is EntityId {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

export function assertEntityId(value: unknown, fieldName = 'id'): EntityId {
  if (!isEntityId(value)) {
    throw new Error(`Invalid EntityId for ${fieldName}`);
  }
  return value;
}
