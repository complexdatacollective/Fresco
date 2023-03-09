import React from 'react';
import { faker } from '@faker-js/faker';
import { v4 as uuid } from 'uuid';
import ItemList from '@/components/ItemList/ItemList';
import '@/styles/_all.scss';
import Node from '@/components/Node';
import SessionCard from '@/components/Cards/SessionCard';
import ProtocolCard from '@/components/Cards/ProtocolCard';
import DataCard from '@/components/Cards/DataCard';
import { DndContext, useDraggable } from '@dnd-kit/core';

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable',
    data: {
      type: 'draggable',
    },
  });
  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}

const TestCard = (attributes) => (
  <div
    style={{
      background: 'Tomato',
      height: '200px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}
  >
    <h5>{attributes.name}</h5>
    <ul>
      <li>{attributes.caseId}</li>
      <li>{attributes.startedAt}</li>
      <li>{attributes.updatedAt}</li>
      <li>{attributes.progress}</li>
    </ul>
  </div>
);

const TestSessionCard = (attributes) => <SessionCard {...attributes} />;

const TestProtocolCard = (attributes) => <ProtocolCard {...attributes} />;

const TestDataCard = (attributes) => <DataCard {...attributes} />;

const mockItems = (length = 100) =>
  [...Array(length)]
    .map(() => ({
      id: uuid(),
      attributes: {
        id: uuid(),
        label: faker.name.firstName(),
        caseId: faker.name.firstName(),
        protocolName: faker.name.firstName(),
        progress: 50,
        startedAt: faker.date.recent().toUTCString(),
        exportedAt: faker.date.recent().toUTCString(),
        updatedAt: faker.date.recent().toUTCString(),
      },
    }))
    .sort((item1, item2) => item1.attributes.name > item2.attributes.name);

export default {
  title: 'Components/ItemList',
  argTypes: {
    items: {
      options: ['10,000', 1000, 100, 10, 0],
      mapping: {
        '10,000': mockItems(10000),
        1000: mockItems(1000),
        100: mockItems(100),
        10: mockItems(10),
        0: [],
      },
      control: { type: 'radio' },
    },
    itemComponent: {
      options: ['TestCard', 'Node', 'SessionCard', 'ProtocolCard', 'DataCard'],
      mapping: {
        TestCard,
        Node,
        SessionCard: TestSessionCard,
        ProtocolCard: TestProtocolCard,
        DataCard: TestDataCard,
      },
      control: { type: 'radio' },
    },
    useItemSizing: {
      type: 'boolean',
    },
  },
  args: {
    items: 100,
    useItemSizing: true,
    itemComponent: 'Node',
  },
};

export const Primary = {
  render: (args) => (
    <>
      <DndContext>
        <Draggable>Test</Draggable>
        <div
          style={{
            display: 'flex',
            height: '400px',
            width: '100%',
            border: '1px solid tomato',
            '--base-font-size': '12px',
            resize: 'both',
            overflow: 'auto',
          }}
        >
          <ItemList
            {...args}
            cardColumnBreakpoints={{
              800: 2,
              1200: 3,
            }}
          />
        </div>
      </DndContext>
    </>
  ),
};
