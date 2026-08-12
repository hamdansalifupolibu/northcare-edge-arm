import { setupAssistantTest } from './helpers';

describe('assistant answer composition', () => {
  it('composes retrieval-only answers with sources and versions', async () => {
    const { services, manager } = await setupAssistantTest('development');
    const result = await services.ask({
      question: 'What is example care topic A',
    });
    expect(result.kind).toBe('answer');
    if (result.kind === 'answer') {
      expect(result.answer.answerability).toBe('answerAvailable');
      expect(result.answer.citations.length).toBeGreaterThan(0);
      expect(result.answer.knowledgePackId).toBe('synthetic-dev-ask-northcare-v1');
      expect(result.answer.knowledgePackVersion).toBe(1);
      expect(result.answer.articleIds).toContain('article-example-care-a-exact');
      expect(result.answer.blocks.every((b) => typeof b.text === 'string')).toBe(true);
      expect(JSON.stringify(result.answer)).not.toMatch(/confidence/i);
      expect(result.answer.developmentBanner).toBeTruthy();
    }
    await manager.close();
  });

  it('composes multiple approved sources without inventing facts', async () => {
    const { services, manager } = await setupAssistantTest('development');
    const result = await services.ask({
      question: 'Show long development reference C',
    });
    expect(result.kind).toBe('answer');
    if (result.kind === 'answer') {
      expect(result.answer.answerability).toBe('multipleRelevantSources');
      expect(result.answer.articleIds.length).toBeGreaterThan(1);
      expect(result.answer.citations.length).toBeGreaterThan(1);
    }
    await manager.close();
  });

  it('does not invent an answer for unsupported questions', async () => {
    const { services, manager } = await setupAssistantTest('development');
    const result = await services.ask({
      question: 'zzzz unrelated quantum bamboo orchard',
    });
    expect(result.kind).toBe('boundary');
    await manager.close();
  });
});
