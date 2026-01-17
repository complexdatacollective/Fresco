import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { type ComponentPropsWithoutRef } from 'react';
import {
  type FieldValueProps,
  type InjectedFieldProps,
} from '~/lib/form/components/Field/types';
import { getInputState } from '~/lib/form/utils/getInputState';
import { cva, cx, type VariantProps } from '~/utils/cva';
import { type SelectOption, selectWrapperVariants } from './shared';

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

export type SelectProps = FieldValueProps<string | number> &
  InjectedFieldProps & {
    placeholder?: string;
    options: SelectOption[];
    className?: string;
  } & Omit<
    ComponentPropsWithoutRef<typeof Select.Root>,
    | 'onValueChange'
    | 'items'
    | 'multiple'
    | 'value'
    | 'defaultValue'
    | 'name'
    | 'disabled'
  > &
  VariantProps<typeof selectWrapperVariants>;

function SelectField(props: SelectProps) {
  const {
    options,
    placeholder,
    size,
    className,
    onChange,
    value,
    name,
    disabled,
    readOnly,
    ...rest
  } = props;

  const handleValueChange = (newValue: unknown) => {
    if (newValue !== null && newValue !== undefined) {
      const convertedValue =
        typeof newValue === 'string' || typeof newValue === 'number'
          ? newValue
          : undefined;
      onChange?.(convertedValue);
    }
  };

  return (
    <Select.Root
      {...rest}
      value={value !== undefined ? String(value) : undefined}
      onValueChange={handleValueChange}
      disabled={disabled ?? readOnly}
      name={name}
    >
      <Select.Trigger
        className={selectWrapperVariants({
          size,
          className: cx('w-full', className),
          state: getInputState(props),
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

export default SelectField;
