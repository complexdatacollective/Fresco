import { Suspense } from 'react';
import { InterviewsTable } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/InterviewsTable';

const InterviewPage = () => {
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold">Interview management view</h2>
      <Suspense fallback={<div>Loading interviews...</div>}>
        <InterviewsTable />
      </Suspense>
    </div>
  );
};

export default InterviewPage;
