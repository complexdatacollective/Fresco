import { InterviewsTable } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/InterviewsTable';

const InterviewPage = () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Interview management view</h2>
      <InterviewsTable />
    </div>
  );
};

export default InterviewPage;
