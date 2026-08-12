export type MicrophonePermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'blocked';

export type MicrophonePermissionResult = {
  readonly status: MicrophonePermissionStatus;
  readonly canAskAgain: boolean;
};

export type MicrophonePermissionGateway = {
  getStatus(): Promise<MicrophonePermissionResult>;
  request(): Promise<MicrophonePermissionResult>;
};

type ExpoAudioModuleLike = {
  getRecordingPermissionsAsync?: () => Promise<{
    granted: boolean;
    canAskAgain?: boolean;
    status?: string;
  }>;
  requestRecordingPermissionsAsync: () => Promise<{
    granted: boolean;
    canAskAgain?: boolean;
    status?: string;
  }>;
};

function mapPermission(raw: {
  granted: boolean;
  canAskAgain?: boolean;
  status?: string;
}): MicrophonePermissionResult {
  if (raw.granted) {
    return { status: 'granted', canAskAgain: true };
  }
  const canAskAgain = raw.canAskAgain !== false;
  if (!canAskAgain || raw.status === 'denied') {
    return {
      status: canAskAgain ? 'denied' : 'blocked',
      canAskAgain,
    };
  }
  return { status: 'denied', canAskAgain };
}

export function createExpoMicrophonePermissionGateway(
  audioModule: ExpoAudioModuleLike,
): MicrophonePermissionGateway {
  return {
    async getStatus() {
      if (audioModule.getRecordingPermissionsAsync) {
        return mapPermission(await audioModule.getRecordingPermissionsAsync());
      }
      return { status: 'undetermined', canAskAgain: true };
    },
    async request() {
      return mapPermission(await audioModule.requestRecordingPermissionsAsync());
    },
  };
}
