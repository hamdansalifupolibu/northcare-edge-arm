import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';

import { createApp } from './app';

initializeApp();

const expressApp = createApp();

/** HTTPS sync API — set EXPO_PUBLIC_API_BASE_URL to this function URL (no trailing slash). */
export const api = onRequest(
  {
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
  },
  expressApp,
);
