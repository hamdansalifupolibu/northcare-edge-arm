import { setupAssistantTest } from './helpers';

describe('assistant feedback', () => {
  it('saves helpful and not-helpful feedback locally without raw questions', async () => {
    const { services, repos, manager } = await setupAssistantTest('development');
    const answer = await services.ask({ question: 'What is example care topic A' });
    expect(answer.kind).toBe('answer');
    if (answer.kind !== 'answer') {
      return;
    }

    const helpful = await services.recordFeedback({
      articleId: answer.answer.articleIds[0]!,
      knowledgePackId: answer.answer.knowledgePackId,
      knowledgePackVersion: answer.answer.knowledgePackVersion,
      answerMode: answer.answer.mode,
      feedbackCategory: 'helpful',
    });
    expect(helpful.feedbackCategory).toBe('helpful');
    expect(helpful.syncStatus).toBe('localOnly');

    const notHelpful = await services.recordFeedback({
      articleId: answer.answer.articleIds[0]!,
      knowledgePackId: answer.answer.knowledgePackId,
      knowledgePackVersion: answer.answer.knowledgePackVersion,
      answerMode: answer.answer.mode,
      feedbackCategory: 'notHelpful',
    });
    expect(notHelpful.feedbackCategory).toBe('notHelpful');

    const issue = await services.recordFeedback({
      articleId: answer.answer.articleIds[0]!,
      knowledgePackId: answer.answer.knowledgePackId,
      knowledgePackVersion: answer.answer.knowledgePackVersion,
      answerMode: answer.answer.mode,
      feedbackCategory: 'reportContentIssue',
      contentIssueCategory: 'unclear',
      optionalNote: 'x'.repeat(400),
    });
    expect(issue.contentIssueCategory).toBe('unclear');
    expect(issue.optionalNote?.length).toBe(280);
    expect(issue.syncStatus).toBe('pending');

    const listed = await repos.assistantFeedback.listByArticle(answer.answer.articleIds[0]!);
    expect(listed.length).toBe(3);
    expect(JSON.stringify(listed)).not.toMatch(/What is example care topic A/i);

    const queue = await repos.syncQueue.listByState('pending');
    expect(queue.some((item) => item.entityType === 'assistant_feedback')).toBe(true);

    await manager.close();
  });
});
