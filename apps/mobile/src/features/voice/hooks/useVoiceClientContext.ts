import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '../../../i18n/LanguageProvider';
import { useClientServices } from '../../clients/hooks/useClientServices';
import { isClientSex } from '../../../data/domain/enums/clientSex';

export type VoiceClientContext = {
  readonly clientName: string;
  readonly categoryLabel: string;
  readonly sexLabel?: string;
};

export function useVoiceClientContext(clientId: string | undefined) {
  const clientServices = useClientServices();
  const t = useTranslation();
  const [context, setContext] = useState<VoiceClientContext | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientServices || !clientId) {
      setContext(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profile = await clientServices.getClientProfile(clientId);
      if (!profile) {
        setContext(null);
        return;
      }
      const client = profile.client;
      const displayName =
        client.preferredName?.trim() ||
        `${client.givenName} ${client.familyName}`.trim();
      const sexOptions = t.clients?.fields?.sexOptions;
      const sexLabel =
        client.sex && isClientSex(client.sex) && sexOptions
          ? sexOptions[client.sex]
          : undefined;
      setContext({
        clientName: displayName,
        categoryLabel: t.clients?.categories?.[client.category] ?? client.category,
        sexLabel,
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, clientServices, t.clients]);

  useEffect(() => {
    void load();
  }, [load]);

  return { context, loading, reload: load };
}
