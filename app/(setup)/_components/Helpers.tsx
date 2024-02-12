import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export const StepLoadingState = () => (
  <motion.div
    className="flex h-full min-w-[30rem] items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Loader2 className="h-8 w-8 animate-spin" />
  </motion.div>
);
