import type { Href } from 'expo-router';

/** Cast dynamic Expo Router paths without weakening call-site route literals. */
export function asHref(path: string): Href {
  return path as Href;
}
