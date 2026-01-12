'use client';

import preview from '~/.storybook/preview';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Node, { type NodeColorSequence } from '~/lib/ui/components/Node';
import { cx } from '~/utils/cva';
import { Collection } from '../components/Collection';
import { ListLayout } from '../layout';
import { type ItemProps } from '../types';

type Item = {
  id: string;
  name: string;
  description: string;
  color: NodeColorSequence;
};

const collectionClasses =
  'w-full flex flex-col gap-8 bg-surface text-surface-contrast publish-colors';

const sampleItems: Item[] = [
  {
    id: '1',
    name: 'Apple',
    description: 'A red fruit',
    color: 'node-color-seq-1',
  },
  {
    id: '2',
    name: 'Banana',
    description: 'A yellow fruit',
    color: 'node-color-seq-2',
  },
  {
    id: '3',
    name: 'Cherry',
    description: 'A small red fruit',
    color: 'node-color-seq-3',
  },
  {
    id: '4',
    name: 'Date',
    description: 'A sweet fruit',
    color: 'node-color-seq-4',
  },
  {
    id: '5',
    name: 'Elderberry',
    description: 'A dark purple berry',
    color: 'node-color-seq-5',
  },
  {
    id: '6',
    name: 'Fig',
    description: 'A soft fruit',
    color: 'node-color-seq-6',
  },
  {
    id: '7',
    name: 'Grape',
    description: 'A small round fruit',
    color: 'node-color-seq-7',
  },
  {
    id: '8',
    name: 'Honeydew',
    description: 'A green melon',
    color: 'node-color-seq-8',
  },
];

function CardItem({ item, itemProps }: { item: Item; itemProps: ItemProps }) {
  return (
    <div
      {...itemProps}
      className={cx(
        'bg-surface-1 text-surface-1-contrast rounded border-2 border-transparent p-4 transition-all duration-300',
        'data-dragging:opacity-50 data-dragging:shadow-2xl',
        'data-selected:bg-accent data-selected:text-accent-contrast data-selected:outline-accent',
        'focusable',
        'data-disabled:opacity-50',
      )}
    >
      <Heading level="label">{item.name}</Heading>
      <Paragraph>{item.description}</Paragraph>
    </div>
  );
}

function NodeItem({ item, itemProps }: { item: Item; itemProps: ItemProps }) {
  // Read selection and disabled state from itemProps data attributes
  const isSelected = itemProps['data-selected'] === true;
  const isDisabled = itemProps['data-disabled'] === true;

  // Destructure to exclude event handlers that conflict with motion component types
  const {
    ref,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    ...restProps
  } = itemProps;

  // Node uses framer-motion internally, which has strict types that don't match standard HTML event types.
  // We cast the props to work around this type incompatibility.
  const nodeProps = {
    ...restProps,
    ref,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
  } as React.ComponentProps<typeof Node>;

  return (
    <Node
      {...nodeProps}
      label={item.name}
      color={item.color}
      selected={isSelected}
      disabled={isDisabled}
    />
  );
}

const meta = preview.meta({
  title: 'Systems/Collection',
  component: Collection<Item>,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

export const Primary = meta.story({
  args: {
    items: sampleItems,
    layout: new ListLayout({ gap: 12 }),
    keyExtractor: (item: Item) => item.id,
    renderItem: (item: Item, itemProps: ItemProps) => (
      <CardItem item={item} itemProps={itemProps} />
    ),
  },
  render: (args) => (
    <div className="flex h-screen w-screen p-8">
      <div className={cx(collectionClasses, 'p-4')}>
        <Heading level="h2">Card Item Collection</Heading>

        <button>previous item for testing focus</button>
        <Collection {...args} />
        <button>next item for testing focus</button>
      </div>
    </div>
  ),
});
