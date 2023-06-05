"use client";

import { useInterview } from "~/contexts/NetworkProvider";
import Button from "~/ui/components/Button";

const InterviewNavigation = () => {
  const { nextPage, previousPage, hasNextPage, hasPreviousPage } =
    useInterview();

  return (
    <div>
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
