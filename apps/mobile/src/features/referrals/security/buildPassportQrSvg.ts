import QRCode from 'qrcode';

/**
 * Build inline SVG markup for the signed passport URI (print/PDF HTML).
 * Does not log the URI. Generates locally — no network.
 */
export async function buildPassportQrSvgMarkup(uri: string): Promise<string> {
  const svg = await QRCode.toString(uri, {
    type: 'svg',
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#17211F',
      light: '#FFFFFF',
    },
  });
  return svg;
}
