import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Prompts from './Prompts';

const CollapsablePrompts = React.memo((props) => {
  const { prompts, currentPromptIndex, interfaceRef } = props;
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
    if (minimized) {
      setMinimized(false);
    }
  }, [currentPromptIndex, minimized]);

  return (
    <motion.div
      ref={ref}
      className="sociogram-interface__prompts"
      drag
      dragConstraints={interfaceRef}
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
          <AlertTriangle />
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
            >
              <Prompts prompts={prompts} currentPrompt={currentPromptIndex} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});

CollapsablePrompts.displayName = 'CollapsablePrompts';

export default CollapsablePrompts;
