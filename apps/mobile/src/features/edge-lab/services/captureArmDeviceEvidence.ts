import { Platform } from 'react-native';

import type { EdgeArmDeviceEvidence } from '../domain/types';

/**
 * Capture what the JS runtime can see today without new native modules.
 * SoC / ABI / core counts stay null until a richer on-device collector exists —
 * do not invent them.
 */
export async function captureArmDeviceEvidence(): Promise<EdgeArmDeviceEvidence> {
  const androidVersion =
    Platform.OS === 'android' && Platform.Version != null ? String(Platform.Version) : null;

  // react-native Platform.constants may expose Brand/Model on Android.
  const constants = Platform.constants as
    | { Model?: string; Brand?: string; Manufacturer?: string }
    | undefined;
  const model =
    typeof constants?.Model === 'string' && constants.Model.length > 0 ? constants.Model : null;
  const brand =
    typeof constants?.Brand === 'string' && constants.Brand.length > 0
      ? constants.Brand
      : typeof constants?.Manufacturer === 'string'
        ? constants.Manufacturer
        : null;

  return {
    marketingName: brand && model ? `${brand} ${model}` : model,
    model,
    androidVersion,
    abi: null,
    soc: null,
    cpuCoreCount: null,
    backend: 'cpu',
    nativeLibraryAbi: null,
    platformOs: Platform.OS,
  };
}
