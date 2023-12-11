/**
 * The interview/new route should create a new interview item in the database,
 * and then redirect to the interview/[id]/1 route.
 */

import { redirect } from 'next/navigation';
import { api } from '~/trpc/server';
import { faker } from '@faker-js/faker';
import { participantIdentifierSchema } from '~/shared/schemas';
import { ErrorMessage } from '~/app/(interview)/interview/_components/ErrorMessage';
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: {
    identifier?: string;
  };
}) {
  const activeProtocol = await api.protocol.active.get.query();

  if (!activeProtocol) {
    return (
      <ErrorMessage
        title="No Active Protocol"
        message="There is no active protocol for this account. Researchers may
      optionally mark an uploaded protocol as active from the protocols dashboard"
      />
    );
  }
  // check if anonymous recruitment is enabled
  let appSettings;
  try {
    appSettings = await api.appSettings.get.query();
  } catch (error) {
    throw new Error(error as string, { cause: error });
  }

  if (!appSettings || !appSettings.allowAnonymousRecruitment) {
    return (
      <ErrorMessage
        title="Anonymous Recruitment Disabled"
        message="Anonymous recruitment is disabled for this study. Reserachers may
      optionally enable anonymous recruitment from the dashboard"
      />
    );
  }

  // Anonymous recruitment is enabled

  // Use the identifier from the URL, or generate a new one
  const identifier = searchParams.identifier || faker.string.uuid();

  // Validate the identifier
  const isValid = participantIdentifierSchema.parse(identifier);

  if (!isValid) {
    return (
      <ErrorMessage
        title="Invalid Identifier"
        message="The identifier you entered is invalid. Please check the URL and try again"
      />
    );
  }

  // Create the interview
  const { createdInterview, error } =
    await api.interview.create.mutate(identifier);

  if (error || !createdInterview) {
    throw new Error(error || 'An error occurred while creating the interview', {
      cause: error,
    });
  }

  // Redirect to the interview/[id] route
  redirect(`/interview/${createdInterview.id}`);
}
