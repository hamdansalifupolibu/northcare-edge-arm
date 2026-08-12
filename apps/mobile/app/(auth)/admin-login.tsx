import { LoginScreen } from '../../src/features/auth/components/LoginScreen';
import { useTranslation } from '../../src/i18n/LanguageProvider';

export default function AdminLoginRoute() {
  const t = useTranslation();
  return <LoginScreen expectedRole="administrator" title={t.auth.adminLoginTitle} />;
}
