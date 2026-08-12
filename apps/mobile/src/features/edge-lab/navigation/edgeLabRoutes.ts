export const EDGE_LAB_ROUTES = {
  overview: '/(development)/edge-lab',
  compare: '/(development)/edge-lab/compare',
  experiments: '/(development)/edge-lab/experiments',
  timeline: '/(development)/edge-lab/timeline',
  export: '/(development)/edge-lab/export',
} as const;

export type EdgeLabRouteKey = keyof typeof EDGE_LAB_ROUTES;
