/** Normalize expo-router search params that may arrive as string or string[]. */
export function resolveRouteParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
