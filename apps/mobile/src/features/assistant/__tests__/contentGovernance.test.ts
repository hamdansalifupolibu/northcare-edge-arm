import {
  countApprovedForDevelopmentKnowledgePacks,
  countApprovedForPilotKnowledgePacks,
  getKnowledgePackById,
  listApprovedTopics,
  listLoadableKnowledgePacks,
  listRegisteredKnowledgePacks,
} from '../content/registry';
import { SYNTHETIC_DEV_ASK_NORTHCARE_PACK } from '../content/packs/syntheticDevAskNorthCarePack';
import { computePackChecksum, validateKnowledgePack } from '../content/validation/validatePack';
import type { KnowledgePackDefinition } from '../domain/types';

describe('assistant knowledge governance', () => {
  it('blocks APPROVED_FOR_DEVELOPMENT packs in production', () => {
    expect(listLoadableKnowledgePacks('production')).toHaveLength(0);
    expect(listApprovedTopics('production')).toHaveLength(0);
    expect(
      getKnowledgePackById(SYNTHETIC_DEV_ASK_NORTHCARE_PACK.knowledgePackId, 1, 'production'),
    ).toBeNull();
  });

  it('reports zero pilot-approved knowledge packs', () => {
    expect(countApprovedForPilotKnowledgePacks()).toBe(0);
    expect(countApprovedForDevelopmentKnowledgePacks()).toBe(1);
  });

  it('loads synthetic development content in development', () => {
    const packs = listLoadableKnowledgePacks('development');
    expect(packs).toHaveLength(1);
    expect(packs[0]?.status).toBe('APPROVED_FOR_DEVELOPMENT');
    expect(listApprovedTopics('development').length).toBeGreaterThan(0);
  });

  it('accepts the valid development pack and stable checksum', () => {
    const validation = validateKnowledgePack(SYNTHETIC_DEV_ASK_NORTHCARE_PACK);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.checksum).toBe(SYNTHETIC_DEV_ASK_NORTHCARE_PACK.contentChecksum);
      expect(computePackChecksum(SYNTHETIC_DEV_ASK_NORTHCARE_PACK)).toBe(validation.checksum);
    }
  });

  it('rejects duplicate article ids and clinical content without sources', () => {
    const base = listRegisteredKnowledgePacks()[0]!;
    const duplicateArticles: KnowledgePackDefinition = {
      ...base,
      articles: [base.articles[0]!, { ...base.articles[0]!, articleId: base.articles[0]!.articleId }],
      contentChecksum: '',
    };
    expect(validateKnowledgePack(duplicateArticles).ok).toBe(false);

    const clinicalMissingSource: KnowledgePackDefinition = {
      ...base,
      articles: [
        {
          ...base.articles[0]!,
          articleId: 'clinical-missing-source',
          isClinical: true,
          sourceReferences: [],
        },
      ],
      contentChecksum: '',
    };
    const result = validateKnowledgePack(clinicalMissingSource);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('missingSourceForClinicalContent');
    }
  });

  it('rejects arbitrary HTML / script content', () => {
    const base = listRegisteredKnowledgePacks()[0]!;
    const withScript: KnowledgePackDefinition = {
      ...base,
      articles: [
        {
          ...base.articles[0]!,
          articleId: 'html-bad',
          approvedAnswer: [{ kind: 'paragraph', text: '<script>alert(1)</script>' }],
        },
      ],
      contentChecksum: '',
    };
    const result = validateKnowledgePack(withScript);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('unapprovedHtmlOrExecutable');
    }
  });

  it('rejects draft and retired packs for new loadable answers via status gate', () => {
    expect(listLoadableKnowledgePacks('development').every((p) => p.status !== 'DRAFT')).toBe(
      true,
    );
    expect(listLoadableKnowledgePacks('development').every((p) => p.status !== 'RETIRED')).toBe(
      true,
    );
  });
});
