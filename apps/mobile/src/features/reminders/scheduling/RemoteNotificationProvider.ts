/** Stage 15 boundary: synchronised reminders do not cause remote delivery. */
export type RemoteNotificationProvider = {
  readonly id: 'unavailable';
  sendReminder(): Promise<{ readonly ok: false; readonly reason: 'unavailable' }>;
};

export const unavailableRemoteNotificationProvider: RemoteNotificationProvider = {
  id: 'unavailable',
  async sendReminder() {
    return { ok: false, reason: 'unavailable' };
  },
};
