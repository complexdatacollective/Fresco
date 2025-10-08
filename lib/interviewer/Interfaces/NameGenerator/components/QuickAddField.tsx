import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useField } from '~/lib/form';
import { type BaseFieldProps, type FieldConfig } from '~/lib/form/types';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import {
  getNodeColorSelector,
  getNodeTypeLabel,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { ActionButton } from '~/lib/ui/components';
import Icon from '~/lib/ui/components/Icon';
import { cx } from '~/utils/cva';

type QuickAddFieldProps = Omit<BaseFieldProps, 'label'> & {
  placeholder: string;
  disabled: boolean;
  onShowInput: () => void;
  validation: FieldConfig['validation'];
};

const inputVariants: Variants = {
  initial: {
    opacity: 0,
    x: '2rem',
  },
  animate: {
    opacity: 1,
    x: '0px',
  },
  exit: {
    opacity: 0,
    x: '2rem',
  },
};

const buttonVariants: Variants = {
  initial: {
    rotateY: 180,
  },
  animate: {
    rotateY: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export default function QuickAddField({
  placeholder,
  name: targetVariable,
  disabled,
  onShowInput,
  validation,
}: QuickAddFieldProps) {
  const [checked, setChecked] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { id, meta, fieldProps, containerProps } = useField({
    name: targetVariable,
    initialValue: '',
    validation,
  });

  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const subject = useSelector(getStageSubject);
  const nodeColor = useSelector(getNodeColorSelector);
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const icon = useSelector(getNodeIconName);

  // Close form when disabled
  useEffect(() => {
    if (disabled) {
      setChecked(false);
    }
  }, [disabled]);

  useEffect(() => {
    // If the state becomes invalid, cancel the tooltip
    if (!meta.isValid && tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
    }

    // If there's already a tooltip timer
    if (tooltipTimer.current) {
      return;
    }

    // Set a new timer: input is valid, the form is open, and there's no
    // existing timer
    tooltipTimer.current = setTimeout(() => {
      setShowTooltip(true);
    }, 5000);

    return () => {
      clearTimeout(tooltipTimer.current);
    };
  }, [fieldProps.value, meta.isValid]);

  const inputClasses = cx(
    'bg-(--nc-input-background) px-6 py-4 text-lg font-bold text-(--nc-input-text) mr-2 rounded-(--nc-border-radius) w-full',
    meta.shouldShowError &&
      'mr-0 rounded-t-(--nc-border-radius) border-4 border-(--nc-error)',
  );

  const buttonClasses = cx(
    'flex items-center justify-center',
    'h-[130px] w-[130px]',
    'perspective-dramatic',
    'backface-hidden',
  );

  const toggleId = `quick-add-toggle-${id}`;
  const inputId = `quick-add-input-${id}`;

  return (
    <motion.div
      layout
      className="flex flex-row-reverse items-center"
      {...containerProps}
    >
      {/* Semantic checkbox control: visually hidden but accessible */}
      <input
        type="checkbox"
        id={toggleId}
        className="sr-only"
        aria-controls={inputId}
        aria-expanded={checked}
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          if (e.target.checked) {
            onShowInput();
          }
        }}
        disabled={disabled}
      />

      <label htmlFor={toggleId} className="sr-only">
        Quick Add {nodeType}
      </label>

      <motion.div className="ml-6 w-[130px] basis-[130px]" layout>
        <AnimatePresence mode="popLayout">
          {!checked ? (
            <motion.div
              key="add-button"
              className={buttonClasses}
              onClick={() => {
                if (!disabled) {
                  setChecked(true);
                  onShowInput();
                }
              }}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="initial"
            >
              <ActionButton
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    setChecked(true);
                  }
                }}
                icon={icon}
                title={`Add ${nodeType}...`}
              />
            </motion.div>
          ) : (
            <motion.div
              key="node"
              className={buttonClasses}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="initial"
            >
              <SimpleNode
                label={(fieldProps.value as string | undefined) ?? ''}
                selected={meta.isValid && !!fieldProps.value}
                color={nodeColor}
                onClick={() => {
                  // submit the form
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div layout="size" className="flex w-[40ch] flex-col">
        <AnimatePresence>
          {showTooltip && checked && (
            <motion.div
              layout="position"
              key="tool-tip"
              className="absolute -top-8 left-1/2 mb-4 h-8 -translate-x-1/2 transform whitespace-nowrap"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
            >
              <span>Press enter to add...</span>
            </motion.div>
          )}
          {checked && (
            <motion.input
              layout="position"
              id={inputId}
              key="quick-add-input"
              className={inputClasses}
              autoFocus
              disabled={disabled}
              placeholder={placeholder}
              type="text"
              {...fieldProps}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setChecked(false);
                  // Move focus back to the toggle
                  const toggleElement = document.getElementById(toggleId);
                  if (toggleElement) {
                    toggleElement.focus();
                  }
                }
              }}
              value={fieldProps.value as string}
              variants={inputVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}
          {meta.shouldShowError && checked && (
            <motion.div
              layout="position"
              id="error-message"
              className="flex w-full items-start rounded-b-(--nc-border-radius) bg-(--nc-error) py-2 pr-4 text-(--form-error-text)"
            >
              <Icon name="warning" className="mr-2 max-h-5" />
              <span>
                {typeof meta.errors?.[0] === 'string'
                  ? meta.errors[0]
                  : meta.errors?.[0]?.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/**
 * Temporary component until we replace the current Node properly
 */
function SimpleNode({
  label,
  color,
  onClick,
  selected,
}: {
  label: string;
  color: string;
  onClick: () => void;
  selected: boolean;
}) {
  const nodeClasses = cx(
    'rounded-full w-[130px] h-[130px] transition-all',
    'bg-[linear-gradient(145deg,var(--bg)_50%,var(--bg-dark)_50%)]',
    'flex justify-center items-center',
    'text-base',
    selected && 'outline-5 outline-white/50',
  );

  return (
    <div
      className={nodeClasses}
      onClick={onClick}
      style={
        {
          '--bg': `var(--nc-${color})`,
          '--bg-dark': `var(--nc-${color}--dark)`,
        } as React.CSSProperties
      }
    >
      {label}
    </div>
  );
}
