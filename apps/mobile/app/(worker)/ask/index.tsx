import { Redirect } from 'expo-router';

/**
 * Ask NorthCare main entry lands on the on-device chatbot.
 * Stage 13 retrieval home remains available via secondary routes (topics/answer).
 */
export default function AskNorthCareRoute() {
  return <Redirect href="/(worker)/ask/chat" />;
}
