'use client';

import { useInterview } from '~/providers/InterviewProvider';
import { Button } from '~/components/ui/Button';

const InterviewNavigation = () => {
  const { nextPage, previousPage, hasNextPage, hasPreviousPage } =
    useInterview();

  console.log('InterviewNavigation', hasNextPage, hasPreviousPage);

  return (
    <div className="flex gap-10">
      <Button onClick={previousPage} disabled={!hasPreviousPage}>
        Previous Stage
      </Button>
      <Button onClick={nextPage} disabled={!hasNextPage}>
        Next Stage
      </Button>
    </div>
  );
};

export default InterviewNavigation;
