import { motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getNodeColor,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { Node } from '~/lib/ui/components';

type QuickAddProps = {
  input: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
  };
  meta?: {
    error: string | null;
    invalid: boolean;
    touched: boolean;
  };
  disabled: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

const inputVariants = {
  show: {
    opacity: 1,
    x: '0px',
    width: 'calc(var(--open-width) - 15rem)',
    transition: {
      delay: 0.2,
    },
  },
  hide: {
    opacity: 0,
    x: '4rem',
    width: 'calc(var(--open-width) - 20rem)',
  },
};

const QuickAdd = ({
  input,
  meta,
  disabled,
  placeholder = 'Type a label and press enter...',
  autoFocus = true,
}: QuickAddProps) => {
  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const [showTooltip, setShowTooltip] = useState(false);
  const subject = useSelector(getStageSubject)!;

  const nodeColor = useSelector(getNodeColor(subject.type));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void input.onSubmit();
      }
    },
    [input],
  );

  // Handle showing/hiding the tooltip based on the nodeLabel
  // Logic: wait 5 seconds after the user last typed something
  useEffect(() => {
    if (input.value !== '' && !meta?.invalid) {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);

      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true);
      }, 5000);
    } else {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);
    }
  }, [input.value, meta?.invalid]);

  return (
    <div className="quick-add-container">
      <div className="quick-add-form">
        <motion.div
          key="tool-tip"
          className="tool-tip"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: showTooltip ? 1 : 0,
          }}
        >
          <span>Press enter to add...</span>
        </motion.div>
        <motion.input
          initial={inputVariants.hide}
          animate={inputVariants.show}
          exit={inputVariants.hide}
          className={`label-input ${meta?.invalid && meta?.touched && meta?.error ? 'error' : ''}`}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => input.onChange(e.target.value)}
          onBlur={input.onBlur}
          onFocus={input.onFocus}
          placeholder={placeholder}
          value={input.value}
          type="text"
          onKeyDown={handleKeyDown}
        />
        {meta?.invalid && meta?.touched && meta?.error && (
          <div className="error-text">{meta?.error}</div>
        )}
      </div>

      <Node
        label={input.value}
        selected={!meta?.invalid}
        color={nodeColor}
        handleClick={() => {
          if (input.value && !disabled) {
            input.onSubmit?.();
          }
        }}
      />
    </div>
  );
};

export default memo(QuickAdd);
