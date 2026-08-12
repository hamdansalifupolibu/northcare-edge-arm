import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'northcare.sync-preferences.v1';

export type SyncPreferences = {
  readonly autoSyncWhenOnline: boolean;
};

const DEFAULTS: SyncPreferences = {
  autoSyncWhenOnline: true,
};

export async function loadSyncPreferences(): Promise<SyncPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<SyncPreferences>;
    return {
      autoSyncWhenOnline: parsed.autoSyncWhenOnline ?? DEFAULTS.autoSyncWhenOnline,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSyncPreferences(next: SyncPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
