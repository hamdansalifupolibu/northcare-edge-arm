export const CLIENT_SEX_VALUES = ['female', 'male'] as const;

export type ClientSex = (typeof CLIENT_SEX_VALUES)[number];

export function isClientSex(value: unknown): value is ClientSex {
  return typeof value === 'string' && (CLIENT_SEX_VALUES as readonly string[]).includes(value);
}
