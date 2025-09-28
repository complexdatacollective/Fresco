import { Prompt as TPrompt } from '@codaco/protocol-validation';
import { findIndex } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import Pips from './Pips';
import Prompt from './Prompt';

type PromptsProps = {
  prompts: TPrompt[];
  currentPromptId?: string;
  speakable?: boolean;
};

/**
 * Displays prompts
 */
const Prompts = ({
  currentPromptId = '0',
  prompts,
  speakable = false,
}: PromptsProps) => {
  const prevPromptRef = useRef<number>();

  const currentIndex = findIndex(
    prompts,
    (prompt) => prompt.id === currentPromptId,
  );

  useEffect(() => {
    prevPromptRef.current = currentIndex;
  }, [currentPromptId, currentIndex]);

  const backwards = useMemo(
    () => currentIndex < (prevPromptRef.current ?? 0),
    [currentIndex],
  );

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { when: 'beforeChildren' as const } },
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
            currentIndex >= 0 &&
            prompts[currentIndex]?.id === id && (
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

export default Prompts;
