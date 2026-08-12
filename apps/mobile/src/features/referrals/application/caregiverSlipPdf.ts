import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  buildCaregiverSlipHtml,
  type BuildCaregiverSlipInput,
} from '../security/buildCaregiverSlip';
import { buildPassportQrSvgMarkup } from '../security/buildPassportQrSvg';

type ExpoPrintModule = {
  printToFileAsync: (options: { html: string }) => Promise<{ uri: string }>;
  printAsync: (options: { html: string }) => Promise<void>;
};

type ExpoSharingModule = {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (
    url: string,
    options?: {
      mimeType?: string;
      UTI?: string;
      dialogTitle?: string;
    },
  ) => Promise<void>;
};

type OptionalNativeProbe = (moduleName: string) => unknown | null;

let cachedPdfAvailable: boolean | null = null;

/**
 * Probe ExpoPrint without loading `expo-print` JS.
 * Loading the JS package calls `requireNativeModule('ExpoPrint')`, which throws
 * when the native module is absent (older binary / Expo Go edge cases).
 */
export function isCaregiverSlipPdfAvailable(
  probe: OptionalNativeProbe = requireOptionalNativeModule,
): boolean {
  if (cachedPdfAvailable !== null) return cachedPdfAvailable;
  try {
    const native = probe('ExpoPrint');
    cachedPdfAvailable = native != null;
  } catch {
    cachedPdfAvailable = false;
  }
  return cachedPdfAvailable;
}

/** Test-only: clear memoised availability after mocking the probe. */
export function resetCaregiverSlipPdfAvailabilityCacheForTests(): void {
  cachedPdfAvailable = null;
}

function isSharingNativeAvailable(
  probe: OptionalNativeProbe = requireOptionalNativeModule,
): boolean {
  try {
    return probe('ExpoSharing') != null;
  } catch {
    return false;
  }
}

function loadPrintModule(): ExpoPrintModule {
  if (!isCaregiverSlipPdfAvailable()) {
    throw new Error('pdf_unavailable');
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- gated by optional native probe
    return require('expo-print') as ExpoPrintModule;
  } catch {
    cachedPdfAvailable = false;
    throw new Error('pdf_unavailable');
  }
}

function loadSharingModule(): ExpoSharingModule {
  if (!isSharingNativeAvailable()) {
    throw new Error('sharing_unavailable');
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- gated by optional native probe
    return require('expo-sharing') as ExpoSharingModule;
  } catch {
    throw new Error('sharing_unavailable');
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const asset = Asset.fromModule(
      require('../../../../assets/brand/northcare-logo-symbol-primary.png'),
    );
    await asset.downloadAsync();
    const localUri = asset.localUri ?? asset.uri;
    if (!localUri) return null;
    const file = new File(localUri);
    if (!file.exists) return null;
    const base64 = await file.base64();
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function createCaregiverSlipPdfUri(
  input: BuildCaregiverSlipInput,
): Promise<string> {
  if (!isCaregiverSlipPdfAvailable()) {
    throw new Error('pdf_unavailable');
  }
  const Print = loadPrintModule();
  const [qrSvgMarkup, logoDataUrl] = await Promise.all([
    buildPassportQrSvgMarkup(input.uri),
    loadLogoDataUrl(),
  ]);
  const html = buildCaregiverSlipHtml({
    ...input,
    qrSvgMarkup,
    logoDataUrl,
  });
  const result = await Print.printToFileAsync({ html });
  return result.uri;
}

/** Strategy A: native PDF file → share sheet (when ExpoPrint + ExpoSharing present). */
export async function exportCaregiverSlipPdf(
  input: BuildCaregiverSlipInput,
): Promise<void> {
  const pdfUri = await createCaregiverSlipPdfUri(input);
  const Sharing = loadSharingModule();
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('sharing_unavailable');
  }
  await Sharing.shareAsync(pdfUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'NorthCare referral slip',
  });
}

/** Strategy A: native print dialog (when ExpoPrint present). */
export async function printCaregiverSlip(
  input: BuildCaregiverSlipInput,
): Promise<void> {
  if (!isCaregiverSlipPdfAvailable()) {
    throw new Error('pdf_unavailable');
  }
  const Print = loadPrintModule();
  const [qrSvgMarkup, logoDataUrl] = await Promise.all([
    buildPassportQrSvgMarkup(input.uri),
    loadLogoDataUrl(),
  ]);
  const html = buildCaregiverSlipHtml({
    ...input,
    qrSvgMarkup,
    logoDataUrl,
  });
  await Print.printAsync({ html });
}
