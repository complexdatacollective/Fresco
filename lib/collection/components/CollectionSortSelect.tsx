'use client';

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Button, type ButtonProps } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cx } from '~/utils/cva';
import { useOptionalSortManager } from '../contexts';
import { type SortableProperty, type SortProperty } from '../sorting/types';

type CollectionSortSelectProps = {
  /** Array of sortable properties to display in the dropdown */
  options: SortableProperty[];
  /** Placeholder text when no sort is active */
  placeholder?: string;
  /** Show clear option to remove sorting */
  showClearOption?: boolean;
  /** Show direction toggle button */
  showDirectionToggle?: boolean;
  /** Additional class name */
  className?: string;
  /** Button variant */
  variant?: ButtonProps['variant'];
  /** Button size */
  size?: ButtonProps['size'];
};

/**
 * Compares two SortProperty values for equality.
 */
function propertiesEqual(a: SortProperty, b: SortProperty): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((p, i) => p === b[i]);
  }
  return a === b;
}

/**
 * Pre-built dropdown component for selecting sort field and direction.
 * Must be used as a child of Collection.
 *
 * @example
 * ```tsx
 * <Collection items={users} keyExtractor={(u) => u.id} layout={layout} renderItem={renderUser}>
 *   <CollectionSortSelect
 *     options={[
 *       { property: 'name', label: 'Name', type: 'string' },
 *       { property: 'createdAt', label: 'Date Created', type: 'date' },
 *       { property: '*', label: 'Order Added', type: 'number' },
 *     ]}
 *     placeholder="Sort by..."
 *     showClearOption
 *   />
 * </Collection>
 * ```
 */
export function CollectionSortSelect({
  options,
  placeholder = 'Sort by...',
  showClearOption = true,
  showDirectionToggle = true,
  className,
  variant = 'outline',
  size = 'sm',
}: CollectionSortSelectProps) {
  const sortManager = useOptionalSortManager();

  if (!sortManager) {
    // eslint-disable-next-line no-console
    console.warn(
      'CollectionSortSelect must be used within a Collection component',
    );
    return null;
  }

  const currentProperty = sortManager.sortProperty;
  const currentDirection = sortManager.sortDirection;
  const isSorted = sortManager.isSorted;

  // Find the current option label
  const currentOption = currentProperty
    ? options.find((opt) => propertiesEqual(opt.property, currentProperty))
    : null;

  const handleSelect = (option: SortableProperty) => {
    sortManager.sortBy(option.property, option.type);
  };

  const handleClear = () => {
    sortManager.clearSort();
  };

  const handleToggleDirection = () => {
    sortManager.toggleSortDirection();
  };

  return (
    <div className={cx('flex items-center gap-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant={variant} size={size}>
              {currentOption ? currentOption.label : placeholder}
              <ChevronsUpDownIcon className="ml-1 size-3.5 opacity-50" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {options.map((option) => {
            const isActive =
              currentProperty &&
              propertiesEqual(option.property, currentProperty);
            return (
              <DropdownMenuItem
                key={
                  Array.isArray(option.property)
                    ? option.property.join('.')
                    : String(option.property)
                }
                onClick={() => handleSelect(option)}
                className={cx(isActive && 'bg-accent')}
              >
                {option.label}
              </DropdownMenuItem>
            );
          })}
          {showClearOption && isSorted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClear}>
                Clear sorting
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showDirectionToggle && isSorted && (
        <Button
          variant={variant}
          size={size}
          onClick={handleToggleDirection}
          aria-label={`Sort ${currentDirection === 'asc' ? 'ascending' : 'descending'}, click to toggle`}
        >
          {currentDirection === 'asc' ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )}
        </Button>
      )}
    </div>
  );
}
