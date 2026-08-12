import type { MeasurementUnit } from '../../../data/domain/enums/domainEnums';

export const UNIT_CONVERSION_VERSION = 1 as const;

export type ConversionResult = {
  readonly originalValue: number;
  readonly originalUnit: MeasurementUnit;
  readonly convertedValue: number;
  readonly targetUnit: MeasurementUnit;
  readonly conversionVersion: typeof UNIT_CONVERSION_VERSION;
  readonly formulaId: string;
};

type ConversionDef = {
  readonly from: MeasurementUnit;
  readonly to: MeasurementUnit;
  readonly formulaId: string;
  readonly convert: (value: number) => number;
};

const CONVERSIONS: readonly ConversionDef[] = [
  {
    from: 'g',
    to: 'kg',
    formulaId: 'g_to_kg_div_1000_v1',
    convert: (value) => value / 1000,
  },
  {
    from: 'kg',
    to: 'g',
    formulaId: 'kg_to_g_mul_1000_v1',
    convert: (value) => value * 1000,
  },
  {
    from: 'mm',
    to: 'cm',
    formulaId: 'mm_to_cm_div_10_v1',
    convert: (value) => value / 10,
  },
  {
    from: 'cm',
    to: 'mm',
    formulaId: 'cm_to_mm_mul_10_v1',
    convert: (value) => value * 10,
  },
];

/**
 * Convert only when units match or an approved deterministic conversion exists.
 * Does not round before returning — callers must not round before boundary compares.
 */
export function convertMeasurementUnit(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): ConversionResult | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  if (from === to) {
    return {
      originalValue: value,
      originalUnit: from,
      convertedValue: value,
      targetUnit: to,
      conversionVersion: UNIT_CONVERSION_VERSION,
      formulaId: 'identity_v1',
    };
  }
  const def = CONVERSIONS.find((item) => item.from === from && item.to === to);
  if (!def) {
    return null;
  }
  return {
    originalValue: value,
    originalUnit: from,
    convertedValue: def.convert(value),
    targetUnit: to,
    conversionVersion: UNIT_CONVERSION_VERSION,
    formulaId: def.formulaId,
  };
}
