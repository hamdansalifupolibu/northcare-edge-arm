/**
 * UI strings for referrals — not clinical content.
 * Clinical/synthetic reason labels come from the reason registry.
 */
export const referralStrings = {
  listTitle: 'Referrals',
  listSubtitle:
    'Create, track, and verify referrals—securely and offline. All data stays on this device.',
  onDeviceOnlineLabel: 'On this device • Online',
  onDeviceOfflineLabel: 'On this device • Offline',
  prepareReferralDescription: 'Create a referral from a client record.',
  verifyPassportCardDescription: 'Verify a referral passport offline',
  listEmptyTitle: 'No referrals yet',
  listEmptyBodyPrefix:
    "You haven't saved any referrals on this device. Open Clients, select a person, and choose ",
  listEmptyBodyAction: 'Prepare referral',
  listEmptyBodySuffix: ' to get started.',
  verifyOfflineSectionTitle: 'Verify offline using device data',
  verifyOfflineSectionBody:
    'Scan or enter a passport code only looks up referrals already saved on this device. It does not download hospital records, and a scan alone does not mark the referral received.',
  scanPassportDescription: 'Use your camera to scan the passport code.',
  enterCodeDescription: 'Type the code to verify the referral.',
  listEmpty: 'No referrals saved on this device yet.',
  listEmptyHint:
    'Open Clients, select a person, then choose Prepare referral.',
  listPending: 'Open referrals',
  listClosed: 'Completed and cancelled',
  listOpenEmpty: 'No open referrals right now.',
  createFromClients: 'Open Clients to prepare a referral',
  nextStepLabel: 'Next step',
  showPassportPrimary: 'Show referral passport (QR)',
  caregiverPassportHint:
    'Ask the caregiver to keep this QR ready and show it at the receiving facility.',
  passportLookupNote:
    'Scan or enter a passport code only looks up referrals already saved on this device. It does not download hospital records, and a scan alone does not mark the referral received.',
  verifyPassport: 'Verify passport',
  verifyPassportTitle: 'Verify referral passport',
  onDeviceChipLabel: 'On-device',
  verifyOfflineCardTitle: 'Offline verification',
  verifyOfflineCardBody:
    'Scan or paste a NorthCare referral passport. This phone checks it offline — no facility sync or origin device required.',
  verifyOfflineNotice: 'Facility inbox sync is not active yet.',
  verifyScanSubtext: 'Use camera to scan a NorthCare passport',
  verifyOrLabel: 'OR',
  verifyPastePlaceholder: 'Paste referral passport code here',
  verifyPasteExample: 'Example: northcare://referral-passport/v3/…',
  verifyStoredSearchTitle: 'Scan referral passport',
  verifyStoredSearchDescription: 'Search offline referrals stored on this device',
  verifyHowItWorksTitle: 'How verification works',
  verifyHowItWorksBody:
    'This device checks the referral’s authenticity and information using referrals already saved offline.',
  verifyPrivacyFooter: 'All verification happens on this device. Your data stays private.',
  verifyPassportHint:
    'Scan or paste a NorthCare passport QR. This phone checks it offline — no facility sync or origin device required.',
  verifyOfflineCaption:
    'Offline verification. Facility inbox sync is not active yet.',
  verifyValidTitle: 'Valid NorthCare referral',
  verifySuccessModalTitle: 'Referral verified',
  verifySuccessModalBody: 'This NorthCare referral is legitimate.',
  verifySuccessModalContinue: 'Continue',
  verifySuccessModalA11y: 'Referral verified. This NorthCare referral is legitimate.',
  verifyInvalidTitle: 'Not a valid passport',
  verifyPasteLabel: 'Paste passport code',
  verifyAction: 'Verify passport',
  verifyScanAction: 'Scan QR to verify',
  /** Soft Path 2 redirect when a v2 passport is scanned on local lookup screens. */
  signedPassportRedirectHint:
    'This QR is a NorthCare passport — open Verify passport to check it offline on this phone.',
  shareSlip: 'Share caregiver slip',
  exportPdfSlip: 'Export PDF',
  printSlip: 'Print slip',
  pdfExportFailed: 'Could not create or share the PDF slip. Try again, or use Share caregiver slip.',
  printFailed: 'Could not open the print dialog. Try Export PDF instead.',
  pdfUnavailableHint:
    'PDF needs an app rebuild on this phone. Share caregiver slip works now.',
  pdfUnavailableShareWorks:
    'Share caregiver slip works now — use it to send the slip text and QR value.',
  previewSlip: 'Preview slip',
  hideSlipPreview: 'Hide slip preview',
  previewSlipHint:
    'Scroll the preview below and screenshot it for the caregiver if needed.',
  scanPassport: 'Scan referral passport',
  enterCode: 'Enter passport code manually',
  successPassportPdfHint:
    'On the passport screen you can share the caregiver slip. PDF export needs a rebuilt app when print is unavailable.',
  createReferral: 'Prepare referral',
  continueReferral: 'Continue to referral',
  destinationTitle: 'Destination facility',
  destinationSubtitle: 'Choose where the client should go for care.',
  destinationHint: 'Facilities listed here are saved on this device for offline use.',
  reasonTitle: 'Referral reason',
  reasonSubtitle: 'Pick the closest reason, then describe the health concern in your own words.',
  reasonHint: 'Use plain language the receiving facility can understand.',
  reasonUnavailable:
    'An approved referral reason is not available. Production requires APPROVED_FOR_PILOT reasons.',
  clinicalSummaryLabel: 'Reason for referral (clinical summary)',
  clinicalSummaryHint:
    'Describe the health concern, observations, and why the client needs to go to the receiving facility.',
  clinicalSummaryRequired: 'Add a brief clinical summary before continuing.',
  clinicalSummaryPlaceholder: 'Describe the health concern in plain language…',
  optionalNotesLabel: 'Additional notes (optional)',
  optionalNotesHint: 'Any extra context for the receiving facility.',
  optionalNotesPlaceholder: 'e.g. transport needs, language preference, second caregiver contact',
  reviewTitle: 'Review referral',
  reviewSubtitle: 'Check the details before saving on this device.',
  caregiverInformedLabel: 'Caregiver has been informed',
  caregiverInformedHint:
    'Only tick this if you told the caregiver about the referral. It does not default to informed.',
  confirmReferral: 'Confirm and save referral',
  /** First-mount celebration after creating/saving a referral. */
  createSuccessModalTitle: 'Patient referred',
  createSuccessModalBody:
    'Referral saved. Share the QR slip with the caregiver so the receiving facility can verify it.',
  createSuccessModalContinue: 'Continue',
  createSuccessModalA11y:
    'Patient referred. Referral saved. Share the QR slip with the caregiver so the receiving facility can verify it.',
  successTitle: 'Referral saved on this device',
  successSubtitle: 'The referral is stored locally and ready to share.',
  successBody:
    'The referral is stored locally. It is not synced to a server and the destination facility has not been notified by this app.',
  successNextHint:
    'Show the QR passport to the caregiver so the receiving facility can verify it offline.',
  passportTitle: 'Referral passport',
  passportSubtitle: 'Share this QR with the caregiver for offline verification.',
  passportEmptyHint: 'Generate a passport to display the QR code for the caregiver.',
  generatePassport: 'Generate passport',
  clientReferralsTitle: 'Client referrals',
  clientReferralsSubtitle: 'Referrals saved for this client on this device.',
  clientReferralsEmptyTitle: 'No referrals yet',
  clientReferralsEmptyBody: 'Tap Prepare referral above to start a new referral for this client.',
  backStep: 'Back',
  continueStep: 'Continue',
  viewPassport: 'Show referral passport (QR)',
  /** Worker must confirm — does not auto-create a reminder from referral save. */
  scheduleReferralFollowUp: 'Schedule referral follow-up',
  viewDetails: 'View referral details',
  passportPrivacy:
    'This QR code contains a signed minimal summary plus a sealed client name unlockable only at the destination facility. It does not include phone number, clinical details, or screening answers.',
  passportNotEncrypted:
    'Facility, reason, and priority can be checked offline on any NorthCare phone. The client display name is sealed for the receiving facility only. It is not a full medical record.',
  verifySealedUnlockedLabel: 'Client (unlocked for this facility)',
  verifySealedLockedHint:
    'Details sealed for receiving facility. Signature is valid — this phone cannot unlock the client name.',
  verifyEnrichmentSex: 'Sex (passport)',
  verifyEnrichmentAgeBand: 'Age band (passport)',
  passportReissue: 'Reissue passport code',
  passportReissueHint:
    'Reissuing replaces the previous code. Old codes will no longer resolve on this device.',
  timelineTitle: 'Referral timeline',
  editReferral: 'Edit referral',
  editReferralSubtitle:
    'Update destination, reason, or notes. A new QR passport will be generated when you save.',
  editReferralSave: 'Save changes and regenerate QR',
  editReferralSuccessTitle: 'Referral updated',
  editReferralSuccessBody:
    'Changes saved on this device. Share the new QR passport with the caregiver.',
  cancelNotesLabel: 'Cancellation notes (optional)',
  cancelNotesHint: 'Optional reason for cancelling — stored in the referral timeline.',
  cancelNotesPlaceholder: 'e.g. client declined, referred elsewhere, duplicate entry',
  cancelReturnToReferrals: 'Back to referrals',
  updateStatusSubtitle: 'Record journey progress. Each update is saved on this device.',
  updateStatusSavedHint: 'Status changes are recorded in the referral timeline.',
  statusTransitionCaregiverInformed: 'Confirm the caregiver knows where to go and has the passport.',
  statusTransitionJourneyStarted: 'Record that travel to the receiving facility has started.',
  statusTransitionFacilityReached: 'Record that the client has arrived at the facility.',
  statusTransitionPatientReceived: 'Record that the receiving facility has taken the client into care.',
  statusTransitionCompleted: 'Close this referral after care has been provided.',
  updateStatusTitle: 'Update referral status',
  cancelTitle: 'Cancel referral',
  cancelConfirm: 'Cancel this referral? This cannot be undone.',
  cancelAction: 'Cancel referral',
  completeAction: 'Mark completed',
  facilityReached: 'Facility reached',
  clientReceived: 'Client received at facility',
  journeyStarted: 'Journey started',
  caregiverInformedAction: 'Mark caregiver informed',
  scanTitle: 'Scan passport',
  scanPermissionNeeded: 'Camera permission is needed to scan a referral passport.',
  scanPermissionDenied:
    'Camera access was denied. You can enter the passport code manually instead.',
  scanGrantPermission: 'Allow camera',
  scanEnterManually: 'Enter code manually',
  scanHint: 'Point the camera at a NorthCare AI referral passport QR code.',
  enterCodeTitle: 'Enter passport code',
  enterCodeHint:
    'Paste or type the opaque passport token. Short codes are not used — tokens are high-entropy.',
  resolveAction: 'Look up on this device',
  notOnDevice:
    'This referral passport is not available on this device. Offline QR resolution only looks up locally stored token hashes.',
  receiptTitle: 'Passport receipt',
  receiptStatusUnchanged:
    'Scanning or looking up a passport does not change referral status. Confirm arrival or receipt separately.',
  statusLabel: 'Status',
  priorityLabel: 'Priority',
  referenceLabel: 'Reference',
  originLabel: 'Origin',
  sourceFacilityLabel: 'Source facility',
  receivingFacilityLabel: 'Receiving facility',
  loading: 'Loading referral…',
  missing: 'Referral not found on this device.',
  savedOnDevice: 'Saved on this device',
  waitingForConnection: 'Waiting for connection — sync is not implemented in this stage.',
  accessibilityPassportQr: 'Referral passport QR code. Signed offline summary only. Do not read the raw token aloud.',
  accessibilityPriority: (priority: string) => `Priority ${priority}`,
  accessibilityStatus: (status: string) => `Referral status ${status}`,
  fromPriority: 'Prepared from a priority assessment on this device.',
  workerInitiated: 'Worker-initiated',
  noEnginePriorityNote:
    'Priority is marked as undetermined because this referral was started without a linked priority assessment.',
  developmentPreviewTitle: 'Referral development preview',
  deepLinkNeedAuth: 'Sign in to open a referral passport on this device.',
} as const;
