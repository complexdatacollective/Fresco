'use client';

import { MessageCircleMore } from 'lucide-react';
import { useState } from 'react';
import { Button, type ButtonProps } from '../ui/Button';
import FeedbackModal from './FeedbackModal';

const FeedbackButton = (props: ButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FeedbackModal open={open} setOpen={setOpen} />
      <Button
        onClick={() => setOpen(true)}
        {...props}
        data-testid="feedback-button"
      >
        <MessageCircleMore className="mr-2 h-4 w-4" />
        <span>Provide Feedback</span>
      </Button>
    </>
  );
};

export default FeedbackButton;
