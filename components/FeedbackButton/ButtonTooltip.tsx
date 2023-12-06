import { motion } from 'framer-motion';

const ButtonTooltip = () => {
  return (
    <motion.p
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.5, delay: 1, ease: 'easeInOut' }}
      className="rounded-md bg-slate-200 px-3 py-2 text-base"
    >
      Click here to report bugs!
    </motion.p>
  );
};

export default ButtonTooltip;
