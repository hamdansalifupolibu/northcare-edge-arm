import Constants from 'expo-constants';

import {
  createLocalNotificationScheduler,
  isExpoGoNotificationRuntime,
  UnavailableLocalNotificationScheduler,
} from '../scheduling/LocalNotificationScheduler';

describe('Expo Go notification gate', () => {
  const originalOwnership = Constants.appOwnership;

  afterEach(() => {
    Object.defineProperty(Constants, 'appOwnership', {
      configurable: true,
      value: originalOwnership,
    });
  });

  it('detects Expo Go ownership', () => {
    Object.defineProperty(Constants, 'appOwnership', {
      configurable: true,
      value: 'expo',
    });
    expect(isExpoGoNotificationRuntime()).toBe(true);
    const scheduler = createLocalNotificationScheduler();
    expect(scheduler).toBeInstanceOf(UnavailableLocalNotificationScheduler);
  });

  it('loads a scheduler outside Expo Go without throwing', async () => {
    Object.defineProperty(Constants, 'appOwnership', {
      configurable: true,
      value: null,
    });
    expect(isExpoGoNotificationRuntime()).toBe(false);
    const scheduler = createLocalNotificationScheduler();
    await expect(scheduler.getPermissionStatus()).resolves.toMatch(/granted|denied|unavailable/);
  });
});
