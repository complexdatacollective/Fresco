'use client';

import { Loader2, Search, X } from 'lucide-react';
import { type ReactNode, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { IconButton } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';
import { cx } from '~/utils/cva';
import { useCollectionStore, useOptionalFilterManager } from '../contexts';

type CollectionFilterInputProps = {
  /** Placeholder text for the input. Default: "Search..." */
  placeholder?: string;
  /** Show a clear button when there's a query. Default: true */
  showClearButton?: boolean;
  /** Custom loading indicator. Default: Loader2 spinner */
  loadingIndicator?: ReactNode;
  /** Text shown while filtering. Default: "Searching..." */
  loadingText?: string;
  /** Text shown while indexing. Default: "Indexing..." */
  indexingText?: string;
  /** Show loading indicator. Default: true */
  showLoadingIndicator?: boolean;
  /** Show result count when filter is active. Default: true */
  showResultCount?: boolean;
  /** Size of the input field */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
};

/**
 * Pre-built filter input component for searching/filtering a collection.
 * Must be used as a child of Collection with filterKeys configured.
 *
 * @example
 * ```tsx
 * <Collection
 *   items={users}
 *   keyExtractor={(u) => u.id}
 *   layout={layout}
 *   renderItem={renderUser}
 *   filterKeys={['name', 'email']}
 * >
 *   <CollectionFilterInput placeholder="Search users..." />
 * </Collection>
 * ```
 */
export function CollectionFilterInput({
  placeholder = 'Search...',
  showClearButton = true,
  loadingIndicator,
  loadingText = 'Searching...',
  indexingText = 'Indexing...',
  showLoadingIndicator = true,
  showResultCount = true,
  size = 'md',
  className,
}: CollectionFilterInputProps) {
  const filterManager = useOptionalFilterManager();

  // Subscribe directly to the slice of filter state this component renders.
  // The FilterManager is stable (by design), so we cannot rely on it to
  // trigger re-renders when the query or status changes.
  const { query, isFiltering, isIndexing, matchCount, hasActiveFilter } =
    useCollectionStore<
      unknown,
      {
        query: string;
        isFiltering: boolean;
        isIndexing: boolean;
        matchCount: number | null;
        hasActiveFilter: boolean;
      }
    >(
      useShallow((state) => ({
        query: state.filterQuery,
        isFiltering: state.filterIsFiltering,
        isIndexing: state.filterIsIndexing,
        matchCount: state.filterMatchCount,
        hasActiveFilter:
          state.filterDebouncedQuery.length > 0 &&
          state.filterMatchingKeys !== null,
      })),
    );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!filterManager) return;
      filterManager.setQuery(value ?? '');
    },
    [filterManager],
  );

  const handleClear = useCallback(() => {
    filterManager?.clearFilter();
  }, [filterManager]);

  if (!filterManager) {
    // eslint-disable-next-line no-console
    console.warn(
      'CollectionFilterInput requires filterKeys to be configured on the Collection',
    );
    return null;
  }

  const isLoading = isFiltering || isIndexing;
  const hasQuery = query.length > 0;
  const statusText = isIndexing ? indexingText : loadingText;

  const defaultLoadingIndicator = (
    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
  );

  const prefixContent =
    showLoadingIndicator && isLoading ? (
      <div className="flex items-center gap-1.5">
        {loadingIndicator ?? defaultLoadingIndicator}
        <span className="text-sm text-current/70">{statusText}</span>
      </div>
    ) : (
      <Search aria-hidden="true" />
    );

  const suffixContent = (
    <div className="flex items-center gap-2">
      {showResultCount && hasActiveFilter && (
        <span className="text-sm text-current/70">
          {matchCount} result
          {matchCount !== 1 ? 's' : ''}
        </span>
      )}
      {showClearButton && hasQuery && (
        <IconButton
          variant="text"
          onClick={handleClear}
          aria-label="Clear search"
          icon={<X className="size-3.5" />}
        />
      )}
    </div>
  );

  return (
    <InputField
      type="search"
      name="collection-filter"
      placeholder={placeholder}
      value={query}
      onChange={handleChange}
      prefixComponent={prefixContent}
      suffixComponent={suffixContent}
      size={size}
      className={cx('w-full', className)}
      aria-label="Filter"
    />
  );
}
