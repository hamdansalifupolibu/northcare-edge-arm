import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import { createAssistantServices } from '../application/createAssistantServices';
import { clearAssistantConversation } from '../session/assistantConversationStore';
import type { AppEnvironment } from '../../../types/env';

export async function setupAssistantTest(environment: AppEnvironment = 'development') {
  clearAssistantConversation();
  const db = await createTestDatabase();
  const services = createAssistantServices(db.repos, { environment });
  return { ...db, services };
}
