import * as React from 'react';
import { cn } from '~/utils/shadcn';
import { Label } from '~/components/ui/Label';

export type InputProps = {
  label?: string;
  hint?: string;
  id?: string;
  error?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
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
      <div className={cn('relative grid items-center gap-1.5', className)}>
        {label && <Label htmlFor={id}>{label}</Label>}
        {hint && (
          <span className="mb-4 text-sm leading-5 text-muted-foreground">
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
              'text-input-foreground bg-input file:bg-transparent focus-visible:ring-ring rounded-input flex h-10 w-full border border-border px-3 py-2 text-sm ring-offset-background file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              leftAdornment && 'pl-10',
              rightAdornment && 'pr-10',
            )}
            ref={ref}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-2">{rightAdornment}</div>
          )}
        </div>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
