import { canonicalJson, stableChecksum } from '../../../risk/engine/checksum';
import { KNOWLEDGE_CONTENT_STATUSES, type KnowledgeContentStatus } from '../../domain/statuses';
import type { KnowledgePackDefinition } from '../../domain/types';

const ALLOWED_WORKFLOW_ROUTES = new Set([
  '/(worker)',
  '/(worker)/clients',
  '/(worker)/referrals',
]);

export type PackValidationResult =
  | { readonly ok: true; readonly checksum: string }
  | { readonly ok: false; readonly errors: readonly string[] };

export function validateKnowledgePack(pack: KnowledgePackDefinition): PackValidationResult {
  const errors: string[] = [];

  if (!pack.knowledgePackId.trim()) {
    errors.push('missingPackId');
  }
  if (!Number.isInteger(pack.version) || pack.version < 1) {
    errors.push('invalidVersion');
  }
  if (!KNOWLEDGE_CONTENT_STATUSES.includes(pack.status as KnowledgeContentStatus)) {
    errors.push('invalidStatus');
  }
  if (pack.supportedLanguages.length === 0) {
    errors.push('invalidLanguage');
  }
  for (const language of pack.supportedLanguages) {
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language) && language !== 'en') {
      // Allow simple language tags; reject empty/odd values.
      if (!language.trim()) {
        errors.push('invalidLanguage');
      }
    }
  }
  if (pack.effectiveDate && pack.retiredDate && pack.retiredDate < pack.effectiveDate) {
    errors.push('invalidDateRange');
  }
  if (pack.status === 'RETIRED' && pack.retiredDate == null) {
    errors.push('retiredWithoutDate');
  }

  const topicIds = new Set<string>();
  for (const topic of pack.topics) {
    if (topicIds.has(topic.topicId)) {
      errors.push('duplicateTopicId');
    }
    topicIds.add(topic.topicId);
    if (!KNOWLEDGE_CONTENT_STATUSES.includes(topic.status)) {
      errors.push('invalidTopicStatus');
    }
  }

  const articleIds = new Set<string>();
  for (const article of pack.articles) {
    if (articleIds.has(article.articleId)) {
      errors.push('duplicateArticleId');
    }
    articleIds.add(article.articleId);
    if (!topicIds.has(article.topicId) && !pack.applicableTopics.includes(article.topicId)) {
      errors.push('unknownTopicReference');
    }
    if (article.approvedAnswer.length === 0 && article.status !== 'RETIRED') {
      errors.push('emptyApprovedAnswer');
    }
    if (article.isClinical && article.sourceReferences.length === 0) {
      errors.push('missingSourceForClinicalContent');
    }
    if (containsHtmlOrScript(article)) {
      errors.push('unapprovedHtmlOrExecutable');
    }
    for (const link of article.workflowLinks) {
      if (!ALLOWED_WORKFLOW_ROUTES.has(link.route)) {
        errors.push('invalidWorkflowRoute');
      }
    }
    for (const related of article.relatedArticleIds) {
      if (!articleIds.has(related) && !pack.articles.some((a) => a.articleId === related)) {
        // related may point forward; check after loop
      }
    }
  }

  for (const article of pack.articles) {
    for (const related of article.relatedArticleIds) {
      if (!articleIds.has(related)) {
        errors.push('unknownArticleRelation');
      }
    }
  }

  const checksum = computePackChecksum(pack);
  if (pack.contentChecksum && pack.contentChecksum !== checksum) {
    // Allow empty checksum during authoring; reject mismatch when provided.
    if (pack.contentChecksum.length > 0) {
      errors.push('checksumMismatch');
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }
  return { ok: true, checksum };
}

export function computePackChecksum(pack: KnowledgePackDefinition): string {
  const { contentChecksum: _ignored, ...rest } = pack;
  return stableChecksum(canonicalJson(rest));
}

function containsHtmlOrScript(article: KnowledgePackDefinition['articles'][number]): boolean {
  const texts: string[] = [
    article.title,
    article.summary,
    ...article.approvedAnswer.map((b) => b.text),
    ...article.sections.flatMap((s) => [s.heading, ...s.blocks.map((b) => b.text)]),
  ];
  return texts.some(
    (text) =>
      /<\s*script\b/i.test(text) ||
      /<\s*iframe\b/i.test(text) ||
      /javascript:/i.test(text) ||
      /<\s*img\b/i.test(text),
  );
}
