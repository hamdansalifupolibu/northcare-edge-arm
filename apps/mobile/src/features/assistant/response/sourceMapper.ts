import type { AnswerCitation, KnowledgeArticleDefinition } from '../domain/types';

export function mapArticleCitations(input: {
  readonly article: KnowledgeArticleDefinition;
  readonly knowledgePackId: string;
  readonly knowledgePackVersion: number;
}): readonly AnswerCitation[] {
  if (input.article.sourceReferences.length === 0) {
    if (input.article.isClinical) {
      return [];
    }
    return [
      {
        sourceId: `${input.article.articleId}-source-unavailable`,
        title: null,
        issuingOrganisation: null,
        versionOrYear: null,
        section: null,
        knowledgePackId: input.knowledgePackId,
        knowledgePackVersion: input.knowledgePackVersion,
        articleId: input.article.articleId,
        articleVersion: input.article.version,
        detailsUnavailable: true,
      },
    ];
  }

  return input.article.sourceReferences.map((source) => ({
    sourceId: source.sourceId,
    title: source.title,
    issuingOrganisation: source.issuingOrganisation,
    versionOrYear: source.versionOrYear,
    section: source.section,
    knowledgePackId: input.knowledgePackId,
    knowledgePackVersion: input.knowledgePackVersion,
    articleId: input.article.articleId,
    articleVersion: input.article.version,
    detailsUnavailable:
      source.title == null &&
      source.issuingOrganisation == null &&
      source.versionOrYear == null,
  }));
}
