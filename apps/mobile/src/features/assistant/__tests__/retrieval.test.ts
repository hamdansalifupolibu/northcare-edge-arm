import { listLoadableKnowledgePacks } from '../content/registry';
import { buildSearchIndex } from '../retrieval/indexBuilder';
import { normaliseAssistantQuery } from '../retrieval/normalisation';
import { searchKnowledgeIndex } from '../retrieval/search';

describe('assistant local retrieval', () => {
  const packs = listLoadableKnowledgePacks('development');
  const index = buildSearchIndex(packs);

  it('matches exact approved question patterns deterministically', () => {
    const query = normaliseAssistantQuery('What is example care topic A');
    const first = searchKnowledgeIndex({
      index,
      normalisedQuery: query,
      language: 'en',
    });
    const second = searchKnowledgeIndex({
      index,
      normalisedQuery: query,
      language: 'en',
    });
    expect(first.coverage.answerability).toBe('answerAvailable');
    expect(first.coverage.selected[0]?.articleId).toBe('article-example-care-a-exact');
    expect(second.coverage.selected.map((c) => c.articleId)).toEqual(
      first.coverage.selected.map((c) => c.articleId),
    );
  });

  it('matches keywords and alternative phrases', () => {
    const keyword = searchKnowledgeIndex({
      index,
      normalisedQuery: normaliseAssistantQuery('example care hydration rest follow-up'),
      language: 'en',
    });
    expect(keyword.coverage.answerability).toBe('answerAvailable');
    expect(keyword.coverage.selected[0]?.articleId).toBe('article-example-care-a-keyword');

    const phrase = searchKnowledgeIndex({
      index,
      normalisedQuery: normaliseAssistantQuery('tell me about example care topic a'),
      language: 'en',
    });
    expect(phrase.candidateCount).toBeGreaterThan(0);
  });

  it('returns multiple relevant sources for shared exact patterns', () => {
    const result = searchKnowledgeIndex({
      index,
      normalisedQuery: normaliseAssistantQuery('Show long development reference C'),
      language: 'en',
    });
    expect(result.coverage.answerability).toBe('multipleRelevantSources');
    expect(result.coverage.selected.length).toBeGreaterThan(1);
  });

  it('fails closed on unsupported and low-coverage questions', () => {
    const unsupported = searchKnowledgeIndex({
      index,
      normalisedQuery: normaliseAssistantQuery('zzzz unrelated quantum bamboo orchard'),
      language: 'en',
    });
    expect(
      unsupported.coverage.answerability === 'unsupportedTopic' ||
        unsupported.coverage.answerability === 'insufficientCoverage',
    ).toBe(true);

    const weak = searchKnowledgeIndex({
      index,
      normalisedQuery: normaliseAssistantQuery('example'),
      language: 'en',
    });
    expect(weak.coverage.answerability).not.toBe('answerAvailable');
  });

  it('excludes retired articles from the index', () => {
    expect(index.articles.some((a) => a.articleId === 'article-retired-example')).toBe(false);
  });

  it('excludes development content when production packs are empty', () => {
    const productionIndex = buildSearchIndex(listLoadableKnowledgePacks('production'));
    expect(productionIndex.articles).toHaveLength(0);
  });

  it('uses inverted index without vector search', () => {
    expect(index.indexVersion).toBe(1);
    expect(index.inverted.size).toBeGreaterThan(0);
  });
});
