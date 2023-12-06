'use client';

import { AnimatePresence, motion } from 'framer-motion';
import ButtonTooltip from './ButtonTooltip';
import { useEffect, useState } from 'react';
import ClickUpFormModal from './FeedbackModal';

const FeedbackButton = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowTooltip(false);
    }, 10000); // tooltip disappears after 10 seconds

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <ClickUpFormModal open={open} setOpen={setOpen} />
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ x: '25px', rotate: -60 }}
        transition={{ delay: 12 }}
        className="fixed bottom-16 right-10 z-50 h-[115px]"
      >
        <AnimatePresence>{showTooltip && <ButtonTooltip />}</AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute bottom-0 right-1.5 w-fit cursor-pointer rounded-full p-4 text-4xl text-white"
          onClick={() => setOpen(true)}
        >
          🤖
        </motion.button>
      </motion.div>
    </>
  );
};

export default FeedbackButton;
