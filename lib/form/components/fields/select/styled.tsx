import { Select } from '@base-ui-components/react/select';
import { Check } from 'lucide-react';
import {
  controlWrapperVariants,
  selectBackgroundVariants,
} from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export type SelectProps<T extends string> = VariantProps<
  typeof controlWrapperVariants
> &
  Omit<Select.Root.Props<T>, 'size' | 'onChange'> & {
    name: string;
    value: T | T[];
    placeholder?: string;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
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
}: SelectProps<string>) {
  // base-ui Select only supports string values, so we convert to/from strings
  const stringValue = value !== undefined ? String(value) : '';

  const handleValueChange = (newValue: string | string[] | null) => {
    if (newValue === null) return;
    // Find the matching option to get the correctly typed value
    const matchedOption = options.find((opt) => String(opt.value) === newValue);
    if (matchedOption) {
      onChange(matchedOption.value);
    }
  };

  return (
    <Select.Root
      value={stringValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      name={name}
      {...rootProps}
    >
      <Select.Trigger
        className={controlWrapperVariants({
          size,
          className,
        })}
      >
        <div className={cx('form-select', selectBackgroundVariants)}>
          <Select.Value className="flex-1 truncate text-left">
            {(currentValue: string | null) => {
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
              const option = options.find(
                (opt) => String(opt.value) === currentValue,
              );
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
              'min-w-(--anchor-width)',
            )}
          >
            <Select.List className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={String(option.value)}
                  className={cx(
                    'flex cursor-pointer items-center gap-2 px-3 py-2',
                    'text-sm transition-colors outline-none',
                    'hover:bg-accent/10',
                    'data-selected:bg-selected',
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
