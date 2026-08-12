export type AppMetadata = {
  readonly productName: string;
  readonly tagline: string;
  readonly appVersion: string;
  readonly androidPackage: string;
  readonly androidPackageStatus: 'provisional' | 'approved';
  readonly scheme: string;
  readonly supportStatus: string;
  readonly competitionContext: string;
};
