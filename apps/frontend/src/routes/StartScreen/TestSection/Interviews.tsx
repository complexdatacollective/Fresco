import { Spinner, InterviewCard } from '@codaco/ui';
import { trpcReact } from '@/utils/trpc/trpc';

const Interviews = () => {
  const {
    data: interviews,
    isLoading: isLoadingInterviews
  } = trpcReact.interviews.all.useQuery();

  console.log(interviews);

  return (
    <section
      style={{
        background: 'var(--color-kiwi)',
        padding: '1.2rem 3.6rem',
      }}
    >
      <h1>Interviews</h1>
      {isLoadingInterviews && <Spinner />}
      <ul>
        {interviews?.map((interview) => (
          <li key={interview.id}>
            <InterviewCard
              id="interview-card"
              startedAt={new Date()}
              updatedAt={new Date()}
              protocolName="Protocol Name"
              progress={10}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Interviews;
