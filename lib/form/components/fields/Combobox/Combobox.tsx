'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState, type ComponentPropsWithoutRef } from 'react';
import {
  type FieldValueProps,
  type InjectedFieldProps,
} from '~/lib/form/components/Field/types';
import { getInputState } from '~/lib/form/utils/getInputState';
import { cx, type VariantProps } from '~/utils/cva';
import {
  type ComboboxOption,
  comboboxActionVariants,
  comboboxInputVariants,
  comboboxItemVariants,
  comboboxTriggerVariants,
} from './shared';

type ComboboxFieldProps = FieldValueProps<(string | number)[]> &
  InjectedFieldProps & {
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    showSearch?: boolean;
    showSelectAll?: boolean;
    showDeselectAll?: boolean;
    singular?: string;
    plural?: string;
    className?: string;
  } & Omit<
    ComponentPropsWithoutRef<typeof Combobox.Root>,
    | 'onValueChange'
    | 'multiple'
    | 'value'
    | 'defaultValue'
    | 'name'
    | 'disabled'
  > &
  VariantProps<typeof comboboxTriggerVariants>;

function ComboboxField(props: ComboboxFieldProps) {
  const {
    options,
    placeholder = 'Select items...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No items found.',
    showSearch = true,
    showSelectAll = true,
    showDeselectAll = true,
    singular = 'item',
    plural = 'items',
    size,
    className,
    onChange,
    value = [],
    name,
    disabled,
    readOnly,
    ...rest
  } = props;

  const [inputValue, setInputValue] = useState('');

  const handleValueChange = (
    newValue: unknown[] | null,
    _event: Combobox.Root.ChangeEventDetails,
  ) => {
    if (newValue === null) {
      onChange?.([]);
    } else {
      const typedValue = newValue as ComboboxOption[];
      onChange?.(typedValue.map((opt) => opt.value));
    }
  };

  const handleSelectAll = () => {
    const enabledOptions = options.filter((opt) => !opt.disabled);
    onChange?.(enabledOptions.map((opt) => opt.value));
  };

  const handleDeselectAll = () => {
    onChange?.([]);
  };

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const query = inputValue.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, inputValue]);

  // Convert value array to selected options
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  // Generate trigger label text
  const triggerLabel = useMemo(() => {
    if (value.length === 0) return null;
    if (value.length === options.length) {
      return `All ${plural} selected (${options.length})`;
    }
    if (value.length === 1) {
      return `1 ${singular} selected`;
    }
    return `${value.length} ${plural} selected`;
  }, [value, options.length, singular, plural]);

  const state = getInputState(props);

  return (
    <Combobox.Root
      {...rest}
      multiple
      value={selectedOptions}
      onValueChange={handleValueChange}
      disabled={disabled ?? readOnly}
      name={name}
    >
      <Combobox.Trigger
        className={comboboxTriggerVariants({
          size,
          className: cx('w-full', className),
          state,
        })}
      >
        <span className="flex-1 truncate text-left">
          <Combobox.Value
            placeholder={
              <span className="text-input-contrast/50 italic">
                {placeholder}
              </span>
            }
          >
            {triggerLabel}
          </Combobox.Value>
        </span>
        <Combobox.Icon className="shrink-0">
          <ChevronsUpDown className="h-[1.2em] w-[1.2em]" />
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner className="z-50" align="start">
          <Combobox.Popup
            className={cx(
              'elevation-high rounded-sm border-2 border-transparent',
              'bg-surface-popover text-surface-popover-contrast',
              'max-h-96 overflow-auto',
              'min-w-(--anchor-width)',
            )}
          >
            {showSearch && (
              <Combobox.Input
                className={comboboxInputVariants({ size })}
                placeholder={searchPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            )}
            <Combobox.List className="p-1">
              {(showSelectAll || showDeselectAll) && (
                <>
                  {showSelectAll && (
                    <button
                      type="button"
                      className={comboboxActionVariants({ size })}
                      onClick={handleSelectAll}
                    >
                      Select All
                    </button>
                  )}
                  {showDeselectAll && (
                    <button
                      type="button"
                      className={comboboxActionVariants({ size })}
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </button>
                  )}
                  <div className="bg-input-contrast/10 my-1 h-px" />
                </>
              )}
              {filteredOptions.map((option) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className={comboboxItemVariants({ size })}
                >
                  <Combobox.ItemIndicator className="flex h-4 w-4 items-center justify-center">
                    <Check className="h-[1em] w-[1em]" />
                  </Combobox.ItemIndicator>
                  <span
                    className={cx(
                      'flex-1',
                      !value.includes(option.value) && 'ml-4',
                    )}
                  >
                    {option.label}
                  </span>
                </Combobox.Item>
              ))}
            </Combobox.List>
            {filteredOptions.length === 0 && (
              <Combobox.Empty className="text-surface-popover-contrast/50 px-3 py-2 text-sm">
                {emptyMessage}
              </Combobox.Empty>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export default ComboboxField;
