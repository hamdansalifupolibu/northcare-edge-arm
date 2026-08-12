import { voiceStrings } from '../i18n/voiceStrings';

describe('voice accessibility labels', () => {
  it('provides non-colour-only recording announcements', () => {
    expect(voiceStrings.accessibilityRecording('0:45')).toContain('Recording');
    expect(voiceStrings.accessibilityRecording('0:45')).toContain('0:45');
    expect(voiceStrings.accessibilityPaused('1:02')).toContain('paused');
  });

  it('labels suggestion review actions explicitly', () => {
    expect(voiceStrings.accessibilityAccept).toBe('Accept suggestion');
    expect(voiceStrings.accessibilityEdit).toBe('Edit suggestion');
    expect(voiceStrings.accessibilityReject).toBe('Reject suggestion');
    expect(voiceStrings.accessibilitySuggestion('Draft note', 'uncertain')).toContain(
      'Review required',
    );
  });

  it('uses finish recording label instead of stop and save', () => {
    expect(voiceStrings.finishRecording).toBe('Finish recording');
    expect(voiceStrings.recordStop).toBe('Finish recording');
  });

  it('labels on-device shell copy', () => {
    expect(voiceStrings.onDeviceChip).toContain('On-device');
    expect(voiceStrings.consentConfirmedChip).toContain('Consent');
  });

  it('labels in-body view recordings entry', () => {
    expect(voiceStrings.viewRecordings).toBe('View recordings');
    expect(voiceStrings.viewRecordingsA11y).toContain('recordings');
  });
});
