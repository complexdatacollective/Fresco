'use client';

import { ArrowUpIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useShallow } from 'zustand/shallow';
import { Button, type ButtonProps } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { useCollectionStore, useOptionalSortManager } from '../contexts';
import {
  type SortDirection,
  type SortProperty,
  type SortType,
} from '../sorting/types';

const MotionArrowIcon = motion.create(ArrowUpIcon);

type CollectionSortButtonProps = {
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
  variant = 'default',
  size = 'md',
}: CollectionSortButtonProps) {
  const sortManager = useOptionalSortManager();

  // Subscribe directly to the sort state we render. SortManager is stable,
  // so it cannot trigger re-renders on its own.
  const { sortProperty, sortDirection } = useCollectionStore<
    unknown,
    { sortProperty: SortProperty | null; sortDirection: SortDirection }
  >(
    useShallow((state) => ({
      sortProperty: state.sortProperty,
      sortDirection: state.sortDirection,
    })),
  );

  if (!sortManager) {
    // eslint-disable-next-line no-console
    console.warn(
      'CollectionSortButton must be used within a Collection component',
    );
    return null;
  }

  const isActive =
    sortProperty !== null &&
    (Array.isArray(property) && Array.isArray(sortProperty)
      ? property.length === sortProperty.length &&
        property.every((p, i) => p === sortProperty[i])
      : sortProperty === property);
  const direction: SortDirection | null = isActive ? sortDirection : null;

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
      icon={
        showDirectionIndicator && isActive ? (
          <MotionArrowIcon
            animate={{ rotate: direction === 'asc' ? 0 : 180 }}
          />
        ) : undefined
      }
    >
      {label}
    </Button>
  );
}
