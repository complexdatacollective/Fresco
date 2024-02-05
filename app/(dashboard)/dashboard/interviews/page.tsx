import { InterviewsTable } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/InterviewsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';

const InterviewPage = () => {
  return (
    <ResponsiveContainer>
      <h2 className="mb-6 text-2xl font-bold">Interview management view</h2>
      <InterviewsTable />
    </ResponsiveContainer>
  );
};

export default InterviewPage;
