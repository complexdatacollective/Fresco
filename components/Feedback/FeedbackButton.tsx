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
        <span>Provide Feedback</span>
        <MessageCircleMore size={16} className="ml-2" strokeWidth={3} />
      </Button>
    </>
  );
};

export default FeedbackButton;
