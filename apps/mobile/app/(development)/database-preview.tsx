import { useRouter } from 'expo-router';

import { DatabasePreviewScreen } from '../../src/data/diagnostics/DatabasePreviewScreen';

export default function DatabasePreviewRoute() {
  const router = useRouter();
  return <DatabasePreviewScreen onClose={() => router.back()} />;
}
