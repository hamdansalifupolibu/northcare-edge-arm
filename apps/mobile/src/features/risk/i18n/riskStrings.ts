/**
 * Interface strings for priority evaluation UI.
 * Clinically reviewed explanation content lives in rule packs — not here.
 */
export const riskStrings = {
  loading: 'Reviewing the recorded screening information…',
  resolvingRulePack: 'Checking priority rule availability…',
  evaluating: 'Reviewing the recorded screening information…',
  saving: 'Saving priority result on this device…',
  savedOnDevice: 'Saved on this device',
  waitingForConnection: 'Waiting for connection',
  unavailableTitle: 'Priority assessment unavailable',
  unavailableBody:
    'An approved priority-assessment rule set is not available for this screening.',
  unavailableActions: {
    visitSummary: 'Return to visit summary',
    review: 'Review recorded information',
  },
  evaluationFailedTitle: 'Priority assessment could not be completed',
  evaluationFailedBody: 'Technical evaluation is unavailable. No priority was assigned.',
  incompleteTitle: 'More information required',
  incompleteBody: 'Screening information is incomplete for priority assessment.',
  saveFailed: 'The priority result could not be saved on this device.',
  acknowledgeLabel:
    'I have reviewed this priority result and the information that contributed to it.',
  acknowledgeHint:
    'Acknowledgement records that you reviewed this result. It does not create a referral or confirm a diagnosis.',
  saveResult: 'Save priority result',
  continue: 'Continue',
  returnToVisit: 'Return to visit summary',
  referralDeferred: 'Continue to referral preparation (available in a later stage)',
  continueToReferral: 'Continue to referral preparation',
  factorsTitle: 'Contributing factors',
  factorsEmpty: 'No matched factors for this result.',
  missingTitle: 'Missing information',
  missingEmpty: 'No blocking missing information was recorded.',
  historyTitle: 'Priority history',
  historyEmpty: 'No priority assessments are saved for this visit yet.',
  currentBadge: 'Current',
  supersededBadge: 'Superseded',
  technicalDetails: 'Technical details',
  rulePackVersion: 'Rule pack',
  engineVersion: 'Engine version',
  developmentBanner: 'Development priority rules — not clinical guidance',
  previewTitle: 'Development priority preview — not clinical guidance',
  previewBody:
    'Evaluate synthetic development scenarios. Results are not clinical guidance.',
  recalculate: 'Recalculate after correction',
  viewFactors: 'View contributing factors',
  viewHistory: 'View priority history',
  viewMissing: 'View missing information',
  overrideUnavailable: 'Manual priority change is not available.',
} as const;
