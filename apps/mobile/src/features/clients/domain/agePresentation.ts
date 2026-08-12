import type { AgeUnit } from '../../../data/domain/enums/ageUnit';
import type { DateOnly } from '../../../data/domain/value-objects/dateOnly';

export type AgePresentation =
  | { readonly kind: 'dateOfBirth'; readonly dateOfBirth: DateOnly }
  | {
      readonly kind: 'approximateAge';
      readonly value: number;
      readonly unit: AgeUnit;
    }
  | { readonly kind: 'unknown' };

export function resolveAgePresentation(input: {
  readonly dateOfBirth: DateOnly | null;
  readonly approximateAge: number | null;
  readonly approximateAgeUnit: AgeUnit | null;
}): AgePresentation {
  if (input.dateOfBirth) {
    return { kind: 'dateOfBirth', dateOfBirth: input.dateOfBirth };
  }
  if (input.approximateAge != null && input.approximateAgeUnit) {
    return {
      kind: 'approximateAge',
      value: input.approximateAge,
      unit: input.approximateAgeUnit,
    };
  }
  return { kind: 'unknown' };
}

export function formatAgePresentation(
  presentation: AgePresentation,
  labels: {
    readonly unknown: string;
    readonly approximate: (value: number, unit: AgeUnit) => string;
    readonly bornOn: (date: DateOnly) => string;
  },
): string {
  switch (presentation.kind) {
    case 'dateOfBirth':
      return labels.bornOn(presentation.dateOfBirth);
    case 'approximateAge':
      return labels.approximate(presentation.value, presentation.unit);
    case 'unknown':
      return labels.unknown;
    default: {
      const _exhaustive: never = presentation;
      return String(_exhaustive);
    }
  }
}
