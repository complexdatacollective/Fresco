'use client';

import { useInterview } from '~/providers/NetworkProvider';
import { Button } from '~/components/ui/Button';

const InterviewNavigation = () => {
  const { nextPage, previousPage, hasNextPage, hasPreviousPage } =
    useInterview();

  return (
    <div className="flex gap-10">
      <Button onClick={previousPage} disabled={!hasPreviousPage}>
        Previous Page
      </Button>
      <Button onClick={nextPage} disabled={!hasNextPage}>
        Next Page
      </Button>
    </div>
  );
};

export default InterviewNavigation;
