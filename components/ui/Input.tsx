import * as React from 'react';
import { Label } from '~/components/ui/Label';
import { cx } from '~/utils/cva';

type InputProps = {
  inputClassName?: string;
  label?: string;
  hint?: React.ReactNode;
  id?: string;
  error?: string | null;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      type,
      label,
      hint,
      rightAdornment,
      leftAdornment,
      error,
      ...props
    },
    ref,
  ) => {
    const id = props.id ?? props.name;
    return (
      <div className={cx('relative mt-4 grid items-center gap-2', className)}>
        {label && (
          <Label htmlFor={id} required={props.required}>
            {label}
          </Label>
        )}
        {hint && (
          <span className="text-muted-contrast text-sm leading-5">{hint}</span>
        )}
        <div className="relative flex items-center justify-end">
          {leftAdornment && (
            <div className="absolute left-2">{leftAdornment}</div>
          )}
          <input
            id={id}
            type={type}
            className={cx(
              'focusable flex h-10 w-full rounded border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
              !!leftAdornment && 'pl-10',
              !!rightAdornment && 'pr-10',
              !!error && 'border-destructive',
              inputClassName,
            )}
            ref={ref}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-2">{rightAdornment}</div>
          )}
        </div>
        {error && (
          <span role="alert" className="text-destructive text-sm">
            {error}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
