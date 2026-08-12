/**
 * Strip lightweight markdown so offline model replies read cleanly in plain-text bubbles.
 */
export function formatAssistantReplyForDisplay(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .trim();
}
