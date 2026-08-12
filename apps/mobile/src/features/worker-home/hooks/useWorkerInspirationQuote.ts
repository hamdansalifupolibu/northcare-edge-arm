import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { WorkerInspirationQuote } from '../content/workerInspirationQuotes';
import {
  INSPIRATION_ROTATION_MS,
  selectInspirationQuote,
} from '../domain/selectInspirationQuote';

export function useWorkerInspirationQuote() {
  const [quote, setQuote] = useState<WorkerInspirationQuote>(() =>
    selectInspirationQuote({}),
  );
  const lastQuoteIdRef = useRef<string | null>(null);
  const lastRotationSlotRef = useRef<number | null>(null);

  const refresh = useCallback(() => {
    const now = new Date();
    const slot = Math.floor(now.getTime() / INSPIRATION_ROTATION_MS);
    if (lastRotationSlotRef.current === slot && lastQuoteIdRef.current != null) {
      return;
    }
    const next = selectInspirationQuote({
      now,
      lastQuoteId: lastQuoteIdRef.current,
    });
    lastRotationSlotRef.current = slot;
    lastQuoteIdRef.current = next.id;
    setQuote(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return quote;
}
