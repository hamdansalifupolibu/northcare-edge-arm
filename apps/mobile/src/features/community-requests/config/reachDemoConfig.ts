/** NorthCare Reach hackathon demo URLs — sandbox only. */
export const REACH_DEMO_CONFIG = {
  /** Render-hosted API — wake before AT USSD demo (Free tier sleeps). */
  hostedApiBaseUrl: 'https://northcare-api.onrender.com',
  hostedApiHealthPath: '/health/live',
  /** Africa's Talking developer USSD simulator. */
  atUssdSimulatorUrl: 'https://developers.africastalking.com/simulator',
  /** Backup in-app browser simulator (no AT dial). */
  northCareBrowserSimulatorPath: '/reach-simulator',
  /** Must match Render `NORTHCARE_REACH_AT_USSD_SERVICE_CODES`. */
  sandboxServiceCode: '*384*91620#',
  /** Fetch timeout while waking sleeping Render instance. */
  wakeTimeoutMs: 120_000,
} as const;

export function reachDemoHealthUrl(): string {
  const base = REACH_DEMO_CONFIG.hostedApiBaseUrl.replace(/\/$/, '');
  return `${base}${REACH_DEMO_CONFIG.hostedApiHealthPath}`;
}

export function reachDemoBrowserSimulatorUrl(): string {
  const base = REACH_DEMO_CONFIG.hostedApiBaseUrl.replace(/\/$/, '');
  return `${base}${REACH_DEMO_CONFIG.northCareBrowserSimulatorPath}`;
}
