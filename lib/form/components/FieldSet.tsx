import { type ReactNode } from 'react';

type FieldSetProps = {
  children: ReactNode | ((values: Record<string, unknown>) => ReactNode);
  className?: string;
};

export function FieldSet({ children, className }: FieldSetProps) {
  const content = typeof children === 'function' ? children({}) : children;

  return <fieldset className={className}>{content}</fieldset>;
}
