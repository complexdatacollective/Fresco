import { motion } from 'motion/react';

const container = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delay: 0.15,
      when: 'beforeChildren' as const,
    },
  },
};

const item = {
  initial: { opacity: 0, y: '-200%' },
  animate: { opacity: 1, y: 0 },
};

type PipsProps = {
  large?: boolean;
  count?: number;
  currentIndex?: number;
};

/**
 * Renders a set of pips indicating the current `Prompt`.
 */
const Pips = ({ large = false, count = 0, currentIndex = 0 }: PipsProps) => {
  const className = `pips ${large ? 'pips--large' : ''}`;

  return (
    <motion.div className={className} variants={container}>
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={index}
          className={`pips__pip ${
            index === currentIndex ? 'pips__pip--active' : ''
          }`}
          variants={item}
        />
      ))}
    </motion.div>
  );
};

export default Pips;
