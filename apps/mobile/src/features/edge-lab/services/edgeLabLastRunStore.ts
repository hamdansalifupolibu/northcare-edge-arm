import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EdgeBenchmarkRunSummary } from '../domain/types';

const LAST_RUN_KEY = 'northcare.edgeLab.lastRun.v1';

export async function saveEdgeLabLastRun(summary: EdgeBenchmarkRunSummary): Promise<void> {
  await AsyncStorage.setItem(LAST_RUN_KEY, JSON.stringify(summary));
}

export async function loadEdgeLabLastRun(): Promise<EdgeBenchmarkRunSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_RUN_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as EdgeBenchmarkRunSummary;
    if (parsed && parsed.schemaVersion === 1 && typeof parsed.runId === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
