import { AppTextInput } from '../../../design-system';
import { useAssistantStrings } from '../hooks/useAssistantStrings';
import { MAX_ASSISTANT_QUESTION_LENGTH } from '../retrieval/normalisation';

type Props = {
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly editable?: boolean;
};

export function AssistantQuestionInput({ value, onChangeText, editable = true }: Props) {
  return (
    <AppTextInput
      label={assistantStrings.questionLabel}
      accessibilityLabel={assistantStrings.accessibilityQuestion}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      multiline
      maxLength={MAX_ASSISTANT_QUESTION_LENGTH}
      placeholder={assistantStrings.questionPlaceholder}
      testID="ask-question-text-input"
    />
  );
}
