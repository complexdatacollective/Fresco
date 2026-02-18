import { Toggle } from '@base-ui/react';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import { type NodeColorSequence } from '~/components/Node';
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

  const { id, meta, fieldProps } = useField({
    name: targetVariable,
    initialValue: '',
    disabled,
    ...validationProps,
  });

  const isFormSubmitting = useFormStore((state) => state.isSubmitting);
  const wasSubmittingRef = useRef(false);

  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset field (but stay open) when form submission succeeds
  useEffect(() => {
    // Detect transition from submitting to not submitting
    if (wasSubmittingRef.current && !isFormSubmitting) {
      // If we were submitting and the field is now valid, submission succeeded
      if (meta.isValid && fieldProps.value) {
        fieldProps.onChange('');
        // Re-focus the input for quick successive additions
        inputRef.current?.focus();
      }
    }
    wasSubmittingRef.current = isFormSubmitting;
  }, [isFormSubmitting, meta.isValid, fieldProps]);

  const resetField = () => {
    setChecked(false);
    fieldProps.onChange('');
  };

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

  return (
    <motion.div className="flex items-center gap-4">
      <AnimatePresence>
        {checked && (
          <MotionSurface
            noContainer
            className="w-sm rounded-xl"
            initial={{ opacity: 0, x: '4rem' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '4rem' }}
          >
            <Tooltip open={showTooltip}>
              <TooltipTrigger disabled className="w-full">
                <InputField
                  ref={inputRef}
                  type="text"
                  autoFocus
                  placeholder={placeholder}
                  id={id}
                  name={targetVariable}
                  {...fieldProps}
                  value={fieldProps.value as string}
                  onChange={fieldProps.onChange}
                  onBlur={resetField}
                />
              </TooltipTrigger>
              <TooltipContent
                align="center"
                className="max-w-2xs text-sm"
                sideOffset={25}
              >
                Enter a name and press <kbd>Enter</kbd>. The box will stay open
                so you can quickly enter multiple names in a row.
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
          <button className="focusable aspect-square size-28 rounded-full">
            <motion.div
              className="elevation-high relative flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-full [&>.lucide]:aspect-square [&>.lucide]:h-16 [&>.lucide]:w-auto"
              animate={
                checked
                  ? {
                      backgroundColor: `var(--${convertToNodeColor(nodeColor)})`,
                    }
                  : { backgroundColor: 'var(--primary)' }
              }
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {checked ? (
                  <motion.div
                    key="check"
                    initial={{ y: '-100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%' }}
                  >
                    {fieldProps.value ? (
                      <span>{fieldProps.value as string}</span>
                    ) : (
                      <Plus className="size-6 text-white" size={12} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                  >
                    <Icon name={icon as InterviewerIconName} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              className="bg-platinum text-charcoal absolute -top-2 -right-4 flex size-10 items-center justify-center rounded-full shadow-lg"
              animate={
                checked && !fieldProps.value
                  ? { scale: 0, opacity: 0, rotate: 180 }
                  : { scale: 1, opacity: 1, rotate: 0 }
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
