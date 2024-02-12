'use client';

import { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import { Button, type ButtonProps } from '../ui/Button';
import { MessageCircleMore } from 'lucide-react';

const FeedbackButton = (props: ButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FeedbackModal open={open} setOpen={setOpen} />
      <Button onClick={() => setOpen(true)} {...props}>
        <MessageCircleMore className="mr-2 h-4 w-4" />
        <span>Provide Feedback</span>
      </Button>
    </>
  );
};

export default FeedbackButton;
