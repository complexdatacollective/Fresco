'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronsUpDown, SearchIcon } from 'lucide-react';
import { useMemo, useState, type ComponentPropsWithoutRef } from 'react';
import Surface from '~/components/layout/Surface';
import Button from '~/components/ui/Button';
import { ScrollArea } from '~/components/ui/ScrollArea';
import {
  type FieldValueProps,
  type InjectedFieldProps,
} from '~/lib/form/components/Field/types';
import { getInputState } from '~/lib/form/utils/getInputState';
import {
  dropdownItemVariants,
  proportionalLucideIconVariants,
} from '~/styles/shared/controlVariants';
import { cx, type VariantProps } from '~/utils/cva';
import InputField from '../InputField';
import { comboboxTriggerVariants, type ComboboxOption } from './shared';

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

  const handleInputValueChange = (
    next: string | string[] | number | undefined,
    details: Combobox.Root.ChangeEventDetails,
  ) => {
    // Only update from typing/clearing on the input itself; ignore
    // item-press, list-navigation, etc. so the search query is preserved
    // across selections.
    if (details.reason !== 'input-change' && details.reason !== 'input-clear') {
      return;
    }
    setInputValue(typeof next === 'string' ? next : '');
  };

  const handleSelectAll = () => {
    const enabledOptions = options.filter((opt) => !opt.disabled);
    onChange?.(enabledOptions.map((opt) => opt.value));
  };

  const handleDeselectAll = () => {
    onChange?.([]);
  };

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
      items={options}
      value={selectedOptions}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={handleInputValueChange}
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
        <Combobox.Positioner align="start" sideOffset={10}>
          <Combobox.Popup
            render={
              <Surface
                level="popover"
                elevation="none"
                spacing="xs"
                noContainer
                dynamicSpacing={false}
                className={cx(
                  'flex flex-col shadow-xl',
                  'min-w-(--anchor-width)',
                  'gap-2',
                )}
              />
            }
          >
            {showSearch && (
              <Combobox.Input
                placeholder={searchPlaceholder}
                render={({ onChange, ...rest }) => {
                  // base-ui's render prop types (HTMLProps) are structurally
                  // incompatible with InputField's types (e.g. value, onBlur,
                  // aria-required differ) but semantically correct at runtime.
                  const inputFieldProps =
                    rest as unknown as React.ComponentPropsWithRef<
                      typeof InputField
                    >;
                  return (
                    <InputField
                      {...inputFieldProps}
                      size="sm"
                      prefixComponent={<SearchIcon />}
                      className="w-full"
                      nativeOnChange={onChange}
                    />
                  );
                }}
              />
            )}
            <Combobox.Empty className="text-surface-popover-contrast/50 text-center text-sm italic empty:hidden">
              {emptyMessage}
            </Combobox.Empty>
            <Combobox.List
              className="inset-surface max-h-64 overflow-hidden rounded-sm has-data-empty:hidden"
              render={<ScrollArea viewportClassName="px-2" fade={false} />}
            >
              {(option: ComboboxOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className={dropdownItemVariants()}
                >
                  <Combobox.ItemIndicator
                    className={cx(
                      proportionalLucideIconVariants(),
                      'flex size-4 items-center justify-center',
                    )}
                  >
                    <Check />
                  </Combobox.ItemIndicator>
                  {option.label}
                </Combobox.Item>
              )}
            </Combobox.List>
            {(showSelectAll || showDeselectAll) && (
              <div className="flex gap-2">
                {showSelectAll && (
                  <Button onClick={handleSelectAll} size="sm">
                    Select All
                  </Button>
                )}
                {showDeselectAll && (
                  <Button onClick={handleDeselectAll} size="sm">
                    Deselect All
                  </Button>
                )}
              </div>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export default ComboboxField;
