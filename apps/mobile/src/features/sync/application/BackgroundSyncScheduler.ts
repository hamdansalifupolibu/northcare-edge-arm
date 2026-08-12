/**
 * Stage 14 deliberately has no Android background-sync registration.
 * Foreground triggers are handled by SyncProvider; attachment upload remains
 * outside this protocol boundary.
 */
export const BackgroundSyncScheduler = {
  enabled: false as const,
  async register(): Promise<void> {
    // Intentionally inert until a reviewed future stage enables background work.
  },
  async unregister(): Promise<void> {
    // Intentionally inert.
  },
};
