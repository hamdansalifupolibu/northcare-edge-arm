import { APP_METADATA } from '../constants/metadata';

describe('APP_METADATA', () => {
  it('uses approved NorthCare AI identity values', () => {
    expect(APP_METADATA.productName).toBe('NorthCare AI');
    expect(APP_METADATA.tagline).toBe('Smarter care. Stronger communities.');
    expect(APP_METADATA.appVersion).toBe('0.1.0');
    expect(APP_METADATA.androidPackage).toBe('com.northcareai.app');
    expect(APP_METADATA.androidPackageStatus).toBe('provisional');
    expect(APP_METADATA.scheme).toBe('northcare');
  });
});
