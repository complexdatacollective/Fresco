import { Suspense } from 'react';

import InterviewCompleted from '~/app/(interview)/interview/_components/InterviewCompleted';

async function Completed({
  searchParams,
}: {
  searchParams: Promise<{ language?: string | string[] }>;
}) {
  const { language } = await searchParams;
  return (
    <InterviewCompleted
      language={typeof language === 'string' ? language : null}
    />
  );
}

export default function InterviewCompletedPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string | string[] }>;
}) {
  return (
    <Suspense fallback={null}>
      <Completed searchParams={searchParams} />
    </Suspense>
  );
}
