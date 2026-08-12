export type DatabaseReadiness =
  | 'idle'
  | 'opening'
  | 'migrating'
  | 'ready'
  | 'failed';
