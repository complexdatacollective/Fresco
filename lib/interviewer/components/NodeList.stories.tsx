'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { type DragMetadata } from '~/lib/dnd';
import NodeList from './NodeList';

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
        },
      },
      place: {
        name: 'Place',
        color: 'node-color-seq-2',
        displayVariable: 'name',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
        },
      },
    },
  },
  stages: [
    {
      id: 'stage-1',
      type: 'NameGenerator',
      label: 'Name Generator',
      subject: {
        entity: 'node',
        type: 'person',
      },
      prompts: [
        {
          id: 'prompt-1',
          text: 'Name the people in your network',
        },
      ],
    },
  ],
  experiments: {
    encryptedVariables: false,
  },
  assets: [],
};

const mockSession = {
  id: 'test-session',
  currentStep: 0,
  promptIndex: 0,
  network: {
    nodes: [],
    edges: [],
    ego: {
      [entityAttributesProperty]: {},
    },
  },
};

const mockUiState = {
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

const createMockStore = () => {
  return configureStore({
    reducer: {
      session: (state: typeof mockSession = mockSession) => state,
      protocol: (state: typeof mockProtocol = mockProtocol) => state,
      ui: (state: typeof mockUiState = mockUiState) => state,
    },
    preloadedState: {
      protocol: mockProtocol,
      session: mockSession,
      ui: mockUiState,
    },
  });
};

const ReduxDecorator = (Story: React.ComponentType) => {
  const store = createMockStore();

  const decoratorVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <Provider store={store}>
      <motion.div
        variants={decoratorVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Story />
      </motion.div>
    </Provider>
  );
};

const names = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
];

const createMockNodes = (
  count: number,
  stageId?: string,
  idOffset = 0,
): NcNode[] => {
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1 + idOffset}`,
    type: 'person',
    stageId: stageId ?? 'stage-1',
    [entityAttributesProperty]: {
      name: names[(i + idOffset) % names.length] ?? 'Unknown',
    },
  }));
};

const meta: Meta<typeof NodeList> = {
  title: 'Interview/Components/NodeList',
  component: NodeList,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of NcNode items to display',
    },
    itemType: {
      control: 'text',
      description: 'Type identifier for drag operations',
    },
    nodeSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the nodes',
    },
    accepts: {
      control: 'object',
      description: 'Array of item types this list accepts for drops',
    },
    id: {
      control: 'text',
      description: 'Unique identifier for the drop zone',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    onItemClick: {
      action: 'item-clicked',
      description: 'Callback when a node is clicked',
    },
    onDrop: {
      action: 'dropped',
      description: 'Callback when a node is dropped on the list',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    items: [],
    nodeSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'An empty NodeList displays a minimum height drop zone for accepting dragged nodes.',
      },
    },
  },
};

export const WithNodes: Story = {
  args: {
    items: createMockNodes(5),
    nodeSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'A NodeList displaying several person nodes.',
      },
    },
  },
};

export const SmallNodes: Story = {
  args: {
    items: createMockNodes(8),
    nodeSize: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'NodeList with small-sized nodes.',
      },
    },
  },
};

export const LargeNodes: Story = {
  args: {
    items: createMockNodes(4),
    nodeSize: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'NodeList with large-sized nodes.',
      },
    },
  },
};

export const ManyNodes: Story = {
  args: {
    items: createMockNodes(10),
    nodeSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'NodeList with many nodes to demonstrate wrapping behavior.',
      },
    },
  },
};

export const CustomItemType: Story = {
  args: {
    items: createMockNodes(3),
    itemType: 'CUSTOM_NODE',
    nodeSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'NodeList with a custom itemType for drag operations. This allows filtering which lists can accept dropped nodes.',
      },
    },
  },
};

export const CustomAccepts: Story = {
  args: {
    items: createMockNodes(3),
    accepts: ['node', 'custom-type'],
    nodeSize: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'NodeList configured to accept multiple drag types. Useful for accepting nodes from different sources.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    items: createMockNodes(4),
    nodeSize: 'md',
    className: 'bg-slate-800 p-4',
  },
  parameters: {
    docs: {
      description: {
        story: 'NodeList with custom styling applied via className prop.',
      },
    },
  },
};

function DragBetweenListsExample() {
  const [leftItems, setLeftItems] = useState<NcNode[]>(createMockNodes(5));
  const [rightItems, setRightItems] = useState<NcNode[]>(
    createMockNodes(3, 'stage-1', 5),
  );

  const handleDropOnLeft = (metadata?: DragMetadata) => {
    if (!metadata) return;
    const node = metadata as NcNode;
    const nodeId = node[entityPrimaryKeyProperty];

    // Only move if node is not already in left list
    if (leftItems.some((n) => n[entityPrimaryKeyProperty] === nodeId)) return;

    setRightItems((prev) =>
      prev.filter((n) => n[entityPrimaryKeyProperty] !== nodeId),
    );
    setLeftItems((prev) => [...prev, node]);
  };

  const handleDropOnRight = (metadata?: DragMetadata) => {
    if (!metadata) return;
    const node = metadata as NcNode;
    const nodeId = node[entityPrimaryKeyProperty];

    // Only move if node is not already in right list
    if (rightItems.some((n) => n[entityPrimaryKeyProperty] === nodeId)) return;

    setLeftItems((prev) =>
      prev.filter((n) => n[entityPrimaryKeyProperty] !== nodeId),
    );
    setRightItems((prev) => [...prev, node]);
  };

  return (
    <div className="flex h-[600px] gap-8">
      <div className="flex flex-1 flex-col">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Left List ({leftItems.length} nodes)
        </h3>
        <div className="border-accent/30 flex-1 rounded-lg border border-dashed p-4">
          <NodeList
            id="left-list"
            items={leftItems}
            nodeSize="md"
            accepts={['node']}
            onDrop={handleDropOnLeft}
            announcedName="Left Node List"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Right List ({rightItems.length} nodes)
        </h3>
        <div className="border-accent/30 flex-1 rounded-lg border border-dashed p-4">
          <NodeList
            id="right-list"
            items={rightItems}
            nodeSize="md"
            accepts={['node']}
            onDrop={handleDropOnRight}
            announcedName="Right Node List"
          />
        </div>
      </div>
    </div>
  );
}

export const DragBetweenLists: Story = {
  render: () => <DragBetweenListsExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive example demonstrating drag and drop between two NodeLists. Drag a node from one list to the other to move it.',
      },
    },
  },
};
