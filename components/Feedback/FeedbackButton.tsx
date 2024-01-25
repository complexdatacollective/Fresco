'use client';

import { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import { Button } from '../ui/Button';
import { MessageCircleMore } from 'lucide-react';

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FeedbackModal open={open} setOpen={setOpen} />
      <Button color="primary" size="sm" onClick={() => setOpen(true)}>
        <span>Provide Feedback</span>
        <MessageCircleMore size={16} className="ml-2" strokeWidth={3} />
      </Button>
    </>
  );
};

export default FeedbackButton;
