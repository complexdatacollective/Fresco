import type { Meta, StoryObj } from '@storybook/react';
import { VirtualList } from './index';
import {
  mockItems,
  ItemComponent,
  type MockItem,
} from './VirtualList.stories/shared';

const meta: Meta<typeof VirtualList> = {
  title: 'Components/VirtualList',
  component: VirtualList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A high-performance virtualized list component supporting multiple layout modes, animations, drag & drop, selection, and accessibility features. See the sub-categories for detailed examples.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VirtualList>;

export const Overview: Story = {
  render: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#333' }}>
          VirtualList Component
        </h2>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.5',
          }}
        >
          A powerful virtualized list component built with the new decomposed
          architecture. Supports multiple layout modes, animations, drag & drop,
          selection, and comprehensive accessibility features.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f3e5f5',
              borderRadius: '6px',
            }}
          >
            <strong style={{ color: '#7b1fa2' }}>🎛️ Layouts</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              Interactive layout switcher demo
            </p>
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#e8f5e8',
              borderRadius: '6px',
            }}
          >
            <strong style={{ color: '#388e3c' }}>⚡ Features</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              Selection, drag & drop, animations, accessibility
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
            Quick Start Example
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
            The component below shows a basic implementation. Explore the
            sub-categories for more examples.
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <VirtualList
          items={mockItems.slice(0, 100)}
          keyExtractor={(item) => (item as MockItem).id}
          renderItem={({ item, style }) => (
            <ItemComponent item={item as MockItem} style={style} />
          )}
          layout={{
            mode: 'grid',
            itemSize: { width: 180, height: 120 },
            gap: 16,
          }}
          ariaLabel="VirtualList overview example"
          onItemClick={(item, index) =>
            console.log('Clicked:', (item as MockItem).name, 'at index', index)
          }
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Overview of the VirtualList component with basic grid layout. This component has been architecturally improved with better performance, maintainability, and feature separation while maintaining 100% backward compatibility.',
      },
    },
  },
};
