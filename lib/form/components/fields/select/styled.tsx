import { Select } from '@base-ui-components/react/select';
import { Check } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  type SelectHTMLAttributes,
} from 'react';
import {
  controlWrapperVariants,
  selectBackgroundVariants,
} from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';

export type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = VariantProps<typeof controlWrapperVariants> &
  Omit<
    ComponentPropsWithoutRef<typeof Select.Root>,
    'onValueChange' | 'items' | 'multiple'
  > &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> & {
    name: string;
    value?: string | number;
    placeholder?: string;
    options: SelectOption[];
    onChange: (value: string | number) => void;
    className?: string;
  };

export function SelectField({
  options,
  placeholder,
  size,
  className,
  onChange,
  value,
  disabled,
  name,
  ...rootProps
}: SelectProps) {
  const handleValueChange = (newValue: unknown) => {
    if (newValue !== null && newValue !== undefined) {
      onChange(newValue as string | number);
    }
  };

  // Work out variant state based on props. Order:
  // disabled > readOnly > invalid > normal
  const getState = () => {
    if (disabled) return 'disabled';
    if (rootProps['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <Select.Root
      {...rootProps}
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
      name={name}
    >
      <Select.Trigger
        className={controlWrapperVariants({
          size,
          state: getState(),
          className,
        })}
      >
        <div className={cx('form-select', selectBackgroundVariants)}>
          <Select.Value className="flex-1 truncate text-left">
            {(currentValue: string | number | null) => {
              if (
                currentValue === null ||
                currentValue === undefined ||
                currentValue === ''
              ) {
                return (
                  <span className="text-input-contrast/50 italic">
                    {placeholder}
                  </span>
                );
              }
              const option = options.find((opt) => opt.value === currentValue);
              return option?.label ?? currentValue;
            }}
          </Select.Value>
        </div>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50" alignItemWithTrigger={false}>
          <Select.Popup
            className={cx(
              'elevation-high rounded-sm border-2 border-transparent',
              'bg-surface-popover text-surface-popover-contrast',
              'max-h-96 overflow-auto',
              'min-w-[var(--anchor-width)]',
            )}
          >
            <Select.List className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cx(
                    'flex cursor-pointer items-center gap-2 px-3 py-2',
                    'text-sm transition-colors outline-none',
                    'hover:bg-accent/10',
                    'data-[selected]:bg-selected',
                    // 'data-[highlighted]:bg-input-contrast/10',
                  )}
                >
                  <Select.ItemText className="flex-1">
                    {option.label}
                  </Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
