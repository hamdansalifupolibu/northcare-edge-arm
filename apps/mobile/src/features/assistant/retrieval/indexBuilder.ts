import { SEARCH_INDEX_VERSION } from '../domain/modes';
import type { KnowledgeArticleDefinition, KnowledgePackDefinition } from '../domain/types';
import { tokenize } from './tokenizer';

export type IndexedArticle = {
  readonly articleId: string;
  readonly packId: string;
  readonly packVersion: number;
  readonly topicId: string;
  readonly language: string;
  readonly titleTokens: readonly string[];
  readonly keywordTokens: readonly string[];
  readonly phraseTokens: readonly string[];
  readonly questionPatterns: readonly string[];
  readonly article: KnowledgeArticleDefinition;
};

export type AssistantSearchIndex = {
  readonly indexVersion: typeof SEARCH_INDEX_VERSION;
  readonly packIds: readonly string[];
  readonly articles: readonly IndexedArticle[];
  readonly inverted: ReadonlyMap<string, readonly string[]>;
};

export function buildSearchIndex(
  packs: readonly KnowledgePackDefinition[],
): AssistantSearchIndex {
  const articles: IndexedArticle[] = [];
  const inverted = new Map<string, string[]>();

  for (const pack of packs) {
    for (const article of pack.articles) {
      if (article.status === 'RETIRED' || article.status === 'DRAFT') {
        continue;
      }
      const titleTokens = tokenize(article.title.toLowerCase());
      const keywordTokens = article.keywords.flatMap((k) => tokenize(k.toLowerCase()));
      const phraseTokens = article.alternativePhrases.flatMap((p) =>
        tokenize(p.toLowerCase()),
      );
      const indexed: IndexedArticle = {
        articleId: article.articleId,
        packId: pack.knowledgePackId,
        packVersion: pack.version,
        topicId: article.topicId,
        language: article.language,
        titleTokens,
        keywordTokens,
        phraseTokens,
        questionPatterns: article.approvedQuestionPatterns.map((p) => p.toLowerCase()),
        article,
      };
      articles.push(indexed);
      const allTokens = new Set([...titleTokens, ...keywordTokens, ...phraseTokens]);
      for (const token of allTokens) {
        const list = inverted.get(token) ?? [];
        list.push(article.articleId);
        inverted.set(token, list);
      }
    }
  }

  articles.sort((a, b) => a.articleId.localeCompare(b.articleId));

  return {
    indexVersion: SEARCH_INDEX_VERSION,
    packIds: packs.map((p) => p.knowledgePackId).sort(),
    articles,
    inverted,
  };
}
