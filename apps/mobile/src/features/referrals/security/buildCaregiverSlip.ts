import type { SignedPassportClaims } from './signedPassportClaims';

/** Fallback when linked client name is missing on device. */
export const CAREGIVER_SLIP_FALLBACK_CLIENT_NAME = 'Registered NorthCare client';

/**
 * Shared printable slip fields.
 * Paper slips MAY include the client display name.
 * QR / signed claims must NEVER gain the full name from this model.
 */
export type CaregiverSlipData = {
  readonly brandName: string;
  readonly tagline: string;
  readonly clientDisplayName: string;
  readonly clientSex: string | null;
  readonly clientAgeLabel: string | null;
  readonly referenceCode: string;
  readonly sourceFacilityName: string;
  readonly destinationFacilityName: string;
  readonly reasonLabel: string;
  readonly priorityLabel: string;
  readonly createdAtLabel: string;
  readonly expiresAtLabel: string;
  /** Signed passport URI embedded only in the QR — not a name bearer. */
  readonly passportUri: string;
  readonly receivingFacilityInstruction: string;
  readonly privacyLine: string;
};

export type BuildCaregiverSlipInput = {
  readonly claims: SignedPassportClaims;
  readonly uri: string;
  readonly clientDisplayName?: string | null;
  readonly clientSex?: string | null;
  readonly clientAgeLabel?: string | null;
};

function formatSlipDate(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  try {
    return new Date(ms).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

function resolveClientDisplayName(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : CAREGIVER_SLIP_FALLBACK_CLIENT_NAME;
}

/** Build the shared data shape for text slip and PDF HTML. */
export function buildCaregiverSlipData(input: BuildCaregiverSlipInput): CaregiverSlipData {
  const { claims, uri } = input;
  return {
    brandName: 'NorthCare AI',
    tagline: 'Smarter care. Stronger communities.',
    clientDisplayName: resolveClientDisplayName(input.clientDisplayName),
    clientSex: input.clientSex || null,
    clientAgeLabel: input.clientAgeLabel || null,
    referenceCode: claims.ref,
    sourceFacilityName: claims.srcName,
    destinationFacilityName: claims.dstName,
    reasonLabel: claims.reasonLabel,
    priorityLabel: claims.priority,
    createdAtLabel: formatSlipDate(claims.createdAt),
    expiresAtLabel: formatSlipDate(claims.expiresAt),
    passportUri: uri,
    receivingFacilityInstruction:
      'Present this slip at the receiving facility. Staff can scan the QR to confirm it is a legitimate NorthCare referral.',
    privacyLine:
      'This paper slip may identify the client. The QR code seals the display name for the receiving facility only.',
  };
}

export function buildCaregiverSlipText(input: BuildCaregiverSlipInput): string {
  const slip = buildCaregiverSlipData(input);
  const parts = [
    `${slip.brandName} — Referral passport slip`,
    slip.tagline,
    '',
    `Client: ${slip.clientDisplayName}`,
  ];
  if (slip.clientSex) {
    parts.push(`Sex: ${slip.clientSex}`);
  }
  if (slip.clientAgeLabel) {
    parts.push(`Age: ${slip.clientAgeLabel}`);
  }
  parts.push(
    `Reference: ${slip.referenceCode}`,
    `From: ${slip.sourceFacilityName}`,
    `To: ${slip.destinationFacilityName}`,
    `Reason: ${slip.reasonLabel}`,
    `Priority: ${slip.priorityLabel}`,
    `Created: ${slip.createdAtLabel}`,
    `Expires: ${slip.expiresAtLabel}`,
    '',
    slip.receivingFacilityInstruction,
    slip.privacyLine,
    '',
    'Passport QR code value (for staff scanners):',
    slip.passportUri,
  );
  return parts.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type BuildCaregiverSlipHtmlInput = BuildCaregiverSlipInput & {
  /** Inline SVG markup for the passport QR (same signed URI as on-screen). */
  readonly qrSvgMarkup: string;
  /** Optional data URL for the NorthCare symbol logo. */
  readonly logoDataUrl?: string | null;
};

/** HTML template for expo-print PDF / print. Does not log the URI. */
export function buildCaregiverSlipHtml(input: BuildCaregiverSlipHtmlInput): string {
  const slip = buildCaregiverSlipData(input);
  const logoBlock = input.logoDataUrl
    ? `<img src="${input.logoDataUrl}" alt="NorthCare AI" width="72" height="72" style="display:block;margin:0 auto 12px;" />`
    : '';

  const sexRow = slip.clientSex
    ? `<div class="row"><div class="label">Sex</div><div class="value">${escapeHtml(slip.clientSex)}</div></div>`
    : '';
  const ageRow = slip.clientAgeLabel
    ? `<div class="row"><div class="label">Age</div><div class="value">${escapeHtml(slip.clientAgeLabel)}</div></div>`
    : '';

  // qrSvgMarkup is generated locally from the URI; do not escape SVG tags.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { margin: 18mm; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      color: #17211F;
      margin: 0;
      padding: 0;
      line-height: 1.4;
    }
    .wrap { text-align: center; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #0F766E; }
    .tagline { font-size: 12px; color: #52615E; margin: 0 0 20px; }
    .card {
      text-align: left;
      border: 1px solid #DDE7E4;
      border-radius: 12px;
      padding: 16px;
      margin: 0 auto 16px;
      max-width: 420px;
      background: #F7FAF9;
    }
    .row { margin: 0 0 8px; font-size: 13px; }
    .label { color: #52615E; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .value { font-size: 15px; font-weight: 600; }
    .client { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .qr { margin: 16px auto; width: 220px; height: 220px; }
    .qr svg { width: 220px; height: 220px; }
    .instruction { font-size: 13px; margin: 12px auto; max-width: 420px; }
    .privacy { font-size: 11px; color: #52615E; margin: 8px auto 0; max-width: 420px; }
  </style>
</head>
<body>
  <div class="wrap">
    ${logoBlock}
    <h1>${escapeHtml(slip.brandName)}</h1>
    <p class="tagline">${escapeHtml(slip.tagline)}</p>
    <div class="card">
      <div class="client">${escapeHtml(slip.clientDisplayName)}</div>
      ${sexRow}
      ${ageRow}
      <div class="row"><div class="label">Referral reference</div><div class="value">${escapeHtml(slip.referenceCode)}</div></div>
      <div class="row"><div class="label">From</div><div class="value">${escapeHtml(slip.sourceFacilityName)}</div></div>
      <div class="row"><div class="label">To</div><div class="value">${escapeHtml(slip.destinationFacilityName)}</div></div>
      <div class="row"><div class="label">Reason</div><div class="value">${escapeHtml(slip.reasonLabel)}</div></div>
      <div class="row"><div class="label">Priority</div><div class="value">${escapeHtml(slip.priorityLabel)}</div></div>
      <div class="row"><div class="label">Created</div><div class="value">${escapeHtml(slip.createdAtLabel)}</div></div>
      <div class="row"><div class="label">Expires</div><div class="value">${escapeHtml(slip.expiresAtLabel)}</div></div>
    </div>
    <div class="qr">${input.qrSvgMarkup}</div>
    <p class="instruction">${escapeHtml(slip.receivingFacilityInstruction)}</p>
    <p class="privacy">${escapeHtml(slip.privacyLine)}</p>
  </div>
</body>
</html>`;
}
