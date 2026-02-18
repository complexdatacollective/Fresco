import { Toggle } from '@base-ui/react';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import {
  labelVariants,
  truncateNodeLabel,
  type NodeColorSequence,
} from '~/components/Node';
import Paragraph from '~/components/typography/Paragraph';
import Icon, { type InterviewerIconName } from '~/components/ui/Icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { type ValidationPropsCatalogue } from '~/lib/form/components/Field/types';
import InputField from '~/lib/form/components/fields/InputField';
import { useField } from '~/lib/form/hooks/useField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import { getNodeColorSelector } from '~/lib/interviewer/selectors/session';
import { cx } from '~/utils/cva';

function convertToNodeColor(color: NodeColorSequence): string {
  switch (color) {
    case 'node-color-seq-1':
      return 'node-1';
    case 'node-color-seq-2':
      return 'node-2';
    case 'node-color-seq-3':
      return 'node-3';
    case 'node-color-seq-4':
      return 'node-4';
    case 'node-color-seq-5':
      return 'node-5';
    case 'node-color-seq-6':
      return 'node-6';
    case 'node-color-seq-7':
      return 'node-7';
    case 'node-color-seq-8':
      return 'node-8';
    case 'custom':
      return 'node-custom';
    default:
      return color;
  }
}

const PARTICLE_COUNT = 50;
const PARTICLE_ANGLES = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2,
);

type QuickAddFieldProps = {
  name: string;
  placeholder: string;
  disabled: boolean;
  onShowInput: () => void;
} & Partial<ValidationPropsCatalogue>;

export default function QuickAddField({
  placeholder,
  name: targetVariable,
  disabled,
  onShowInput,
  ...validationProps
}: QuickAddFieldProps) {
  const [checked, setChecked] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  const { id, meta, fieldProps } = useField({
    name: targetVariable,
    initialValue: '',
    disabled,
    validateOnChange: true,
    validateOnChangeDelay: 0,
    ...validationProps,
  });

  const isFormSubmitting = useFormStore((state) => state.isSubmitting);
  const wasSubmittingRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const [toggleScope, animate] = useAnimate<HTMLButtonElement>();
  const particlesRef = useRef<(HTMLDivElement | null)[]>([]);

  const celebrate = useCallback(async () => {
    const button = toggleScope.current;
    if (!button) return;

    // Circle: shrink → elastic bounce-back
    const circle = button.querySelector('[data-toggle-circle]');
    if (circle) {
      void animate(
        circle,
        { scale: [0.6, 1] },
        { type: 'spring', stiffness: 500, damping: 8, mass: 0.8 },
      );
    }

    // Particles: burst outward and fade
    particlesRef.current.forEach((el, i) => {
      if (!el) return;
      const angle = PARTICLE_ANGLES[i];
      if (angle === undefined) return;
      const distance = 300 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const duration = 0.6 + Math.random() * 0.5;
      void animate(
        el,
        { x: [0, x], y: [0, y], opacity: [1, 0], scale: [1, 0] },
        { duration, ease: 'easeOut' },
      );
    });
  }, [animate, toggleScope]);

  // Reset field (but stay open) when form submission succeeds, or show
  // validation errors on failed submission attempts.
  useEffect(() => {
    // Detect transition from submitting to not submitting
    if (wasSubmittingRef.current && !isFormSubmitting) {
      if (meta.isValid && fieldProps.value) {
        fieldProps.onChange('');
        setSubmissionCount((c) => c + 1);
        setShowErrors(false);
        void celebrate();
      } else {
        setShowErrors(true);
      }
      inputRef.current?.focus();
    }
    wasSubmittingRef.current = isFormSubmitting;
  }, [isFormSubmitting, meta.isValid, fieldProps, celebrate]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      fieldProps.onChange(value);
    },
    [fieldProps],
  );

  const resetField = () => {
    setChecked(false);
    fieldProps.onChange('');
  };

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (toggleScope.current?.contains(e.relatedTarget)) {
        return;
      }
      resetField();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const showInput = () => {
    onShowInput();
    setChecked(true);
  };

  const nodeColor = useSelector(getNodeColorSelector);
  const icon = useSelector(getNodeIconName);

  // Close form when disabled
  useEffect(() => {
    if (disabled) {
      setChecked(false);
    }
  }, [disabled]);

  useEffect(() => {
    // Show a usage hint after 5s if the user hasn't pressed Enter yet.
    // Once the user has submitted successfully, they know the workflow.
    // Typing resets the timer.
    if (!checked || submissionCount > 0) {
      setShowTooltip(false);
      return;
    }

    setShowTooltip(false);

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [checked, submissionCount, fieldProps.value]);

  return (
    <motion.div className="relative flex items-center gap-4">
      <AnimatePresence>
        {checked && (
          <MotionSurface
            noContainer
            className="elevation-high bg-surface/80 w-sm rounded-xl backdrop-blur-md"
            initial={{ opacity: 0, x: '4rem' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '4rem' }}
          >
            <Tooltip open={showErrors && !!meta.errors?.length}>
              <TooltipTrigger render={<div className="w-full" />}>
                <Tooltip open={showTooltip && !showErrors}>
                  <TooltipTrigger render={<div className="w-full" />}>
                    <InputField
                      ref={inputRef}
                      type="text"
                      autoFocus
                      placeholder={placeholder}
                      id={id}
                      name={targetVariable}
                      {...fieldProps}
                      value={fieldProps.value as string}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    align="center"
                    className="max-w-2xs text-sm"
                    sideOffset={25}
                  >
                    Press <kbd>Enter</kbd> when you are finished. The box will
                    stay open so you can quickly enter multiple names in a row.
                  </TooltipContent>
                </Tooltip>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                className="bg-destructive text-destructive-contrast [&_svg_path]:fill-destructive max-w-2xs text-sm"
                sideOffset={10}
              >
                {meta.errors?.[0] && (
                  <Paragraph margin="none">{meta.errors[0]}</Paragraph>
                )}
              </TooltipContent>
            </Tooltip>
          </MotionSurface>
        )}
      </AnimatePresence>
      <Toggle
        pressed={checked}
        onPressedChange={(pressed) => {
          if (pressed) {
            showInput();
          } else {
            resetField();
          }
        }}
        disabled={disabled}
        render={
          <button
            ref={toggleScope}
            className="focusable relative aspect-square size-28 rounded-full"
          >
            {/* {PARTICLE_ANGLES.map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  particlesRef.current[i] = el;
                }}
                className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-1 -translate-1/2 rounded-full bg-white opacity-0"
              />
            ))} */}
            <motion.div
              data-toggle-circle
              className={cx(
                'elevation-high relative flex aspect-square size-28 items-center justify-center overflow-hidden rounded-full transition-[background-color,filter] duration-300 [&>.lucide]:aspect-square [&>.lucide]:h-16 [&>.lucide]:w-auto',
                disabled ? 'cursor-not-allowed saturate-0' : 'cursor-pointer',
              )}
              style={{
                backgroundColor: checked
                  ? `var(--${convertToNodeColor(nodeColor)})`
                  : 'var(--primary)',
              }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {checked ? (
                  <motion.div
                    key="check"
                    initial={{ y: '-100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%' }}
                    className="flex h-full items-center justify-center"
                  >
                    {fieldProps.value ? (
                      <span className={labelVariants()}>
                        {truncateNodeLabel(fieldProps.value as string)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="size-2.5 rounded-full bg-white"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="h-full"
                  >
                    <Icon
                      name={icon as InterviewerIconName}
                      className="h-full w-auto"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              className="bg-platinum text-charcoal absolute -top-2 -right-4 flex size-10 items-center justify-center rounded-full shadow-lg"
              animate={
                !checked || meta.isValid
                  ? { scale: 1, opacity: 1, rotate: 0 }
                  : { scale: 0, opacity: 0, rotate: 180 }
              }
            >
              <Plus className="size-6" size={12} />
            </motion.div>
          </button>
        }
      />
    </motion.div>
  );
}
