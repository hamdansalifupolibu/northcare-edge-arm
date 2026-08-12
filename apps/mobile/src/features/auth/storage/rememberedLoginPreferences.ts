import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthRole } from '../domain/types';

const storageKey = (role: AuthRole) => `northcare.remembered-login.v1:${role}`;

export type RememberedLoginPreference = {
  readonly loginIdentifier: string;
  readonly rememberAccount: boolean;
};

export async function loadRememberedLogin(
  role: AuthRole,
): Promise<RememberedLoginPreference | null> {
  const raw = await AsyncStorage.getItem(storageKey(role));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as RememberedLoginPreference;
    if (
      typeof parsed.loginIdentifier !== 'string' ||
      typeof parsed.rememberAccount !== 'boolean'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveRememberedLogin(
  role: AuthRole,
  preference: RememberedLoginPreference,
): Promise<void> {
  if (!preference.rememberAccount || preference.loginIdentifier.trim().length === 0) {
    await AsyncStorage.removeItem(storageKey(role));
    return;
  }
  await AsyncStorage.setItem(
    storageKey(role),
    JSON.stringify({
      loginIdentifier: preference.loginIdentifier.trim(),
      rememberAccount: true,
    }),
  );
}
