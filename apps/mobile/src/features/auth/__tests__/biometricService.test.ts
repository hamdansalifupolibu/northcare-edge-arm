import * as LocalAuthentication from 'expo-local-authentication';

import {
  createExpoBiometricService,
  createStubBiometricService,
} from '../biometrics/biometricService';

describe('biometric service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports hardware unavailable', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);
    const service = createExpoBiometricService();
    await expect(service.getAvailability()).resolves.toBe('notAvailable');
  });

  it('reports no enrolled biometric', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(false);
    const service = createExpoBiometricService();
    await expect(service.getAvailability()).resolves.toBe('notEnrolled');
  });

  it('maps user cancellation', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });
    const service = createExpoBiometricService();
    await expect(service.authenticate('Unlock')).resolves.toBe('cancel');
  });

  it('maps successful unlock', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
      success: true,
    });
    const service = createExpoBiometricService();
    await expect(service.authenticate('Unlock')).resolves.toBe('success');
  });

  it('maps failed unlock', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'authentication_failed',
    });
    const service = createExpoBiometricService();
    await expect(service.authenticate('Unlock')).resolves.toBe('failed');
  });

  it('stub service supports PIN-fallback unavailable path', async () => {
    const service = createStubBiometricService('notAvailable');
    await expect(service.getAvailability()).resolves.toBe('notAvailable');
    await expect(service.authenticate('Unlock')).resolves.toBe('unavailable');
  });
});
