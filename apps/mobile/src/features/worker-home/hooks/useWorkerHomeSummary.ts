import { useEffect, useRef, useState } from 'react';

import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useCommunityRequestServices } from '../../community-requests/hooks/useCommunityRequestServices';
import { partitionReferralInbox } from '../../referrals/domain/referralInbox';
import { useReferralServices } from '../../referrals/hooks/useReferralServices';
import type { FollowUpReminder } from '../../reminders/domain/reminderDomain';
import { useReminderServices } from '../../reminders/hooks/useReminderServices';
import { isSameLocalCalendarDay } from '../domain/dateHelpers';

export type WorkerHomeTodayStats = {
  readonly clientsSeen: number;
  readonly assessmentsCompleted: number;
  readonly referralsCreated: number;
};

export type WorkerHomeSummary = {
  readonly upcomingReminders: number;
  readonly overdueReminders: number;
  readonly nextReminders: readonly FollowUpReminder[];
  readonly awaitingRequests: number | null;
  readonly emergencyRequests: number | null;
  readonly communityAvailable: boolean;
  readonly pendingSync: number;
  readonly openReferrals: number;
  readonly today: WorkerHomeTodayStats;
  readonly loading: boolean;
};

const EMPTY_TODAY: WorkerHomeTodayStats = {
  clientsSeen: 0,
  assessmentsCompleted: 0,
  referralsCreated: 0,
};

const EMPTY: WorkerHomeSummary = {
  upcomingReminders: 0,
  overdueReminders: 0,
  nextReminders: [],
  awaitingRequests: null,
  emergencyRequests: null,
  communityAvailable: false,
  pendingSync: 0,
  openReferrals: 0,
  today: EMPTY_TODAY,
  loading: true,
};

function isActiveReminder(reminder: FollowUpReminder): boolean {
  return (
    reminder.status !== 'handled' &&
    reminder.status !== 'cancelled' &&
    reminder.status !== 'expired'
  );
}

export function useWorkerHomeSummary() {
  const { session, authState } = useAuthSession();
  const reminderServices = useReminderServices();
  const communityServices = useCommunityRequestServices();
  const referralServices = useReferralServices();
  const { countPendingSyncItems, repositories } = useDatabase();
  const [summary, setSummary] = useState<WorkerHomeSummary>(EMPTY);

  const reminderServicesRef = useRef(reminderServices);
  const communityServicesRef = useRef(communityServices);
  const referralServicesRef = useRef(referralServices);
  const countPendingSyncItemsRef = useRef(countPendingSyncItems);
  const repositoriesRef = useRef(repositories);
  reminderServicesRef.current = reminderServices;
  communityServicesRef.current = communityServices;
  referralServicesRef.current = referralServices;
  countPendingSyncItemsRef.current = countPendingSyncItems;
  repositoriesRef.current = repositories;

  const accountId = session?.accountId;
  const facilityId = session?.facilityId;

  useEffect(() => {
    if (!accountId || authState !== 'authenticated') {
      setSummary({ ...EMPTY, loading: false });
      return;
    }

    let cancelled = false;
    setSummary((prev) => ({ ...prev, loading: true }));

    void (async () => {
      const now = new Date();
      try {
        let upcomingReminders = 0;
        let overdueReminders = 0;
        let nextReminders: FollowUpReminder[] = [];
        let awaitingRequests: number | null = null;
        let emergencyRequests: number | null = null;
        let communityAvailable = false;
        let pendingSync = 0;
        let openReferrals = 0;
        let today: WorkerHomeTodayStats = EMPTY_TODAY;

        const services = reminderServicesRef.current;
        if (services) {
          const reminders = await services.listForCentre(accountId);
          const active = reminders.filter(isActiveReminder);
          for (const reminder of active) {
            const due = new Date(reminder.scheduledForUtc);
            if (due <= now) {
              overdueReminders += 1;
            } else {
              upcomingReminders += 1;
            }
          }
          nextReminders = active
            .filter((r) => new Date(r.scheduledForUtc) > now)
            .sort(
              (a, b) =>
                new Date(a.scheduledForUtc).getTime() - new Date(b.scheduledForUtc).getTime(),
            )
            .slice(0, 2);
        }

        pendingSync = await countPendingSyncItemsRef.current();

        const referralSvc = referralServicesRef.current;
        if (referralSvc) {
          const referrals = await referralSvc.listReferrals();
          openReferrals = partitionReferralInbox(referrals).open.length;
          today = {
            ...today,
            referralsCreated: referrals.filter((referral) =>
              isSameLocalCalendarDay(referral.createdAt, now),
            ).length,
          };
        }

        const repos = repositoriesRef.current;
        if (repos && facilityId) {
          const [clients, assessments] = await Promise.all([
            repos.clients.listByFacility(facilityId),
            repos.nutritionAssessments.listRecent(100),
          ]);
          today = {
            ...today,
            clientsSeen: clients.filter((client) =>
              isSameLocalCalendarDay(client.updatedAt, now),
            ).length,
            assessmentsCompleted: assessments.filter(
              (assessment) =>
                assessment.completedAt != null &&
                isSameLocalCalendarDay(assessment.completedAt, now),
            ).length,
          };
        }

        try {
          const community = communityServicesRef.current;
          const [awaiting, emergency] = await Promise.all([
            community.listCommunityRequests('awaiting'),
            community.listCommunityRequests('emergency'),
          ]);
          awaitingRequests = awaiting.items.length;
          emergencyRequests = emergency.items.length;
          communityAvailable = true;
        } catch {
          communityAvailable = false;
        }

        if (!cancelled) {
          setSummary({
            upcomingReminders,
            overdueReminders,
            nextReminders,
            awaitingRequests,
            emergencyRequests,
            communityAvailable,
            pendingSync,
            openReferrals,
            today,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setSummary((prev) => ({ ...prev, loading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, authState, facilityId]);

  return { summary };
}
