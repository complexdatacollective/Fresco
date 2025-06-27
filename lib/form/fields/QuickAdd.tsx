import { AnimatePresence, motion } from 'motion/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { InputComponentProps } from '~/lib/form/types';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import {
  getNodeColor,
  getNodeTypeLabel,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { ActionButton, Node } from '~/lib/ui/components';
import Icon from '~/lib/ui/components/Icon';

const inputVariants = {
  show: {
    opacity: 1,
    x: '0px',
    width: '22rem',
    transtion: {
      duration: 0.2,
    },
  },
  hide: {
    opacity: 0,
    x: '4rem',
    width: '22rem',
    transition: {
      duration: 0.2,
    },
  },
};

const buttonVariants = {
  show: {
    opacity: 1,
    x: '0px',
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
  hide: {
    opacity: 0,
    x: '10rem',
  },
};

const QuickAdd = ({
  input,
  meta,
  disabled = false,
  autoFocus = true,
  parameters,
}: InputComponentProps & { onShowForm?: () => void }) => {
  const [showForm, setShowForm] = useState(false);
  const placeholder =
    (parameters?.placeholder as string) ?? 'Type a label and press enter...';
  const onShowForm = parameters?.onShowForm as (() => void) | undefined;
  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const [showTooltip, setShowTooltip] = useState(false);
  const subject = useSelector(getStageSubject)!;
  const nodeColor = useSelector(getNodeColor(subject.type));
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const icon = useSelector(getNodeIconName);

  const handleShowForm = useCallback(() => {
    setShowForm(true);
    onShowForm?.();
  }, [onShowForm]);

  const handleHideForm = useCallback(() => {
    setShowForm(false);
    input.onBlur?.();
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // If no value, close the form
        if (!input.value) {
          handleHideForm();
          return;
        }

        // If valid, submit the form
        if (!meta?.invalid && !meta?.error) {
          input.onSubmit?.();
          setShowForm(false);
        }
      }
    },
    [input, meta?.invalid, meta?.error, handleHideForm],
  );

  // Close form when disabled
  useEffect(() => {
    if (disabled) {
      setShowForm(false);
    }
  }, [disabled]);

  // Handle showing/hiding the tooltip based on the nodeLabel
  // Logic: wait 5 seconds after the user last typed something
  useEffect(() => {
    if (showForm && input.value !== '' && !meta?.invalid) {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);

      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true);
      }, 5000);
    } else {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);
    }
  }, [showForm, input.value, meta?.invalid]);

  return (
    <div className="flex h-44 w-52 items-center justify-end">
      <AnimatePresence initial={false} mode="wait">
        {!showForm ? (
          <motion.div
            key="action-button"
            initial={buttonVariants.hide}
            animate={buttonVariants.show}
            exit={buttonVariants.hide}
            className="px-12 py-6"
          >
            <ActionButton
              disabled={disabled}
              onClick={handleShowForm}
              icon={icon}
              title={`Add ${nodeType}...`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="input-form"
            initial={inputVariants.hide}
            animate={inputVariants.show}
            exit={inputVariants.hide}
            className={`m-4 flex min-w-max flex-row items-center rounded-(--nc-border-radius) bg-(--nc-panel-bg-muted) px-6 py-4 ${meta?.invalid && meta?.error && 'animate-shake'}`}
          >
            <div className="relative flex items-center justify-start">
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
                className={` ${meta?.invalid && meta?.touched && meta?.error ? 'mr-0 rounded-t-(--nc-border-radius) border-4 border-(--nc-error)' : 'mr-2 rounded-(--nc-border-radius)'} bg-(--nc-input-background) px-6 py-4 text-lg font-bold text-(--nc-input-text)`}
                autoFocus={autoFocus}
                disabled={disabled}
                onChange={(e) => input.onChange(e.target.value)}
                onBlur={handleHideForm}
                placeholder={placeholder}
                value={input.value as string}
                type="text"
                onKeyDown={handleKeyDown}
                aria-label={placeholder}
                aria-invalid={meta?.invalid && meta?.touched}
                aria-describedby={
                  meta?.invalid && meta?.touched && meta?.error
                    ? 'error-message'
                    : undefined
                }
                role="textbox"
              />
              {meta?.invalid && meta?.touched && meta?.error && (
                <div
                  id="error-message"
                  className="absolute -bottom-8 left-0 flex w-full items-start rounded-b-(--nc-border-radius) bg-(--nc-error) py-2 text-(--form-error-text)"
                >
                  <Icon name="warning" className="mr-2 max-h-5" />
                  <span>{meta?.error}</span>
                </div>
              )}
            </div>

            <div>
              <Node
                label={input.value as string}
                selected={!meta?.invalid && !!input?.value}
                color={nodeColor}
                handleClick={() => {
                  if (
                    input.value &&
                    !disabled &&
                    (!meta?.invalid || !meta?.error)
                  ) {
                    input.onSubmit?.();
                    setShowForm(false);
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(QuickAdd);
