import { motion } from 'motion/react';
import React, { memo } from 'react';

type QuickAddProps = {
  input: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  };
  meta?: {
    error: string | null;
    invalid: boolean;
    touched: boolean;
  };
  targetVariable: string;
  disabled: boolean;
  onSubmit: () => void;
  showTooltip: boolean;
  tooltipText: string;
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
  onSubmit,
  showTooltip,
  tooltipText,
  placeholder = 'Type a label and press enter...',
  autoFocus = true,
}: QuickAddProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
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
        <span>{tooltipText}</span>
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
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        value={input.value}
        type="text"
      />
      {meta?.invalid && meta?.touched && meta?.error && (
        <motion.div
          key="error-message"
          className="form-field-text__error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span>{meta.error}</span>
        </motion.div>
      )}
    </>
  );
};

export default memo(QuickAdd);
