import { Field as BaseField } from '@base-ui-components/react/field';
import { Select } from '@base-ui-components/react/select';
import React from 'react';
import { cn } from '~/utils/shadcn';

type BaseFieldProps = {
  meta: {
    label: string;
    hint?: string;
    isValid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValidating?: boolean;
    error?: string;
  };
  onChange: (value: string) => void;
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function SelectField({
  name,
  meta: { isValid, isTouched, error, label, hint },
  onChange,
  options,
  placeholder = 'Select an option...',
  value,
}: BaseFieldProps) {
  const triggerClasses = cn(
    'w-full rounded border border-border bg-background px-3 py-2 text-left flex items-center justify-between',
    !isValid && isTouched && 'border-destructive',
    isValid && 'border-success',
  );

  // Create items array with placeholder
  const items = [{ label: placeholder, value: '' }, ...options];

  return (
    <BaseField.Root
      invalid={!isValid}
      name={name}
      className="flex flex-col gap-2"
    >
      <BaseField.Label className="text-sm font-medium">{label}</BaseField.Label>
      {hint && (
        <BaseField.Description className="text-muted-foreground text-xs">
          {hint}
        </BaseField.Description>
      )}
      <Select.Root
        items={items}
        value={value ?? ''}
        onValueChange={(newValue) => {
          onChange(newValue ?? '');
        }}
      >
        <Select.Trigger className={triggerClasses}>
          <Select.Value />
          <Select.Icon>
            <span>▼</span>
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner>
            <Select.Popup className="border-border bg-background z-50 max-h-60 overflow-auto rounded border shadow-lg">
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  className="hover:bg-accent focus:bg-accent cursor-pointer px-3 py-2"
                  disabled={item.value === ''}
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <BaseField.Error className="text-destructive text-sm">
        <p>{error}</p>
      </BaseField.Error>
    </BaseField.Root>
  );
}
