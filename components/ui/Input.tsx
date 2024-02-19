import * as React from 'react';
import { cn } from '~/utils/shadcn';
import { Label } from '~/components/ui/Label';

export type InputProps = {
  inputClassName?: string;
  label?: string;
  hint?: React.ReactNode;
  id?: string;
  error?: string;
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
      <div className={cn('relative mt-4 grid items-center gap-2', className)}>
        {label && (
          <Label htmlFor={id} required={props.required}>
            {label}
          </Label>
        )}
        {hint && (
          <span className="text-sm leading-5 text-muted-foreground">
            {hint}
          </span>
        )}
        <div className="relative flex items-center justify-end">
          {leftAdornment && (
            <div className="absolute left-2">{leftAdornment}</div>
          )}
          <input
            id={id}
            type={type}
            className={cn(
              'focus-visible:ring-ring flex h-10 w-full rounded-input border border-border bg-input px-3 py-2 text-sm text-input-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              leftAdornment && 'pl-10',
              rightAdornment && 'pr-10',
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
          <span role="alert" className="text-sm text-destructive">
            {error}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
