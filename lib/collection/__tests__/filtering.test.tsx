import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Collection } from '../components/Collection';
import { CollectionFilterInput } from '../components/CollectionFilterInput';
import { useFilterManager } from '../contexts';
import { ListLayout } from '../layout/ListLayout';
import { type Key } from '../types';

type Item = {
  id: string;
  name: string;
  category: string;
};

const testItems: Item[] = [
  { id: '1', name: 'Apple', category: 'Fruit' },
  { id: '2', name: 'Banana', category: 'Fruit' },
  { id: '3', name: 'Carrot', category: 'Vegetable' },
  { id: '4', name: 'Date', category: 'Fruit' },
  { id: '5', name: 'Eggplant', category: 'Vegetable' },
];

// Mock useSearchWorker hook to avoid Web Worker issues in tests
const mockSearch = vi.fn();

vi.mock('../hooks/useSearchWorker', () => ({
  useSearchWorker: () => ({
    isReady: true,
    isIndexing: false,
    search: mockSearch,
  }),
}));

beforeEach(() => {
  // Default mock implementation - returns all items
  mockSearch.mockResolvedValue({
    matchingKeys: new Set(testItems.map((item) => item.id)),
    matchCount: testItems.length,
    scores: new Map(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

function FilterableCollection({
  items = testItems,
  filterKeys = ['name', 'category'],
  onFilterChange,
  onFilterResultsChange,
  filterQuery,
  defaultFilterQuery,
}: {
  items?: Item[];
  filterKeys?: string[];
  onFilterChange?: (query: string) => void;
  onFilterResultsChange?: (keys: Set<Key>, count: number) => void;
  filterQuery?: string;
  defaultFilterQuery?: string;
}) {
  const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

  return (
    <Collection
      items={items}
      keyExtractor={(item) => item.id}
      layout={layout}
      aria-label="Filterable collection"
      filterKeys={filterKeys}
      filterQuery={filterQuery}
      defaultFilterQuery={defaultFilterQuery}
      onFilterChange={onFilterChange}
      onFilterResultsChange={onFilterResultsChange}
      renderItem={(item, itemProps) => (
        <div {...itemProps} data-testid={`item-${item.id}`}>
          {item.name} - {item.category}
        </div>
      )}
    >
      <CollectionFilterInput placeholder="Search..." />
    </Collection>
  );
}

function FilterManagerConsumer() {
  const filterManager = useFilterManager();
  return (
    <div>
      <span data-testid="query">{filterManager.query}</span>
      <span data-testid="is-filtering">
        {filterManager.isFiltering.toString()}
      </span>
      <span data-testid="has-active-filter">
        {filterManager.hasActiveFilter.toString()}
      </span>
      <button onClick={() => filterManager.setQuery('test')}>Set Query</button>
      <button onClick={() => filterManager.clearFilter()}>Clear</button>
    </div>
  );
}

function CollectionWithFilterManager({ items = testItems }: { items?: Item[] }) {
  const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

  return (
    <Collection
      items={items}
      keyExtractor={(item) => item.id}
      layout={layout}
      aria-label="Test collection"
      filterKeys={['name', 'category']}
      renderItem={(item, itemProps) => (
        <div {...itemProps}>{item.name}</div>
      )}
    >
      <FilterManagerConsumer />
    </Collection>
  );
}

describe('Collection Filtering', () => {
  describe('rendering', () => {
    it('should render CollectionFilterInput when filterKeys is provided', () => {
      render(<FilterableCollection />);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should render all items initially', () => {
      render(<FilterableCollection />);

      expect(screen.getByText('Apple - Fruit')).toBeInTheDocument();
      expect(screen.getByText('Banana - Fruit')).toBeInTheDocument();
      expect(screen.getByText('Carrot - Vegetable')).toBeInTheDocument();
      expect(screen.getByText('Date - Fruit')).toBeInTheDocument();
      expect(screen.getByText('Eggplant - Vegetable')).toBeInTheDocument();
    });

    it('should not render CollectionFilterInput when filterKeys is not provided', () => {
      const layout = new ListLayout<Item>({ gap: 8 });
      // CollectionFilterInput should warn and return null when no filterKeys
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

      render(
        <Collection
          items={testItems}
          keyExtractor={(item) => item.id}
          layout={layout}
          aria-label="Test collection"
          renderItem={(item, itemProps) => <div {...itemProps}>{item.name}</div>}
        >
          <CollectionFilterInput placeholder="Search..." />
        </Collection>,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'CollectionFilterInput requires filterKeys to be configured on the Collection',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('input interaction', () => {
    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      render(<FilterableCollection />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'Apple');

      expect(input).toHaveValue('Apple');
    });

    it('should call onFilterChange when typing in controlled mode', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();

      function ControlledFilter() {
        const [query, setQuery] = useState('');
        return (
          <FilterableCollection
            filterQuery={query}
            onFilterChange={(q) => {
              setQuery(q);
              onFilterChange(q);
            }}
          />
        );
      }

      render(<ControlledFilter />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'A');

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith('A');
      });
    });
  });

  describe('useFilterManager hook', () => {
    it('should provide filter manager context', () => {
      render(<CollectionWithFilterManager />);

      expect(screen.getByTestId('query')).toHaveTextContent('');
      expect(screen.getByTestId('is-filtering')).toHaveTextContent('false');
      expect(screen.getByTestId('has-active-filter')).toHaveTextContent('false');
    });

    it('should update query when setQuery is called', async () => {
      const user = userEvent.setup();
      render(<CollectionWithFilterManager />);

      const setQueryButton = screen.getByText('Set Query');
      await user.click(setQueryButton);

      expect(screen.getByTestId('query')).toHaveTextContent('test');
    });

    it('should clear filter when clearFilter is called', async () => {
      const user = userEvent.setup();
      render(<CollectionWithFilterManager />);

      // First set a query
      const setQueryButton = screen.getByText('Set Query');
      await user.click(setQueryButton);
      expect(screen.getByTestId('query')).toHaveTextContent('test');

      // Then clear it
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(screen.getByTestId('query')).toHaveTextContent('');
    });

    it('should throw when used outside of Collection with filterKeys', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
      const layout = new ListLayout<Item>({ gap: 8 });

      expect(() => {
        render(
          <Collection
            items={testItems}
            keyExtractor={(item) => item.id}
            layout={layout}
            aria-label="Test collection"
            renderItem={(item, itemProps) => <div {...itemProps}>{item.name}</div>}
          >
            <FilterManagerConsumer />
          </Collection>,
        );
      }).toThrow(
        'useFilterManager must be used within a Collection with filterKeys configured',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('default filter query', () => {
    it('should initialize with defaultFilterQuery', async () => {
      render(<FilterableCollection defaultFilterQuery="initial" />);

      const input = screen.getByPlaceholderText('Search...');
      await waitFor(() => {
        expect(input).toHaveValue('initial');
      });
    });
  });

  describe('controlled mode', () => {
    it('should use controlled filterQuery', () => {
      render(<FilterableCollection filterQuery="controlled" />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveValue('controlled');
    });

    it('should update when controlled filterQuery changes', async () => {
      function ControlledWrapper() {
        const [query, setQuery] = useState('initial');
        return (
          <>
            <button onClick={() => setQuery('updated')}>Update Query</button>
            <FilterableCollection filterQuery={query} />
          </>
        );
      }

      const user = userEvent.setup();
      render(<ControlledWrapper />);

      expect(screen.getByPlaceholderText('Search...')).toHaveValue('initial');

      await user.click(screen.getByText('Update Query'));

      expect(screen.getByPlaceholderText('Search...')).toHaveValue('updated');
    });
  });
});
