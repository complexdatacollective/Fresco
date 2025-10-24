import { Minus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import Prompts from './Prompts';

const CollapsablePrompts = (props) => {
  const { currentPromptIndex, dragConstraints, children } = props;
  const ref = useRef(null);
  const [minimized, setMinimized] = useState(false);

  const variants = {
    minimized: {
      height: 0,
      transition: {},
    },
    normal: {
      height: 'auto',
      transition: {
        when: 'afterChildren',
      },
    },
  };

  // Reset the minimization when the prompt changes
  useEffect(() => {
    setMinimized(false);
  }, [currentPromptIndex]);

  return (
    <MotionSurface
      ref={ref}
      className="border-primary absolute right-10 bottom-10 z-10 w-60 cursor-move overflow-hidden border-b-2 shadow-2xl"
      drag
      dragConstraints={dragConstraints}
      elevation="none"
    >
      <motion.div
        className="sociogram-interface__prompts__header"
        onTap={() => setMinimized(!minimized)}
      >
        {minimized ? (
          <motion.div
            role="button"
            aria-label="Tap to show the prompt"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
          >
            <strong>Tap to show the prompt</strong>
          </motion.div>
        ) : (
          <Minus className="cursor-pointer" size={28} />
        )}
      </motion.div>
      <motion.div
        animate={minimized ? 'minimized' : 'normal'}
        variants={variants}
      >
        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <Prompts />
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionSurface>
  );
};

export default CollapsablePrompts;
