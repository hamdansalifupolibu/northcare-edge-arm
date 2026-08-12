import * as LocalAuthentication from 'expo-local-authentication';

import type { BiometricAvailability } from '../domain/types';

export type BiometricService = {
  getAvailability(): Promise<BiometricAvailability>;
  authenticate(promptMessage: string): Promise<'success' | 'cancel' | 'failed' | 'unavailable'>;
};

export function createExpoBiometricService(): BiometricService {
  return {
    async getAvailability() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return 'notAvailable';
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return 'notEnrolled';
      }
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasStrong =
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ||
        types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      if (!hasStrong) {
        return 'weakOnly';
      }
      return 'available';
    },
    async authenticate(promptMessage) {
      const availability = await this.getAvailability();
      if (availability === 'notAvailable' || availability === 'notEnrolled') {
        return 'unavailable';
      }
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          cancelLabel: 'Cancel',
          disableDeviceFallback: true,
        });
        if (result.success) {
          return 'success';
        }
        if (result.error === 'user_cancel' || result.error === 'system_cancel') {
          return 'cancel';
        }
        return 'failed';
      } catch {
        return 'failed';
      }
    },
  };
}

export function createStubBiometricService(
  availability: BiometricAvailability = 'notAvailable',
): BiometricService {
  return {
    async getAvailability() {
      return availability;
    },
    async authenticate() {
      return availability === 'available' || availability === 'enabled'
        ? 'success'
        : 'unavailable';
    },
  };
}
