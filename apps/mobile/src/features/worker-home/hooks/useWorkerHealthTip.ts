import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { WORKER_HEALTH_TIPS, type WorkerHealthTip } from '../content/workerHealthTips';

const ROTATION_MS = 6 * 60 * 60 * 1000;

function selectHealthTip(lastId: string | null): WorkerHealthTip {
  if (WORKER_HEALTH_TIPS.length === 0) {
    return { id: 'fallback', text: 'Take care of yourself so you can care for others.' };
  }
  const candidates = lastId
    ? WORKER_HEALTH_TIPS.filter((tip) => tip.id !== lastId)
    : WORKER_HEALTH_TIPS;
  const pool = candidates.length > 0 ? candidates : WORKER_HEALTH_TIPS;
  const slot = Math.floor(Date.now() / ROTATION_MS);
  return pool[slot % pool.length] ?? pool[0]!;
}

export function useWorkerHealthTip(): WorkerHealthTip {
  const [tip, setTip] = useState<WorkerHealthTip>(() => selectHealthTip(null));
  const lastIdRef = useRef<string | null>(null);
  const lastSlotRef = useRef<number | null>(null);

  const refresh = useCallback(() => {
    const slot = Math.floor(Date.now() / ROTATION_MS);
    if (lastSlotRef.current === slot && lastIdRef.current != null) {
      return;
    }
    const next = selectHealthTip(lastIdRef.current);
    lastSlotRef.current = slot;
    lastIdRef.current = next.id;
    setTip(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return tip;
}
