import { api } from '~/trpc/server';
import InterviewShell from '../_components/InterviewShell';
import NoSSRWrapper from '~/utils/NoSSRWrapper';

export default function Page({ params }: { params: { interviewId: string } }) {
  const { interviewId } = params;

  if (!interviewId) {
    return 'No interview id found';
  }

  return (
    <div className="flex h-[100vh] max-h-[100vh] flex-col bg-[var(--nc-background)] text-[var(--nc-text)]">
      <NoSSRWrapper>
        <InterviewShell interviewID={interviewId} />
      </NoSSRWrapper>
    </div>
  );
}
