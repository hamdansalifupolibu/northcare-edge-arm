import type { IsoUtcTimestamp } from './timestamps';
import { toIsoUtcString } from './timestamps';

export type Clock = {
  readonly now: () => Date;
  readonly nowIso: () => IsoUtcTimestamp;
};

export function createSystemClock(): Clock {
  return {
    now: () => new Date(),
    nowIso: () => toIsoUtcString(new Date()),
  };
}

export function createFixedClock(fixed: Date): Clock {
  return {
    now: () => new Date(fixed.getTime()),
    nowIso: () => toIsoUtcString(fixed),
  };
}

export function createOffsetClock(base: Clock, offsetMs: number): Clock {
  return {
    now: () => new Date(base.now().getTime() + offsetMs),
    nowIso: () => toIsoUtcString(new Date(base.now().getTime() + offsetMs)),
  };
}
