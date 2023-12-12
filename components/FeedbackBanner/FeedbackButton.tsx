'use client';

import { useState } from 'react';
import FeedbackModal from './FeedbackModal';

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FeedbackModal open={open} setOpen={setOpen} />
      <button
        className="flex-none rounded-full bg-gray-900 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        onClick={() => setOpen(true)}
      >
        Provide Feedback <span aria-hidden="true">&rarr;</span>
      </button>
    </>
  );
};

export default FeedbackButton;
