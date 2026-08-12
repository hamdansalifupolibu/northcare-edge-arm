import { createVoiceFileManager } from '../audio/fileManager';
import { createMockVoiceFileSystem } from './helpers';

describe('voice file manager', () => {
  it('promotes temp recording to managed private filename', async () => {
    const tempUri = 'file:///tmp/voice-test.m4a';
    const fs = createMockVoiceFileSystem({ tempUri, tempSize: 4096 });
    const manager = createVoiceFileManager(fs);
    const result = await manager.promoteTempRecording({
      tempUri,
      durationMs: 1500,
    });
    expect(result.managedUri).toContain('file:///mock/voice/vc_');
    expect(result.filename).toMatch(/^vc_[a-f0-9]+\.m4a$/);
    expect(result.filename).not.toMatch(/client|phone|referral/i);
    expect(result.fileSize).toBe(4096);
    expect(result.durationMs).toBe(1500);
    const tempInfo = await fs.getInfo(tempUri);
    expect(tempInfo.exists).toBe(false);
  });

  it('deletes managed files safely when missing', async () => {
    const fs = createMockVoiceFileSystem();
    const manager = createVoiceFileManager(fs);
    await expect(manager.deleteManagedFile('file:///mock/voice/missing.m4a')).resolves.toBeUndefined();
  });
});
