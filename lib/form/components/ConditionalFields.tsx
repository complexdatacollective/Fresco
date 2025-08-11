import { type ReactNode } from 'react';
import { useFormValue } from '../hooks/useFormValue';

type ConditionalFieldsProps = {
  watch: string | string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: (values: any) => boolean;
  children: ReactNode;
};

export function ConditionalFields({
  watch,
  condition,
  children,
}: ConditionalFieldsProps) {
  const values = useFormValue(watch);

  if (!values || !condition(values)) {
    return null;
  }

  return <>{children}</>;
}
