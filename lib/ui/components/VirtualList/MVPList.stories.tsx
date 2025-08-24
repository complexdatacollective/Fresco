import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useRef, useState } from 'react';
import MVPList from './MVPList';

const meta: Meta<typeof MVPList> = {
  title: 'Components/MVPList',
  component: MVPList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# MVPList - Virtual List with Staggered Animations

A virtualized grid component that supports staggered animations when items change. Uses the \`useVirtualListAnimation\` hook internally.

## Features

- **Virtual scrolling** for performance with large datasets
- **Responsive grid** that adapts to container width  
- **Staggered animations** when items change (controlled via \`listId\`)
- **Smooth transitions** between different item sets

## Usage

The component requires three props:
- \`items\`: Array of items with \`id\` and \`name\` properties
- \`listId\`: String that controls when animations trigger (change this to animate)
- \`ListItem\` (optional): Custom component for rendering individual items

### Basic Example

\`\`\`tsx
import MVPList from './MVPList';

const items = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

function MyComponent() {
  return <MVPList items={items} listId="static" />;
}
\`\`\`

### With Animation Triggers

\`\`\`tsx
function MyComponent() {
  const [items, setItems] = useState(generateItems(100));
  const [listId, setListId] = useState('0');
  
  const handleNewItems = () => {
    setItems(generateNewItems(100));
    setListId(prev => (parseInt(prev) + 1).toString()); // Trigger animation
  };
  
  return (
    <>
      <button onClick={handleNewItems}>Load New Items</button>
      <MVPList items={items} listId={listId} />
    </>
  );
}
\`\`\`

## useVirtualListAnimation Hook

The component uses the \`useVirtualListAnimation\` hook internally. You can use this hook directly for custom implementations:

\`\`\`tsx
import { useVirtualListAnimation } from './useVirtualListAnimation';

function CustomVirtualList({ items, listId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const columns = 4; // or calculate dynamically
  
  const {
    displayItems,
    isTransitioning,
    scope,
    shouldAnimateItem,
    getItemDelay,
    captureVisibleItems
  } = useVirtualListAnimation({
    items,
    listId,
    containerRef,
    columns
  });
  
  // Use displayItems instead of items
  // Check shouldAnimateItem(id) to determine if item should animate
  // Use getItemDelay(id) for stagger timing
  
  return (
    <div ref={containerRef}>
      <div ref={scope}>
        {displayItems.map(item => (
          <motion.div
            key={item.id}
            initial={shouldAnimateItem(item.id) ? { opacity: 0, y: '100%' } : false}
            animate={{ opacity: 1, y: '0%' }}
            transition={{ delay: getItemDelay(item.id) }}
          >
            {item.name}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

## Animation Behavior

- **listId unchanged**: Items added/removed without animation (useful for drag & drop)
- **listId changed**: Full exit → enter animation sequence with staggered timing
- **Stagger timing**: Calculates delays to fit animation within fixed duration

## listId Management Patterns

There are two main patterns for managing \`listId\`:

### 1. Stable listId (no animations)

Use when you want seamless updates without exit/enter animations:

\`\`\`tsx
// Keep listId constant
const listId = useRef('stable-list').current;
// or
const [listId] = useState('stable-list');

// Items can change without triggering animations
const addItem = () => setItems([...items, newItem]);
const removeItem = (id) => setItems(items.filter(item => item.id !== id));
const reorderItems = (newOrder) => setItems(newOrder);
// listId stays the same - no animation
\`\`\`

**Use cases:**
- Drag & drop operations
- Adding/removing individual items
- Filtering or sorting existing data
- Real-time updates

### 2. Context-based listId (trigger animations)

Use when external context changes and you want fresh animations:

\`\`\`tsx
// Prompt/Step-based (common pattern)
const [currentPrompt, setCurrentPrompt] = useState(1);
const listId = \`prompt-\${currentPrompt}\`;

const goToPrompt = (promptNumber) => {
  setCurrentPrompt(promptNumber);
  setItems(getItemsForPrompt(promptNumber));
  // listId automatically changes to trigger animation
};

// Other context-based examples:
const listId = \`view-\${viewType}\`;      // Different views
const listId = \`step-\${stepNumber}\`;    // Wizard steps  
const listId = \`page-\${pageNumber}\`;    // Pagination
const listId = \`filter-\${filterType}\`;  // Different filters
\`\`\`

**Use cases:**
- Interview/survey prompts
- Multi-step workflows
- Switching between different views
- Loading new datasets
- Navigation between pages/sections
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Function to generate items with unique IDs
const generateItems = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    name: faker.person.firstName(),
  }));

export const Default: Story = {
  args: {
    items: generateItems(1000),
    listId: '0', // provide a stable listId for default story
  },
};

export const WithRegenerateButton: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(1000));
    const listIdRef = useRef(0);

    const handleRegenerate = () => {
      // Generate new items with different IDs to ensure they're treated as new
      setItems(generateItems(Math.floor(Math.random() * 1000), Date.now()));
      listIdRef.current += 1; // Increment listId to trigger animation
    };

    return (
      <div>
        <button
          type="button"
          onClick={handleRegenerate}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Regenerate Items
        </button>
        <MVPList items={items} listId={listIdRef.current.toString()} />
      </div>
    );
  },
};

export const StableListId: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(10));
    const listIdRef = useRef(0);

    const addItem = () => {
      // Add a new item without changing listId (no full animation)
      const maxId = items.length > 0 ? Math.max(...items.map((i) => i.id)) : 0;
      setItems([...items, { id: maxId + 1, name: faker.person.firstName() }]);
      // Note: listId not changed, so no full list animation triggered
    };

    const removeItem = () => {
      // Remove last item without changing listId
      if (items.length === 0) return;
      setItems(items.slice(0, items.length - 1));
      // listId stays the same
    };

    return (
      <div>
        <div style={{ marginBottom: '12px' }}>
          <button
            type="button"
            onClick={addItem}
            className="bg-success mr-2 rounded px-4 py-2 text-white hover:cursor-pointer"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={removeItem}
            className="bg-destructive rounded px-4 py-2 text-white hover:cursor-pointer"
          >
            Remove Item
          </button>
          <p className="text-sm">
            Note: listId is stable, so adding/removing items does{' '}
            <strong>not</strong> re-trigger full animation. This is useful in
            cases like drag and drop.
          </p>
        </div>
        <MVPList items={items} listId={listIdRef.current.toString()} />
      </div>
    );
  },
};

export const PromptBasedListId: Story = {
  render: () => {
    const [currentPrompt, setCurrentPrompt] = useState(1);

    // Mock data for different prompts
    const promptData = {
      1: {
        title: 'Who are your close friends?',
        items: generateItems(8).map((item) => ({
          ...item,
          name: `Friend ${item.id}`,
        })),
      },
      2: {
        title: 'Who are your work colleagues?',
        items: generateItems(12).map((item) => ({
          ...item,
          name: `Colleague ${item.id}`,
        })),
      },
      3: {
        title: 'Who are your family members?',
        items: generateItems(6).map((item) => ({
          ...item,
          name: `Family ${item.id}`,
        })),
      },
    };

    const currentData = promptData[currentPrompt];
    const listId = `prompt-${currentPrompt}`; // Key insight: listId changes with prompt

    return (
      <div className="space-y-4">
        <div className="rounded p-4">
          <h3 className="mb-3 text-lg font-semibold">
            Interview Prompt Pattern
          </h3>
          <p className="mb-4 text-sm">
            Each prompt shows different items and triggers fresh animations.
            Common in side panels.
          </p>

          <div className="mb-4 space-x-2">
            {[1, 2, 3].map((promptNum) => (
              <button
                key={promptNum}
                type="button"
                onClick={() => setCurrentPrompt(promptNum)}
                className={`rounded px-4 py-2 text-sm font-medium ${
                  currentPrompt === promptNum
                    ? 'bg-accent text-white'
                    : 'border-accent border bg-white'
                }`}
              >
                Prompt {promptNum}
              </button>
            ))}
          </div>

          <div className="mb-2 text-xs text-purple-600">
            Current listId:{' '}
            <code className="rounded bg-white px-2 py-1">{listId}</code>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h4 className="mb-4 text-lg font-medium">{currentData.title}</h4>
          <MVPList items={currentData.items} listId={listId} />
        </div>

        <div className="rounded bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">Code Pattern:</h4>
          <pre className="overflow-x-auto rounded border bg-white p-3 text-xs">
            {`const [currentPrompt, setCurrentPrompt] = useState(1);

const goToPrompt = (promptNumber) => {
  setCurrentPrompt(promptNumber);
  setItems(getItemsForPrompt(promptNumber));
  // Key: listId includes prompt number
  setListId(\`prompt-\${promptNumber}\`);
};

return (
  <MVPList 
    items={getItemsForPrompt(currentPrompt)} 
    listId={\`prompt-\${currentPrompt}\`}
  />
);`}
          </pre>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
This pattern is ideal for **multi-step workflows** where each step shows different content:

**Use Cases:**
- Network Canvas interview prompts
- Multi-step survey forms  
- Wizard/stepper interfaces
- Different views of the same dataset

**Why it works:**
- Each prompt gets a unique \`listId\` (\`prompt-1\`, \`prompt-2\`, etc.)
- Changing prompts triggers fresh animations
- Users get visual feedback that content has changed
- Maintains context that this is a "new screen"

**Alternative approaches:**
- \`listId="step-\${stepNumber}"\` for generic steps
- \`listId="view-\${viewType}"\` for different views
- \`listId="page-\${pageNumber}"\` for pagination
        `,
      },
    },
  },
};

export const StableVsContextBased: Story = {
  render: () => {
    // Stable listId pattern
    const [stableItems, setStableItems] = useState(generateItems(12));
    const stableListId = useRef('stable-dnd').current;

    // Context-based listId pattern
    const [contextItems, setContextItems] = useState(generateItems(12));
    const [context, setContext] = useState('friends');
    const contextListId = `context-${context}`;

    const addToStable = () => {
      const newItem = { id: Date.now(), name: faker.person.firstName() };
      setStableItems([...stableItems, newItem]);
      // No animation - listId stays the same
    };

    const removeFromStable = () => {
      if (stableItems.length > 0) {
        setStableItems(stableItems.slice(0, -1));
        // No animation - listId stays the same
      }
    };

    const addToContext = () => {
      const newItem = { id: Date.now(), name: faker.person.firstName() };
      setContextItems([...contextItems, newItem]);
      // No animation - listId stays the same within this context
    };

    const removeFromContext = () => {
      if (contextItems.length > 0) {
        setContextItems(contextItems.slice(0, -1));
        // No animation - listId stays the same within this context
      }
    };

    const switchContext = (newContext: string) => {
      setContext(newContext);
      setContextItems(generateItems(12, Date.now()));
      // Animation triggered - listId changes
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Stable Pattern */}
          <div className="space-y-3">
            <div className="rounded p-4">
              <h4 className="font-semibold">Stable listId Pattern</h4>
              <p className="mb-3 text-sm">
                Perfect for drag & drop, add/remove operations
              </p>
              <p className="mb-3 text-xs">
                listId:{' '}
                <code className="rounded bg-white px-2 py-1">
                  {stableListId}
                </code>
              </p>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={addToStable}
                  className="bg-success rounded px-3 py-1 text-xs text-white"
                >
                  Add Item (No Animation)
                </button>
                <button
                  type="button"
                  onClick={removeFromStable}
                  className="bg-destructive rounded px-3 py-1 text-xs text-white"
                >
                  Remove Item
                </button>
              </div>
            </div>
            <div className="h-64">
              <MVPList items={stableItems} listId={stableListId} />
            </div>
          </div>

          {/* Context-based Pattern */}
          <div className="space-y-3">
            <div className="rounded p-4">
              <h4 className="font-semibold">Context-based listId</h4>
              <p className="mb-3 text-sm">
                Each prompt shows different items and triggers fresh animations.
              </p>
              <p className="mb-3 text-xs">
                listId:{' '}
                <code className="rounded bg-white px-2 py-1">
                  {contextListId}
                </code>
              </p>
              <div className="mb-3 space-x-2">
                {['friends', 'work', 'family'].map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => switchContext(ctx)}
                    className={`rounded px-3 py-1 text-xs capitalize ${
                      context === ctx ? 'bg-accent text-white' : 'bg-white'
                    }`}
                  >
                    {ctx} (Animates)
                  </button>
                ))}
              </div>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={addToContext}
                  className="bg-success rounded px-3 py-1 text-xs text-white"
                >
                  Add to {context} (No Animation)
                </button>
                <button
                  type="button"
                  onClick={removeFromContext}
                  className="bg-destructive rounded px-3 py-1 text-xs text-white"
                >
                  Remove from {context}
                </button>
              </div>
            </div>
            <div className="h-64">
              <MVPList items={contextItems} listId={contextListId} />
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the two main patterns for \`listId\` management:

**Stable listId:** Use when you want seamless updates without disrupting the user's flow. Perfect for drag & drop operations, adding/removing items, or real-time updates.

**Context-based listId:** Use when external context changes and you want to signal a transition to new content. Perfect for interview prompts, navigation, or switching between different data views.

The choice between these patterns depends on your UX goals and the nature of the content changes.
        `,
      },
    },
  },
};

export const HookUsageDemo: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <div className="rounded bg-gray-50 p-4">
          <h3 className="mb-2 text-lg font-semibold">Hook Usage Pattern</h3>
          <p className="mb-4 text-sm text-gray-600">
            This demonstrates the typical pattern for using
            useVirtualListAnimation:
          </p>
          <pre className="overflow-x-auto rounded border bg-white p-3 text-xs">
            {`import { useVirtualListAnimation } from './useVirtualListAnimation';

function MyVirtualList({ items, listId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  
  // Hook returns everything needed for animations
  const {
    displayItems,      // Use this instead of items
    isTransitioning,   // True during exit animation
    scope,            // Attach to animation container
    shouldAnimateItem, // Check if item needs animation
    getItemDelay,     // Get stagger delay for item
    captureVisibleItems // Call when virtual rows update
  } = useVirtualListAnimation({
    items,
    listId,
    containerRef,
    columns
  });
  
  return (
    <div ref={containerRef} className="overflow-auto">
      <div ref={scope}>
        {displayItems.map(item => (
          shouldAnimateItem(item.id) ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: '0%' }}
              transition={{ delay: getItemDelay(item.id) }}
            >
              {item.name}
            </motion.div>
          ) : (
            <div key={item.id}>{item.name}</div>
          )
        ))}
      </div>
    </div>
  );
}`}
          </pre>
        </div>

        <div className="rounded bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">Key Points:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              • <strong>containerRef</strong>: Required for scroll management
            </li>
            <li>
              • <strong>displayItems</strong>: Use instead of original items
              array
            </li>
            <li>
              • <strong>listId changes</strong>: Trigger exit → enter animations
            </li>
            <li>
              • <strong>shouldAnimateItem()</strong>: Only animate initially
              visible items
            </li>
            <li>
              • <strong>getItemDelay()</strong>: Provides stagger timing
            </li>
            <li>
              • <strong>captureVisibleItems()</strong>: Call when virtual rows
              update
            </li>
          </ul>
        </div>

        <MVPList items={generateItems(50)} listId="demo" />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
This story shows the complete pattern for using the \`useVirtualListAnimation\` hook directly. 
The hook handles all animation state management, timing calculations, and transition coordination.

The key insight is that the hook provides \`displayItems\` instead of using the original \`items\` directly,
allowing it to manage smooth transitions between different item sets.
        `,
      },
    },
  },
};
