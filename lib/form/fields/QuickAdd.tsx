import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useFieldContext } from '~/lib/form/utils/formContexts';
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
  disabled = false,
  autoFocus = true,
  parameters,
  onShowForm: onShowFormProp,
}: {
  disabled?: boolean;
  autoFocus?: boolean;
  parameters?: Record<string, unknown>;
  onShowForm?: () => void;
}) => {
  const fieldContext = useFieldContext();
  const [showForm, setShowForm] = useState(false);
  const placeholder =
    (parameters?.placeholder as string) ?? 'Type a label and press enter...';
  const onShowForm =
    onShowFormProp ?? (parameters?.onShowForm as (() => void) | undefined);
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

  const resetAndCloseForm = useCallback(() => {
    fieldContext.form.reset();
    setShowForm(false);
  }, [fieldContext]);

  const handleHideForm = useCallback(() => {
    resetAndCloseForm();
    fieldContext.handleBlur();
  }, [fieldContext, resetAndCloseForm]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // If no value, close the form
        if (!fieldContext.state.value) {
          handleHideForm();
          return;
        }

        // If valid, submit the form
        if (fieldContext.state.meta.isValid) {
          await fieldContext.form.handleSubmit();
          resetAndCloseForm();
        }
      }
    },
    [fieldContext, handleHideForm, resetAndCloseForm],
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
    if (
      showForm &&
      fieldContext.state.value !== '' &&
      !fieldContext.state.meta.isValid
    ) {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);

      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true);
      }, 5000);
    } else {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);
    }
  }, [showForm, fieldContext.state.value, fieldContext.state.meta.isValid]);

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
            className={`m-4 flex min-w-max flex-row items-center rounded-(--nc-border-radius) bg-(--nc-panel-bg-muted) px-6 py-4 ${!fieldContext.state.meta.isValid && fieldContext.state.meta.errors?.[0] && 'animate-shake'}`}
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
                className={` ${!fieldContext.state.meta.isValid && fieldContext.state.meta.isTouched && fieldContext.state.meta.errors?.[0] ? 'mr-0 rounded-t-(--nc-border-radius) border-4 border-(--nc-error)' : 'mr-2 rounded-(--nc-border-radius)'} bg-(--nc-input-background) px-6 py-4 text-lg font-bold text-(--nc-input-text)`}
                autoFocus={autoFocus}
                disabled={disabled}
                onChange={(e) => fieldContext.handleChange(e.target.value)}
                onBlur={handleHideForm}
                placeholder={placeholder}
                value={(fieldContext.state.value as string) || ''}
                type="text"
                onKeyDown={handleKeyDown}
                aria-label={placeholder}
                aria-invalid={
                  !fieldContext.state.meta.isValid &&
                  fieldContext.state.meta.isTouched
                }
                aria-describedby={
                  !fieldContext.state.meta.isValid &&
                  fieldContext.state.meta.isTouched &&
                  fieldContext.state.meta.errors?.[0]
                    ? 'error-message'
                    : undefined
                }
                role="textbox"
              />
              {!fieldContext.state.meta.isValid &&
                fieldContext.state.meta.isTouched &&
                fieldContext.state.meta.errors?.[0] && (
                  <div
                    id="error-message"
                    className="absolute top-full left-0 flex w-full items-start rounded-b-(--nc-border-radius) bg-(--nc-error) py-2 pr-4 text-(--form-error-text)"
                  >
                    <Icon name="warning" className="mr-2 max-h-5" />
                    <span>{fieldContext.state.meta.errors?.[0]}</span>
                  </div>
                )}
            </div>

            <div>
              <Node
                label={(fieldContext.state.value as string) || ''}
                selected={
                  fieldContext.state.meta.isValid && !!fieldContext.state.value
                }
                color={nodeColor}
                handleClick={async () => {
                  if (
                    fieldContext.state.value &&
                    !disabled &&
                    fieldContext.state.meta.isValid
                  ) {
                    await fieldContext.form.handleSubmit();
                    resetAndCloseForm();
                  } else {
                    handleHideForm();
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

export default QuickAdd;
