import React from 'react';
import { useFormValues } from '../hooks/useFormValues';

export type ConditionalFieldProps = {
  /**
   * The name of the field whose value determines if this field should be shown
   */
  dependsOn: string;
  /**
   * The condition function that determines if the field should be shown
   * @param value - The value of the field this depends on
   * @returns true if the field should be shown, false otherwise
   */
  showWhen: (value: unknown) => boolean;
  /**
   * The children to render when the condition is met
   */
  children: React.ReactNode;
};

/**
 * A component that conditionally renders form fields based on the value of another field
 */
export function ConditionalField({
  dependsOn,
  showWhen,
  children,
}: ConditionalFieldProps) {
  const dependentValue = useFormValues(dependsOn);

  if (!showWhen(dependentValue)) {
    return null;
  }

  return <>{children}</>;
}
