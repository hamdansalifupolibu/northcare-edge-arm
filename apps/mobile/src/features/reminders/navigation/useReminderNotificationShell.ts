import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import type { LocalSessionEnvelope } from '../../auth/domain/sessionEnvelope';
import { isSafeReminderResponse } from '../domain/reminderDomain';
import type { ReminderServices } from '../application/createReminderServices';
import { useReminderServices } from '../hooks/useReminderServices';
import { isExpoGoNotificationRuntime } from '../scheduling/LocalNotificationScheduler';
import {
  clearPendingReminderOpen,
  consumePendingReminderOpen,
  peekPendingReminderOpen,
  setPendingReminderOpen,
  type PendingReminderOpen,
} from './pendingReminderOpenStore';

/**
 * F3b: wires local notification response → resolveNotificationTap → reminder details,
 * reconciles native schedules when a worker session is ready, and sets a privacy-safe
 * foreground presentation handler. No-ops in Expo Go (scheduler unavailable).
 */
export function useReminderNotificationShell(): void {
  const router = useRouter();
  const { authState, session, ready } = useAuthSession();
  const services = useReminderServices();
  const reconciledForAccount = useRef<string | null>(null);
  const handledResponseIds = useRef(new Set<string>());
  const [pendingEpoch, setPendingEpoch] = useState(0);

  useEffect(() => {
    if (!ready || isExpoGoNotificationRuntime()) {
      return;
    }

    let Notifications: typeof import('expo-notifications');
    try {
      // Lazy require — expo-notifications throws on import in Expo Go (SDK 53+).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Notifications = require('expo-notifications');
    } catch {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const handleResponse = (response: {
      notification: { request: { identifier: string; content: { data: unknown } } };
    }) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseIds.current.has(responseId)) {
        return;
      }
      handledResponseIds.current.add(responseId);

      const data = response.notification.request.content.data;
      if (!isSafeReminderResponse(data)) {
        return;
      }
      const pending: PendingReminderOpen = {
        version: 1,
        reminderId: data.reminderId,
        action: 'openReminder',
      };
      setPendingReminderOpen(pending);
      setPendingEpoch((value) => value + 1);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    return () => {
      sub.remove();
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !services || authState !== 'authenticated' || !session) {
      return;
    }
    if (session.role !== 'worker' || session.sessionState !== 'ready') {
      return;
    }

    const pending = peekPendingReminderOpen();
    if (!pending) {
      return;
    }

    void openPendingReminder({
      services,
      session,
      pending,
      router,
    });
  }, [ready, authState, session, services, router, pendingEpoch]);

  useEffect(() => {
    if (!ready || !services || authState !== 'authenticated' || !session) {
      return;
    }
    if (session.role !== 'worker' || session.sessionState !== 'ready') {
      return;
    }
    if (reconciledForAccount.current === session.accountId) {
      return;
    }
    reconciledForAccount.current = session.accountId;
    void services.reconcile(session.accountId).catch(() => {
      // Fail soft — in-app Reminder Centre remains source of truth offline.
      reconciledForAccount.current = null;
    });
  }, [ready, authState, session, services]);

  useEffect(() => {
    if (authState === 'signedOut') {
      clearPendingReminderOpen();
      reconciledForAccount.current = null;
    }
  }, [authState]);
}

async function openPendingReminder(input: {
  readonly services: ReminderServices;
  readonly session: LocalSessionEnvelope;
  readonly pending: PendingReminderOpen;
  readonly router: { push: (href: Href) => void };
}): Promise<void> {
  const result = await input.services.resolveNotificationTap({
    payload: input.pending,
    accountId: input.session.accountId,
    facilityId: input.session.facilityId,
    role: input.session.role,
    isUnlocked: true,
    isAuthenticated: true,
  });
  if (!result.ok) {
    if (
      result.reason === 'missing' ||
      result.reason === 'facilityScope' ||
      result.reason === 'invalidPayload' ||
      result.reason === 'roleDenied'
    ) {
      clearPendingReminderOpen();
    }
    return;
  }
  consumePendingReminderOpen();
  input.router.push(`/(worker)/more/reminders/${result.reminderId}` as Href);
}
