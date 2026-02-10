'use client';

import { Loader2, Search, X } from 'lucide-react';
import { type ReactNode, useCallback } from 'react';
import { IconButton } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';
import { cx } from '~/utils/cva';
import { useOptionalFilterManager } from '../contexts';

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

  const isLoading = filterManager.isFiltering || filterManager.isIndexing;
  const hasQuery = filterManager.query.length > 0;
  const statusText = filterManager.isIndexing ? indexingText : loadingText;

  const defaultLoadingIndicator = (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  );

  const prefixContent =
    showLoadingIndicator && isLoading ? (
      <div className="flex items-center gap-1.5">
        {loadingIndicator ?? defaultLoadingIndicator}
        <span className="text-sm text-current/70">{statusText}</span>
      </div>
    ) : (
      <Search className="h-4 w-4" aria-hidden="true" />
    );

  const suffixContent = (
    <div className="flex items-center gap-2">
      {showResultCount && filterManager.hasActiveFilter && (
        <span className="text-sm text-current/70">
          {filterManager.matchCount} result
          {filterManager.matchCount !== 1 ? 's' : ''}
        </span>
      )}
      {showClearButton && hasQuery && (
        <IconButton
          variant="text"
          size="sm"
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
      value={filterManager.query}
      onChange={handleChange}
      prefixComponent={prefixContent}
      suffixComponent={suffixContent}
      size={size}
      className={cx('w-full max-w-xs', className)}
      aria-label="Filter collection"
    />
  );
}
