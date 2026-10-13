import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { after, connection } from 'next/server';
import { Suspense } from 'react';
import SuperJSON from 'superjson';

import { defineMessages } from '@codaco/app-i18n/messages';
import Spinner from '@codaco/fresco-ui/Spinner';
import { loadInterviewCatalog } from '@codaco/interview/catalog';
import { type ActivityType } from '~/app/dashboard/_components/ActivityFeed/types';
import type { ActivityLocalization } from '~/i18n/activityDetails';
import { getFrescoI18nInitialization, getServerIntl } from '~/i18n/server';
import { getAdmittedSession } from '~/lib/auth/guards';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import {
  captureEvent,
  captureException,
  flushPostHog,
} from '~/lib/posthog-server';
import { getAppSetting, getDisableAnalytics } from '~/queries/appSettings';
import {
  getInterviewById,
  type GetInterviewByIdQuery,
} from '~/queries/interviews';

import { ErrorMessage } from '../_components/ErrorMessage';
import InterviewClient from './InterviewClient';
import { mapInterviewPayload } from './mapInterviewPayload';

export default function Page(props: {
  params: Promise<{ interviewId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <InterviewContent params={props.params} />
    </Suspense>
  );
}

async function InterviewContent({
  params: paramsPromise,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  await connection();
  const { interviewId } = await paramsPromise;

  if (!interviewId) {
    return 'No interview id found';
  }

  const rawInterview = await getInterviewById(interviewId);

  if (!rawInterview) {
    notFound();
  }

  const interview =
    SuperJSON.parse<NonNullable<GetInterviewByIdQuery>>(rawInterview);
  // A session still held at the mandatory two-factor gate is not a
  // researcher yet, and gets the participant treatment below.
  const session = await getAdmittedSession();

  const limitInterviews = await getAppSetting('limitInterviews');

  // The completion cookie is a per-browser participant guard. Authenticated
  // users (e.g. an admin opening an interview from the dashboard) must not be
  // locked out of every interview for a protocol they previously completed a
  // test interview for in this browser.
  if (
    !session &&
    limitInterviews &&
    (await cookies()).get(interview.protocol.id)
  ) {
    redirect('/interview/finished');
  }

  if (!session && interview?.finishTime) {
    redirect('/interview/finished');
  }

  const mapped = mapInterviewPayload(interview);

  if (!mapped.success) {
    // Starting anyway would hand the client a network built without the stored
    // one, which its first sync would replace, or run it against an empty
    // design. The report carries no interview id: the id is the participant's
    // access link, and the report leaves the deployment.
    after(async () => {
      await captureException(mapped.error, {
        context:
          mapped.unreadable === 'protocol'
            ? 'interview.load.protocolUnreadable'
            : 'interview.load.unreadable',
      });
      await flushPostHog();
    });

    const intl = await getServerIntl();
    return (
      <ErrorMessage
        title={intl.formatMessage(messages.unopenableTitle)}
        message={intl.formatMessage(
          mapped.unreadable === 'protocol'
            ? messages.protocolUnreadable
            : messages.answersUnreadable,
        )}
      />
    );
  }

  // Recorded only once the interview can actually be opened: a refusal above
  // must not leave an activity entry claiming it was.
  after(async () => {
    try {
      const message = session
        ? `Interview "${interviewId}" was opened by user "${session.user.username}"`
        : `Interview "${interviewId}" was opened`;

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const recentEvent = await prisma.events.findFirst({
        where: {
          type: 'Interview Opened',
          message,
          timestamp: { gte: thirtyMinutesAgo },
        },
      });

      if (recentEvent) return;

      await prisma.events.create({
        data: {
          type: 'Interview Opened' satisfies ActivityType,
          message,
          localization: {
            kind: 'interviewOpened',
            values: {
              actor: session ? 'researcher' : 'participant',
              interview: interviewId,
              username: session?.user.username ?? '',
            },
          } satisfies ActivityLocalization,
        },
      });

      safeRevalidateTag('activityFeed');

      // The analytics copy of this event carries only who opened it. The feed
      // message above names the interview, and an interview id is the
      // participant's access link, so it must not leave the deployment.
      await captureEvent('Interview Opened', {
        actor: session ? 'researcher' : 'participant',
      });
      await flushPostHog();
    } catch {
      // Non-critical — don't block the interview
    }
  });

  const { payload, assetUrls, initialStep, initialSyncRevision } = mapped;

  const installationId = (await getAppSetting('installationId')) ?? 'unknown';
  // Use the same helper as the rest of the app, so a DISABLE_ANALYTICS
  // environment override also opts the interview runtime out of telemetry.
  const disableAnalytics = (await getDisableAnalytics()) ?? false;
  // The interview's own messages, in the language its Shell will negotiate
  // from Fresco's, travel with the page: otherwise hydration waits on a
  // separate download before the participant sees anything.
  const { locale } = await getFrescoI18nInitialization();
  const catalog = await loadInterviewCatalog(locale);

  return (
    <InterviewClient
      payload={payload}
      assetUrls={assetUrls}
      initialStep={initialStep}
      initialSyncRevision={initialSyncRevision}
      installationId={installationId}
      disableAnalytics={disableAnalytics}
      catalog={catalog}
    />
  );
}

const messages = defineMessages({
  answersUnreadable: {
    id: 'fresco.participantPages.unopenableInterview.answersUnreadable',
    defaultMessage:
      'The answers saved for this interview could not be read, so it has not been started. Nothing has been changed. Please contact the person who recruited you to this study for assistance.',
    description:
      'Participant-facing explanation when the answers stored for an interview cannot be read, so the interview is refused rather than restarted empty.',
  },

  protocolUnreadable: {
    id: 'fresco.participantPages.unopenableInterview.protocolUnreadable',
    defaultMessage:
      'This interview could not be loaded, so it has not been started. Nothing has been changed. Please contact the person who recruited you to this study for assistance.',
    description:
      'Participant-facing explanation when the study design behind an interview cannot be read, so the interview is refused.',
  },

  unopenableTitle: {
    id: 'fresco.participantPages.unopenableInterview.title',
    defaultMessage: 'This interview could not be opened',
    description:
      'Participant-facing heading when an interview is refused because its stored data cannot be read.',
  },
});
