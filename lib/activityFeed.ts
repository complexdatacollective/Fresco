import { after } from 'next/server';
import 'server-only';

import type {
  Activity,
  ActivityType,
} from '~/app/dashboard/_components/ActivityFeed/types';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureEvent, flushPostHog } from '~/lib/posthog-server';

type NewActivity = {
  type: ActivityType;
  message: Activity['message'];
  properties?: Record<string, unknown>;
};

/**
 * Records activity in the dashboard feed and reports it to analytics.
 *
 * This is deliberately not a Server Action. It writes whatever type and
 * message it is handed, and it is called from unauthenticated participant
 * flows (starting and finishing an interview) and from login, before a session
 * exists — so it can be guarded by neither `requireApiAuth` nor a session
 * check. Exposing it as an action endpoint would let anyone forge feed
 * entries; keeping it server-only means the only callers are the ones in this
 * codebase, each of which has already established who is acting.
 *
 * Everything that has to happen within the caller's request is set up before
 * the first await. Almost every caller invokes this without awaiting it, so a
 * suspension point here means the enclosing action's response has already been
 * sent by the time the rest runs.
 */
async function recordActivity(activities: NewActivity[]) {
  if (activities.length === 0) {
    return { success: true, error: null };
  }

  // Started rather than awaited, so `after` below can adopt the same in-flight
  // write. Rejection is folded into the value: nothing awaits this promise
  // before `after` runs, and an unhandled rejection would take the process
  // down.
  const written = prisma.events
    .createMany({
      data: activities.map(({ type, message }) => ({ type, message })),
    })
    .then(
      () => true,
      () => false,
    );

  after(async () => {
    // Adopting the write is what keeps it supervised. Callers that do not
    // await this would otherwise have their response sent — and a serverless
    // container frozen — with the row still in flight.
    const stored = await written;

    // Analytics is reported either way. The activity happened; whether the
    // feed managed to record it is a separate question, and a database that
    // is refusing writes is precisely when the reports matter.
    if (!stored) {
      // eslint-disable-next-line no-console
      console.log('Failed to write activity feed entries');
    }

    for (const { type, properties } of activities) {
      await captureEvent(type, properties);
    }

    await flushPostHog();
  });

  if (!(await written)) {
    return { success: false, error: 'Failed to add event' };
  }

  // Meaningful only for callers that await this from a Server Action.
  // Elsewhere — route handlers, and the callers that do not await — the
  // request has moved on and `updateTag` is unavailable, which costs nothing
  // but a slightly later refresh of the feed.
  try {
    safeUpdateTag('activityFeed');
  } catch {
    // The row is written either way.
  }

  return { success: true, error: null };
}

export async function addEvent(
  type: ActivityType,
  message: Activity['message'],
  properties?: Record<string, unknown>,
) {
  return recordActivity([{ type, message, properties }]);
}

/**
 * Records several activities at once, for actions that operate on a selection
 * and describe each item separately in the feed.
 */
export async function addEvents(activities: NewActivity[]) {
  return recordActivity(activities);
}
