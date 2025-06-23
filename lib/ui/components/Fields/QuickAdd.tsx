import { motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { InputComponentProps } from '~/lib/interviewer/containers/TanStackForm/types';
import {
  getNodeColor,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { Node } from '~/lib/ui/components';

const inputVariants = {
  show: {
    opacity: 1,
    x: '0px',
    width: '25rem',
    transition: {
      delay: 0.2,
    },
  },
  hide: {
    opacity: 0,
    x: '4rem',
    width: '20rem',
  },
};

const QuickAdd = ({
  input,
  meta,
  disabled = false,
  autoFocus = true,
  parameters,
}: InputComponentProps) => {
  const placeholder =
    (parameters?.placeholder as string) ?? 'Type a label and press enter...';
  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const [showTooltip, setShowTooltip] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const subject = useSelector(getStageSubject)!;

  const nodeColor = useSelector(getNodeColor(subject.type));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (meta?.invalid && meta?.error) {
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 820);
        } else {
          input.onSubmit?.();
        }
      }
    },
    [input, meta?.invalid, meta?.error],
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
    <div className="flex flex-row items-center">
      <div className="relative flex items-center">
        <motion.div
          key="tool-tip"
          className="absolute -top-8 left-1/2 mb-4 h-8 -translate-x-1/2 transform whitespace-nowrap text-shadow-sm"
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
          className={`bg-input mr-2 rounded-full px-6 py-4 text-lg font-bold text-(--nc-text-dark) ${meta?.invalid && meta?.touched && meta?.error ? 'border-4 border-(--nc-error)' : ''} ${shouldShake ? 'animate-shake' : ''}`}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => input.onChange(e.target.value)}
          onBlur={input.onBlur ? () => input.onBlur() : undefined}
          placeholder={placeholder}
          value={input.value as string}
          type="text"
          onKeyDown={handleKeyDown}
        />
        {meta?.invalid && meta?.touched && meta?.error && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 transform whitespace-nowrap text-(--nc-error)">
            {meta?.error}
          </div>
        )}
      </div>

      <Node
        label={input.value as string}
        selected={!meta?.invalid && !!input?.value}
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
