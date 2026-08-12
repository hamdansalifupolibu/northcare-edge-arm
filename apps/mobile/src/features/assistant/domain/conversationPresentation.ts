import type { AssistantConversationTopicIcon } from '../../../data/repositories/contracts/assistantConversationTypes';

const CONVERSATION_TITLE_MAX_LENGTH = 40;
const DEFAULT_CONVERSATION_TITLE = 'Health question';

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitaliseTitle(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function deriveConversationTitle(firstMessage: string): string {
  let text = stripMarkdown(firstMessage.trim());
  if (!text) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  text = text.replace(/^["'(\[]+|["')\]]+$/g, '').trim();
  text = text.replace(/[.!,;:]+$/g, '').trim();
  text = capitaliseTitle(text);

  if (text.length <= CONVERSATION_TITLE_MAX_LENGTH) {
    return text;
  }

  const truncated = text.slice(0, CONVERSATION_TITLE_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  const shortened = lastSpace > 16 ? truncated.slice(0, lastSpace) : truncated;
  return `${shortened.trimEnd()}…`;
}

export function inferConversationTopicIcon(text: string): AssistantConversationTopicIcon {
  const lower = text.toLowerCase();
  if (/pregnan|postnatal|delivery|labour|labor|maternal|antenatal/.test(lower)) {
    return 'pregnancy';
  }
  if (/child|dehydrat|infant|baby|under five|feeding|toddler/.test(lower)) {
    return 'child';
  }
  if (/referral|refer/.test(lower)) {
    return 'referral';
  }
  if (/nutrition|malnutri|growth|breastfeed|weaning/.test(lower)) {
    return 'nutrition';
  }
  return 'general';
}

export function formatConversationTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (sameDay) {
    return `Today · ${time}`;
  }
  if (isYesterday) {
    return `Yesterday · ${time}`;
  }

  const day = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return `${day} · ${time}`;
}

export function formatChatDateSeparator(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (sameDay) {
    return `Today, ${time}`;
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function splitMessageTimestamp(iso: string): { readonly date: string; readonly time: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    const [datePart = iso, timePart = ''] = iso.split('T');
    return { date: datePart, time: timePart };
  }
  const datePart = date.toISOString().slice(0, 10);
  const timePart = `${date.toISOString().slice(11, 23)}Z`;
  return { date: datePart, time: timePart };
}
