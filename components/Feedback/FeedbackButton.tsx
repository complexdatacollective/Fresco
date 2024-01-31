'use client';

import { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import { Button, type buttonVariants } from '../ui/Button';
import { MessageCircleMore } from 'lucide-react';

const FeedbackButton = (props: typeof buttonVariants) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FeedbackModal open={open} setOpen={setOpen} />
      <Button onClick={() => setOpen(true)} {...props}>
        <span>Provide Feedback</span>
        <MessageCircleMore size={16} className="ml-2" strokeWidth={3} />
      </Button>
    </>
  );
};

export default FeedbackButton;
