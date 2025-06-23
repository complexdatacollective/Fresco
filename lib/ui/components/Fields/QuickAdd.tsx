import { motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { InputComponentProps } from '~/lib/interviewer/containers/TanStackForm/types';
import {
  getNodeColor,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { Node } from '~/lib/ui/components';
import Icon from '../Icon';

const inputVariants = {
  show: {
    opacity: 1,
    x: '0px',
    width: '22rem',
    transition: {
      delay: 0.2,
    },
  },
  hide: {
    opacity: 0,
    x: '4rem',
    width: '22rem',
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
  const [isNodeClicked, setIsNodeClicked] = useState(false);
  const subject = useSelector(getStageSubject)!;

  const nodeColor = useSelector(getNodeColor(subject.type));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (meta?.invalid && meta?.error) {
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 820);
        } else if (!input.value) {
          // Close form
          input.onBlur?.();
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
    <div
      className={`flex flex-row items-center rounded-(--nc-border-radius) bg-(--nc-panel-bg-muted) px-6 py-4 ${shouldShake ? 'animate-shake' : ''}`}
    >
      <div className="relative flex items-center">
        <motion.div
          key="tool-tip"
          className="absolute -top-8 left-1/2 mb-4 h-8 -translate-x-1/2 transform whitespace-nowrap"
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
          className={`${meta?.invalid && meta?.touched && meta?.error ? 'mr-0' : 'mr-2'} ${meta?.invalid && meta?.touched && meta?.error ? 'rounded-t-(--nc-border-radius)' : 'rounded-(--nc-border-radius)'} bg-(--nc-input-background) px-6 py-4 text-lg font-bold text-(--nc-input-text) ${meta?.invalid && meta?.touched && meta?.error ? 'border-4 border-(--nc-error)' : ''}`}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => input.onChange(e.target.value)}
          onBlur={
            input.onBlur
              ? () => {
                  if (!isNodeClicked) {
                    input.onBlur();
                  }
                  setIsNodeClicked(false);
                }
              : undefined
          }
          placeholder={placeholder}
          value={input.value as string}
          type="text"
          onKeyDown={handleKeyDown}
        />
        {meta?.invalid && meta?.touched && meta?.error && (
          <div className="absolute -bottom-8 left-0 flex w-full items-start rounded-b-(--nc-border-radius) bg-(--nc-error) px-6 py-2 text-(--form-error-text)">
            <Icon name="warning" className="mr-2 max-h-5" />
            <span>{meta?.error}</span>
          </div>
        )}
      </div>

      <div onMouseDown={() => setIsNodeClicked(true)}>
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
    </div>
  );
};

export default memo(QuickAdd);
