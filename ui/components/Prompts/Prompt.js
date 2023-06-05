import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import remark from 'remark';
import strip from 'strip-markdown';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion } from 'framer-motion';
import MarkdownLabel from '../Fields/MarkdownLabel';
import useSpeech from '../../hooks/useSpeech';
import useTimeout from '../../hooks/useTimeout';

// Words read per second (approximate). Used to calculate underline duration.
const WORDS_PER_SECOND = 0.30;

const variants = {
  enter: (backwards) => ({
    x: backwards ? '-25%' : '25%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (backwards) => ({
    x: backwards ? '25%' : '-25%',
    opacity: 0,
  }),
};

/**
  * Renders a single prompt.
  */
const Prompt = (props) => {
  const {
    id,
    text,
    backwards,
    speakable,
  } = props;
  const [animationDuration, setAnimationDuration] = useState(0);

  const rawText = useMemo(() => {
    if (!speakable) {
      return null;
    }

    const { contents } = remark().use(strip).processSync(text);

    const duration = contents.split(' ').length * WORDS_PER_SECOND;
    setAnimationDuration(duration);
    return contents;
  }, [text]);

  const {
    speak, stop, isSpeaking, error,
  } = useSpeech(rawText);

  // use timeout to allow mount animation to complete and synthesis engine to be ready.
  useTimeout(speak, 1000);

  useEffect(() => () => {
    if (stop) {
      stop();
    }
  }, []);

  const classes = cx(
    'prompt',
    {
      'prompt--speakable': speakable,
      'prompt--isSpeaking': isSpeaking,
    },
  );

  const getTitle = useMemo(() => {
    if (error) {
      return error;
    }

    if (!speakable) {
      return 'Text to speech is not enabled in this interview.';
    }

    return 'Click to hear this prompt again.';
  }, [error, speakable]);

  const handleTap = useCallback(() => {
    if (!speakable || error) { return; }

    if (isSpeaking) {
      stop();
      return;
    }

    speak();
  }, [speakable, isSpeaking, error]);

  return (
    <motion.div
      title={getTitle}
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
      style={{
        '--underline-duration': `${animationDuration}s`,
      }}
      onTap={handleTap}
    >
      <MarkdownLabel label={text} inline className="prompt__text" />
    </motion.div>
  );
};

Prompt.propTypes = {
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  backwards: PropTypes.bool,
  speakable: PropTypes.bool,
};

Prompt.defaultProps = {
  backwards: false,
  speakable: false,
};

export default Prompt;
