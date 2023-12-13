'use client';

import { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import { Button } from '../ui/Button';

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FeedbackModal open={open} setOpen={setOpen} />
      <Button
        variant="default"
        color="primary"
        size="sm"
        className="space-x-1 rounded-full"
        onClick={() => setOpen(true)}
      >
        <span>Provide Feedback</span> <span aria-hidden="true">&rarr;</span>
      </Button>
    </>
  );
};

export default FeedbackButton;
