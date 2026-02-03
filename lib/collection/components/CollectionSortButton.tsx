'use client';

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Button, type ButtonProps } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { useOptionalSortManager } from '../contexts';
import { type SortProperty, type SortType } from '../sorting/types';

export type CollectionSortButtonProps = {
  /** Property to sort by when clicked */
  property: SortProperty;
  /** Type of comparison to use */
  type: SortType;
  /** Display label for the button */
  label: string;
  /** Show sort direction indicator when active */
  showDirectionIndicator?: boolean;
  /** Additional class name */
  className?: string;
  /** Button variant */
  variant?: ButtonProps['variant'];
  /** Button size */
  size?: ButtonProps['size'];
};

/**
 * Pre-built button component for sorting a collection by a specific field.
 * Must be used as a child of Collection.
 *
 * @example
 * ```tsx
 * <Collection items={users} keyExtractor={(u) => u.id} layout={layout} renderItem={renderUser}>
 *   <div className="flex gap-2 mb-4">
 *     <CollectionSortButton property="name" type="string" label="Name" />
 *     <CollectionSortButton property="createdAt" type="date" label="Date" />
 *     <CollectionSortButton property="*" type="number" label="Order Added" />
 *   </div>
 * </Collection>
 * ```
 */
export function CollectionSortButton({
  property,
  type,
  label,
  showDirectionIndicator = true,
  className,
  variant = 'outline',
  size = 'sm',
}: CollectionSortButtonProps) {
  const sortManager = useOptionalSortManager();

  if (!sortManager) {
    // eslint-disable-next-line no-console
    console.warn(
      'CollectionSortButton must be used within a Collection component',
    );
    return null;
  }

  const isActive = sortManager.isSortedBy(property);
  const direction = sortManager.getDirectionFor(property);

  const handleClick = () => {
    sortManager.sortBy(property, type);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cx(isActive && 'bg-accent text-accent-contrast', className)}
      aria-pressed={isActive}
      aria-label={`Sort by ${label}${isActive ? ` (${direction === 'asc' ? 'ascending' : 'descending'})` : ''}`}
    >
      {label}
      {showDirectionIndicator && isActive && (
        <span className="ml-1">
          {direction === 'asc' ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )}
        </span>
      )}
    </Button>
  );
}
