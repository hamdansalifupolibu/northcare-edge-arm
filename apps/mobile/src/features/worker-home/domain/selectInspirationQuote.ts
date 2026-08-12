import type { InspirationBucket, WorkerInspirationQuote } from '../content/workerInspirationQuotes';
import { WORKER_INSPIRATION_QUOTES } from '../content/workerInspirationQuotes';

export const INSPIRATION_ROTATION_MS = 30 * 60 * 1000;

export function getInspirationBucket(date: Date): InspirationBucket {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function quotePool(bucket: InspirationBucket): readonly WorkerInspirationQuote[] {
  if (bucket === 'night') {
    return WORKER_INSPIRATION_QUOTES.evening;
  }
  return WORKER_INSPIRATION_QUOTES[bucket];
}

function rotationSlot(now: Date, intervalMs: number): number {
  return Math.floor(now.getTime() / intervalMs);
}

/**
 * Picks a quote for the current time bucket.
 * Rotates by 30-minute slots and avoids repeating the previous quote when possible.
 */
export function selectInspirationQuote(input: {
  readonly now?: Date;
  readonly lastQuoteId?: string | null;
  readonly intervalMs?: number;
}): WorkerInspirationQuote {
  const now = input.now ?? new Date();
  const bucket = getInspirationBucket(now);
  const pool = quotePool(bucket);
  if (pool.length === 0) {
    return { id: 'fallback', text: 'Smarter care. Stronger communities.' };
  }

  const slot = rotationSlot(now, input.intervalMs ?? INSPIRATION_ROTATION_MS);
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let index = Math.abs(hashString(`${dayKey}:${bucket}:${slot}`)) % pool.length;

  if (pool[index]?.id === input.lastQuoteId && pool.length > 1) {
    index = (index + 1) % pool.length;
  }

  return pool[index] ?? pool[0];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
