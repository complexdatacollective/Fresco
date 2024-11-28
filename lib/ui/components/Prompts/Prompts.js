import { findIndex } from 'lodash-es';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';
import Pips from './Pips';
import Prompt from './Prompt';

/**
 * Displays prompts
 */
const Prompts = (props) => {
  const { currentPromptId = 0, prompts, speakable = false } = props;

  const prevPromptRef = useRef();

  const currentIndex = findIndex(
    prompts,
    (prompt) => prompt.id === currentPromptId,
  );

  useEffect(() => {
    prevPromptRef.current = currentIndex;
  }, [currentPromptId, currentIndex]);

  const backwards = useMemo(
    () => currentIndex < prevPromptRef.current,
    [currentIndex],
  );

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { when: 'beforeChildren' } },
  };

  return (
    <motion.div className="prompts text-balance" variants={variants}>
      {prompts.length > 1 ? (
        <Pips count={prompts.length} currentIndex={currentIndex} />
      ) : (
        <div className="prompts__spacer" />
      )}
      <AnimatePresence custom={backwards} mode="wait" initial={false}>
        {prompts.map(
          ({ id, text }) =>
            prompts[currentIndex].id === id && (
              <Prompt
                key={id}
                id={id}
                text={text}
                backwards={backwards}
                speakable={speakable}
              />
            ),
        )}
      </AnimatePresence>
      <div className="prompts__spacer" />
    </motion.div>
  );
};

Prompts.propTypes = {
  prompts: PropTypes.any.isRequired,
  currentPromptId: PropTypes.string,
  speakable: PropTypes.bool,
};

export default Prompts;
