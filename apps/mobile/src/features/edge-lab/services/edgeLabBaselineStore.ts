import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EdgeBenchmarkRunSummary } from '../domain/types';

const BASELINE_KEY = 'northcare.edgeLab.designatedBaseline.v1';

/** Pin a successful device run as the official Edge baseline (Phase 3). */
export async function saveDesignatedBaseline(summary: EdgeBenchmarkRunSummary): Promise<void> {
  await AsyncStorage.setItem(BASELINE_KEY, JSON.stringify(summary));
}

export async function loadDesignatedBaseline(): Promise<EdgeBenchmarkRunSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(BASELINE_KEY);
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

export async function clearDesignatedBaseline(): Promise<void> {
  await AsyncStorage.removeItem(BASELINE_KEY);
}
