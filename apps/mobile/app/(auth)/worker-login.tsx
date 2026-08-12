import { LoginScreen } from '../../src/features/auth/components/LoginScreen';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function WorkerLoginRoute() {
  const t = useTranslation();
  return <LoginScreen expectedRole="worker" title={t.auth.workerLoginTitle} />;
}
