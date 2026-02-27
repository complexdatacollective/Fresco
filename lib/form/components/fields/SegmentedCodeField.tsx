import { useCallback, useEffect, useRef } from 'react';
import {
  controlVariants,
  inputControlVariants,
  interactiveStateVariants,
  stateVariants,
  textSizeVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

const segmentGroupVariants = cva({
  base: cx('flex items-center'),
  variants: {
    size: {
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2.5',
      xl: 'gap-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const segmentVariants = compose(
  controlVariants,
  inputControlVariants,
  textSizeVariants,
  stateVariants,
  interactiveStateVariants,
  cva({
    base: cx(
      'font-monospace aspect-square shrink-0 text-center caret-transparent',
      'focus-visible:focus-styles outline-current',
      'placeholder:text-input-contrast/30',
    ),
    variants: {
      size: {
        sm: 'size-10',
        md: 'size-12',
        lg: 'h-13 w-13',
        xl: 'size-14',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }),
);

const separatorVariants = cva({
  base: cx('text-input-contrast/30 font-bold select-none'),
  variants: {
    size: {
      sm: 'mx-0.5 text-sm',
      md: 'mx-1 text-base',
      lg: 'mx-1.5 text-lg',
      xl: 'mx-2 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type CharacterSet = 'numeric' | 'alphanumeric' | 'hex' | 'alpha';

const CHARACTER_SETS: Record<
  CharacterSet,
  {
    pattern: RegExp;
    inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  }
> = {
  numeric: { pattern: /[0-9]/, inputMode: 'numeric' },
  alphanumeric: { pattern: /[a-zA-Z0-9]/, inputMode: 'text' },
  hex: { pattern: /[0-9a-fA-F]/, inputMode: 'text' },
  alpha: { pattern: /[a-zA-Z]/, inputMode: 'text' },
};

type SegmentedCodeFieldProps = CreateFormFieldProps<
  string,
  'input',
  {
    segments: number;
    characterSet?: CharacterSet;
    size?: VariantProps<typeof textSizeVariants>['size'];
    separatorAfter?: number[];
    separatorChar?: string;
    onComplete?: (value: string) => void;
  }
>;

function SegmentedCodeField(props: SegmentedCodeFieldProps) {
  const {
    segments,
    characterSet = 'numeric',
    size = 'md',
    separatorAfter = [],
    separatorChar = '\u2013',
    onComplete,
    value = '',
    onChange,
    disabled,
    readOnly,
    className,
    onBlur,
    id,
    name: _name,
    ...rest
  } = props;

  // name is destructured to prevent it from being spread onto individual inputs
  void _name;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { pattern, inputMode } = CHARACTER_SETS[characterSet];

  const chars = value.split('').slice(0, segments);

  const focusSegment = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, segments - 1));
      inputRefs.current[clamped]?.focus();
    },
    [segments],
  );

  const updateValue = useCallback(
    (newChars: string[]) => {
      const newValue = newChars.join('');
      onChange?.(newValue);
    },
    [onChange],
  );

  useEffect(() => {
    if (value.length === segments && onComplete) {
      onComplete(value);
    }
  }, [value, segments, onComplete]);

  const handleInput = useCallback(
    (index: number, inputValue: string) => {
      if (disabled || readOnly) return;

      const validChars = inputValue.split('').filter((c) => pattern.test(c));

      if (validChars.length === 0) return;

      const newChars = [...chars];
      while (newChars.length < segments) newChars.push('');

      if (validChars.length === 1) {
        newChars[index] = validChars[0]!;
        updateValue(newChars);
        if (index < segments - 1) {
          focusSegment(index + 1);
        }
      } else {
        for (let i = 0; i < validChars.length && index + i < segments; i++) {
          newChars[index + i] = validChars[i]!;
        }
        updateValue(newChars);
        const nextIndex = Math.min(index + validChars.length, segments - 1);
        focusSegment(nextIndex);
      }
    },
    [chars, disabled, readOnly, pattern, segments, updateValue, focusSegment],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      const newChars = [...chars];
      while (newChars.length < segments) newChars.push('');

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (newChars[index]) {
          newChars[index] = '';
          updateValue(newChars);
        } else if (index > 0) {
          newChars[index - 1] = '';
          updateValue(newChars);
          focusSegment(index - 1);
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        newChars[index] = '';
        updateValue(newChars);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (index > 0) focusSegment(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index < segments - 1) focusSegment(index + 1);
      }
    },
    [chars, disabled, readOnly, segments, updateValue, focusSegment],
  );

  const handlePaste = useCallback(
    (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      e.preventDefault();

      const pasted = e.clipboardData.getData('text/plain').trim();
      const validChars = pasted.split('').filter((c) => pattern.test(c));

      if (validChars.length === 0) return;

      const startIndex = validChars.length >= segments ? 0 : index;
      const newChars = [...chars];
      while (newChars.length < segments) newChars.push('');

      for (let i = 0; i < validChars.length && startIndex + i < segments; i++) {
        newChars[startIndex + i] = validChars[i]!;
      }
      updateValue(newChars);

      const nextIndex = Math.min(startIndex + validChars.length, segments - 1);
      focusSegment(nextIndex);
    },
    [chars, disabled, readOnly, pattern, segments, updateValue, focusSegment],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  const state = getInputState(props);
  const separatorSet = new Set(separatorAfter);

  return (
    <div
      className={cx(segmentGroupVariants({ size }), className)}
      role="group"
      aria-label={rest['aria-describedby'] ? undefined : 'Code input'}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="contents">
          <input
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            id={i === 0 ? id : undefined}
            type="text"
            inputMode={inputMode}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            className={segmentVariants({ size, state })}
            value={chars[i] ?? ''}
            placeholder={'\u00B7'}
            disabled={disabled}
            readOnly={readOnly}
            aria-label={`Digit ${String(i + 1)} of ${String(segments)}`}
            aria-invalid={rest['aria-invalid']}
            aria-describedby={i === 0 ? rest['aria-describedby'] : undefined}
            aria-required={i === 0 ? rest['aria-required'] : undefined}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              handleInput(i, target.value);
              target.value = chars[i] ?? '';
            }}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={handleFocus}
            onBlur={(e) => {
              const relatedTarget = e.relatedTarget as HTMLElement | null;
              const isWithinGroup = e.currentTarget
                .closest('[role="group"]')
                ?.contains(relatedTarget);
              if (!isWithinGroup) {
                onBlur?.(e);
              }
            }}
          />
          {separatorSet.has(i) && (
            <span className={separatorVariants({ size })} aria-hidden="true">
              {separatorChar}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default SegmentedCodeField;
