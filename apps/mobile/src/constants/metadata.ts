import type { AppMetadata } from '../types/metadata';

/**
 * Canonical application identity strings.
 * Do not duplicate these across components.
 */
export const APP_METADATA: AppMetadata = {
  productName: 'NorthCare AI',
  tagline: 'Smarter care. Stronger communities.',
  appVersion: '0.1.0',
  androidPackage: 'com.northcareai.app',
  androidPackageStatus: 'provisional',
  scheme: 'northcare',
  supportStatus: 'Development foundation — not a production release',
  competitionContext:
    'Built for the UNICEF StartUp Lab AI for Nurturing Care Hackathon context',
};
