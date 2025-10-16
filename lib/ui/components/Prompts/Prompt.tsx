import cx from 'classnames';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { remark } from 'remark';
import strip from 'strip-markdown';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import useSpeech from '../../hooks/useSpeech';
import useTimeout from '../../hooks/useTimeout';
import MarkdownLabel from '../Fields/MarkdownLabel';

// Words read per second (approximate). Used to calculate underline duration.
const WORDS_PER_SECOND = 0.3;

const variants = {
  enter: (backwards: boolean) => ({
    x: backwards ? '-25%' : '25%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (backwards: boolean) => ({
    x: backwards ? '25%' : '-25%',
    opacity: 0,
  }),
};

type PromptProps = {
  id: string;
  text: string;
  backwards?: boolean;
  speakable?: boolean;
};

/**
 * Renders a single prompt.
 */
const Prompt = ({
  id,
  text,
  backwards = false,
  speakable = false,
}: PromptProps) => {
  const [animationDuration, setAnimationDuration] = useState(0);

  const rawText = useMemo(() => {
    if (!speakable) {
      return null;
    }

    const result = remark().use(strip).processSync(text);
    const contents = String(result);

    const duration = contents.split(' ').length * WORDS_PER_SECOND;
    setAnimationDuration(duration);
    return contents;
  }, [text, speakable]);

  const { speak, stop, isSpeaking, error } = useSpeech(rawText);

  // use timeout to allow mount animation to complete and synthesis engine to be ready.
  useTimeout(speak, 1000);

  useEffect(
    () => () => {
      if (stop) {
        stop();
      }
    },
    [stop],
  );

  const classes = cx('prompt', {
    'prompt--speakable': speakable,
    'prompt--isSpeaking': isSpeaking,
  });

  const handleTap = useCallback(() => {
    if (!speakable || error) {
      return;
    }

    if (isSpeaking) {
      stop();
      return;
    }

    speak();
  }, [speakable, isSpeaking, error, speak, stop]);

  return (
    <motion.div
      title={text}
      key={id}
      custom={backwards}
      variants={variants}
      className={classes}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 600, damping: 35 },
        opacity: { duration: 0.2 },
      }}
      style={
        {
          '--underline-duration': `${animationDuration}s`,
        } as React.CSSProperties
      }
      onTap={handleTap}
    >
      <MarkdownLabel label={text} inline className="prompt__text" />
    </motion.div>
  );
};

export default withNoSSRWrapper(Prompt);
