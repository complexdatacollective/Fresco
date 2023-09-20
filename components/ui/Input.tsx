import * as React from 'react';
import { cn } from '~/utils/shadcn';
import { Label } from '~/components/ui/Label';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  id?: string;
  error?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

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
    const id = props.id || props.name;
    return (
      <div className="relative grid w-full items-center gap-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        {hint && (
          <span className="mb-4 text-sm leading-5 text-muted-foreground">
            {hint}
          </span>
        )}
        <div className="relative flex w-full items-center justify-end">
          {leftAdornment && (
            <div className="absolute left-2">{leftAdornment}</div>
          )}
          <input
            id={id}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              leftAdornment && 'pl-10',
              rightAdornment && 'pr-10',
              className,
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
