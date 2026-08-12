import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EdgeBenchmarkRunSummary } from '../domain/types';

const HISTORY_KEY = 'northcare.edgeLab.runHistory.v1';
const MAX_HISTORY = 12;

export async function loadEdgeLabRunHistory(): Promise<readonly EdgeBenchmarkRunSummary[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as EdgeBenchmarkRunSummary[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((row) => row && row.schemaVersion === 1 && typeof row.runId === 'string');
  } catch {
    return [];
  }
}

export async function appendEdgeLabRunHistory(summary: EdgeBenchmarkRunSummary): Promise<void> {
  const existing = await loadEdgeLabRunHistory();
  const next = [summary, ...existing.filter((row) => row.runId !== summary.runId)].slice(
    0,
    MAX_HISTORY,
  );
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}
