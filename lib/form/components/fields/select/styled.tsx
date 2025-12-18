import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { type ComponentPropsWithoutRef } from 'react';
import { cva, cx, type VariantProps } from '~/utils/cva';
import { selectWrapperVariants } from './native';

// Size-based variants for dropdown items
const dropdownItemVariants = cva({
  base: cx(
    'flex cursor-pointer items-center gap-2 px-3',
    'transition-colors outline-none',
    'hover:bg-accent/10',
    'data-selected:bg-selected',
  ),
  variants: {
    size: {
      xs: 'py-1 text-xs',
      sm: 'py-1.5 text-sm',
      md: 'py-2 text-base',
      lg: 'py-2.5 text-lg',
      xl: 'py-3 text-xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type SelectOption = {
  value: string | number;
  label: string;
};

export type SelectProps = VariantProps<typeof selectWrapperVariants> &
  Omit<
    ComponentPropsWithoutRef<typeof Select.Root>,
    'onValueChange' | 'items' | 'multiple' | 'value' | 'defaultValue'
  > & {
    'name': string;
    'value'?: string | number;
    'defaultValue'?: string | number;
    'placeholder'?: string;
    'options': SelectOption[];
    'onChange': (value: string | number) => void;
    'className'?: string;
    'disabled'?: boolean;
    'aria-invalid'?: boolean | 'true' | 'false';
  };

export function SelectField({
  options,
  placeholder,
  size,
  className,
  onChange,
  value,
  defaultValue,
  disabled,
  name,
  ...rootProps
}: SelectProps) {
  const handleValueChange = (newValue: unknown) => {
    if (newValue !== null && newValue !== undefined) {
      onChange(newValue as string | number);
    }
  };

  const getState = () => {
    if (disabled) return 'disabled';
    if (rootProps['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <Select.Root
      {...rootProps}
      value={value !== undefined ? String(value) : undefined}
      defaultValue={
        defaultValue !== undefined ? String(defaultValue) : undefined
      }
      onValueChange={handleValueChange}
      disabled={disabled}
      name={name}
    >
      <Select.Trigger
        className={selectWrapperVariants({
          size,
          className: cx('w-full', className),
          state: getState(),
        })}
      >
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
        <Select.Icon className="shrink-0">
          <ChevronDown className="h-[1.2em] w-[1.2em]" />
        </Select.Icon>
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
                  value={option.value}
                  className={dropdownItemVariants({ size })}
                >
                  <Select.ItemText className="flex-1">
                    {option.label}
                  </Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="h-[1.2em] w-[1.2em]" />
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
