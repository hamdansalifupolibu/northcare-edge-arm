import { File, Paths } from 'expo-file-system';

/** One-time lab file for building synthetic goldens — never used for clinical storage. */
export const EDGE_LAB_GOLDEN_CAPTURE_FILENAME = 'edge-lab-golden-capture.txt';

/**
 * Writes synthetic fixture transcript to app documents for host pull.
 * Call only when auto-config requests captureFixtureTranscript.
 */
export async function writeEdgeLabGoldenCapture(transcript: string): Promise<void> {
  const file = new File(Paths.document, EDGE_LAB_GOLDEN_CAPTURE_FILENAME);
  file.write(transcript);
}
