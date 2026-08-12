import type { AssistantMode } from './modes';
import type { AnswerabilityOutcome, KnowledgeContentStatus, KnowledgeFamily } from './statuses';

export type RichTextBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'bullet'; readonly text: string }
  | { readonly kind: 'heading'; readonly text: string }
  | { readonly kind: 'safetyNote'; readonly text: string };

export type KnowledgeSourceReference = {
  readonly sourceId: string;
  readonly title: string | null;
  readonly issuingOrganisation: string | null;
  readonly versionOrYear: string | null;
  readonly section: string | null;
  readonly usageNote: string | null;
};

export type KnowledgeTopicDefinition = {
  readonly topicId: string;
  readonly title: string;
  readonly description: string;
  readonly status: KnowledgeContentStatus;
  readonly applicableKnowledgePacks: readonly string[];
  readonly applicableRole: 'worker';
  readonly clinicalReviewStatus: 'notReviewed' | 'reviewRequired' | 'approved';
  readonly supportedLanguages: readonly string[];
  readonly icon: 'reference' | 'workflow' | 'help' | 'care';
  readonly order: number;
  readonly family: KnowledgeFamily;
};

export type KnowledgeArticleSection = {
  readonly sectionId: string;
  readonly heading: string;
  readonly blocks: readonly RichTextBlock[];
};

export type KnowledgeArticleDefinition = {
  readonly articleId: string;
  readonly packId: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly topicId: string;
  readonly summary: string;
  readonly approvedAnswer: readonly RichTextBlock[];
  readonly sections: readonly KnowledgeArticleSection[];
  readonly keywords: readonly string[];
  readonly alternativePhrases: readonly string[];
  readonly approvedQuestionPatterns: readonly string[];
  readonly sourceReferences: readonly KnowledgeSourceReference[];
  readonly audience: 'worker';
  readonly jurisdiction: string | null;
  readonly language: string;
  readonly version: number;
  readonly status: KnowledgeContentStatus;
  readonly effectiveDate: string | null;
  readonly retiredDate: string | null;
  readonly relatedArticleIds: readonly string[];
  readonly workflowLinks: readonly AssistantWorkflowLink[];
  readonly safetyNote: string | null;
  readonly isClinical: boolean;
};

export type AssistantWorkflowLink = {
  readonly linkId: string;
  readonly label: string;
  readonly route: '/(worker)' | '/(worker)/clients' | '/(worker)/referrals';
};

export type KnowledgePackDefinition = {
  readonly knowledgePackId: string;
  readonly title: string;
  readonly description: string;
  readonly version: number;
  readonly status: KnowledgeContentStatus;
  readonly jurisdiction: string | null;
  readonly issuingOrganisation: string | null;
  readonly sourceReferences: readonly KnowledgeSourceReference[];
  readonly applicableRoles: readonly ['worker'];
  readonly applicableTopics: readonly string[];
  readonly supportedLanguages: readonly string[];
  readonly effectiveDate: string | null;
  readonly retiredDate: string | null;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
  readonly contentChecksum: string;
  readonly implementationPath: string;
  readonly knownLimitations: readonly string[];
  readonly developmentBanner: string | null;
  readonly family: KnowledgeFamily;
  readonly topics: readonly KnowledgeTopicDefinition[];
  readonly articles: readonly KnowledgeArticleDefinition[];
};

export type AnswerCitation = {
  readonly sourceId: string;
  readonly title: string | null;
  readonly issuingOrganisation: string | null;
  readonly versionOrYear: string | null;
  readonly section: string | null;
  readonly knowledgePackId: string;
  readonly knowledgePackVersion: number;
  readonly articleId: string;
  readonly articleVersion: number;
  readonly detailsUnavailable: boolean;
};

export type ComposedAssistantAnswer = {
  readonly answerId: string;
  readonly heading: string;
  readonly summary: string;
  readonly blocks: readonly RichTextBlock[];
  readonly safetyNote: string | null;
  readonly citations: readonly AnswerCitation[];
  readonly relatedArticleIds: readonly string[];
  readonly relatedTopicIds: readonly string[];
  readonly workflowLinks: readonly AssistantWorkflowLink[];
  readonly knowledgePackId: string;
  readonly knowledgePackVersion: number;
  readonly articleIds: readonly string[];
  readonly articleVersions: readonly number[];
  readonly retrievalEngineVersion: number;
  readonly responseComposerVersion: number;
  readonly searchIndexVersion: number;
  readonly language: string;
  readonly mode: AssistantMode;
  readonly answerability: AnswerabilityOutcome;
  readonly answeredAt: string;
  readonly developmentBanner: string | null;
};

export type AssistantBoundaryResult = {
  readonly answerId: string;
  readonly answerability: AnswerabilityOutcome;
  readonly heading: string;
  readonly body: string;
  readonly relatedTopicIds: readonly string[];
  readonly workflowLinks: readonly AssistantWorkflowLink[];
  readonly mode: AssistantMode;
  readonly answeredAt: string;
  readonly developmentBanner: string | null;
};

export type AssistantAskResult =
  | { readonly kind: 'answer'; readonly answer: ComposedAssistantAnswer }
  | { readonly kind: 'boundary'; readonly boundary: AssistantBoundaryResult }
  | { readonly kind: 'privacyReviewRequired'; readonly answerId: string; readonly message: string }
  | { readonly kind: 'unavailable'; readonly answerId: string; readonly message: string };

export type AssistantAvailability = {
  readonly mode: AssistantMode;
  readonly contentAvailable: boolean;
  readonly topicCount: number;
  readonly packCount: number;
  readonly developmentOnly: boolean;
  readonly message: string | null;
};
