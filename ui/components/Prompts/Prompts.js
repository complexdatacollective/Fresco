import React, { useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { findIndex } from 'lodash';
import { AnimatePresence, motion } from 'framer-motion';
import Prompt from './Prompt';
import Pips from './Pips';

/**
  * Displays prompts
  */
const Prompts = (props) => {
  const {
    currentPrompt,
    prompts,
    speakable,
  } = props;

  const prevPromptRef = useRef();

  const currentIndex = findIndex(prompts, (prompt) => prompt.id === currentPrompt);

  useEffect(() => {
    prevPromptRef.current = currentIndex;
  }, [currentPrompt]);

  const backwards = useMemo(() => currentIndex < prevPromptRef.current, [currentIndex]);

  return (
    <motion.div
      className="prompts"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
      }}
    >
      { prompts.length > 1 ? (<Pips count={prompts.length} currentIndex={currentIndex} />) : (<div className="prompts__spacer" />)}
      <AnimatePresence custom={backwards} exitBeforeEnter initial={false}>
        { prompts.map(({
          id,
          text,
        }) => (prompts[currentIndex].id === id && (
          <Prompt
            key={id}
            id={id}
            text={text}
            backwards={backwards}
            speakable={speakable}
          />
        )))}
      </AnimatePresence>
      <div className="prompts__spacer" />
    </motion.div>
  );
};

Prompts.propTypes = {
  prompts: PropTypes.any.isRequired,
  currentPrompt: PropTypes.string.isRequired,
  speakable: PropTypes.bool,
};

Prompts.defaultProps = {
  speakable: false,
};

export default Prompts;
