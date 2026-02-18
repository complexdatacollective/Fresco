import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ResizableFlexPanel } from './ResizableFlexPanel';

const meta = {
  title: 'UI/ResizableFlexPanel',
  component: ResizableFlexPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '500px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResizableFlexPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const Panel = ({ label, color }: { label: string; color: string }) => (
  <div
    className="flex h-full items-center justify-center rounded-lg text-lg font-semibold text-white"
    style={{ backgroundColor: color, minHeight: '100%' }}
  >
    {label}
  </div>
);

export const Default: Story = {
  args: {
    storageKey: 'story-default',
    defaultBasis: 30,
    min: 10,
    max: 90,
    className: 'h-full',
    children: [
      <Panel key="a" label="Panel A (30%)" color="#6366f1" />,
      <Panel key="b" label="Panel B (fills remaining)" color="#0ea5e9" />,
    ],
  },
};

export const WithBreakpoints: Story = {
  args: {
    storageKey: 'story-breakpoints',
    defaultBasis: 33,
    min: 10,
    max: 90,
    breakpoints: [
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 75, label: '75%' },
    ],
    className: 'h-full',
    children: [
      <Panel key="a" label="Locked to 25%, 50%, 75%" color="#8b5cf6" />,
      <Panel key="b" label="Only snaps to breakpoints" color="#06b6d4" />,
    ],
  },
};

export const Vertical: Story = {
  args: {
    storageKey: 'story-vertical',
    defaultBasis: 40,
    min: 15,
    max: 85,
    orientation: 'vertical',
    className: 'h-full',
    children: [
      <Panel key="a" label="Top Panel" color="#ec4899" />,
      <Panel key="b" label="Bottom Panel" color="#f97316" />,
    ],
  },
};

export const CustomMinMax: Story = {
  args: {
    storageKey: 'story-minmax',
    defaultBasis: 50,
    min: 20,
    max: 80,
    className: 'h-full',
    children: [
      <Panel key="a" label="Min 20% / Max 80%" color="#14b8a6" />,
      <Panel key="b" label="Constrained range" color="#a855f7" />,
    ],
  },
};

const OverrideBasisDemo = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full flex-col gap-4">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="self-start rounded bg-white px-4 py-2 text-sm font-medium text-black"
      >
        {collapsed ? 'Expand Panel' : 'Collapse Panel'}
      </button>
      <ResizableFlexPanel
        storageKey="story-override"
        defaultBasis={30}
        min={15}
        max={60}
        overrideBasis={collapsed ? 0 : undefined}
        className="flex-1"
      >
        <Panel label="Collapsible sidebar" color="#6366f1" />
        <Panel label="Main content" color="#0ea5e9" />
      </ResizableFlexPanel>
    </div>
  );
};

export const OverrideBasis: Story = {
  render: () => <OverrideBasisDemo />,
  args: {
    storageKey: 'story-override',
    children: [
      <Panel key="a" label="A" color="#6366f1" />,
      <Panel key="b" label="B" color="#0ea5e9" />,
    ],
  },
};

export const KeyboardAccessible: Story = {
  args: {
    storageKey: 'story-keyboard',
    defaultBasis: 50,
    min: 10,
    max: 90,
    breakpoints: [
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 75, label: '75%' },
    ],
    className: 'h-full',
    children: [
      <div
        key="a"
        className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-[#6366f1] p-4 text-sm text-white"
      >
        <p className="font-semibold">Keyboard controls:</p>
        <ul className="list-inside list-disc text-left text-xs">
          <li>Arrow keys: resize by step</li>
          <li>Home/End: jump to min/max</li>
          <li>PageUp/PageDown: jump between breakpoints</li>
          <li>Double-click handle: reset to default</li>
        </ul>
        <p className="mt-2 text-xs opacity-70">
          Tab to the handle, then use these keys
        </p>
      </div>,
      <Panel key="b" label="Second panel" color="#0ea5e9" />,
    ],
  },
};

export const NameGeneratorMockup: Story = {
  args: {
    storageKey: 'story-namegen',
    defaultBasis: 30,
    min: 15,
    max: 60,
    breakpoints: [
      { value: 25, label: '25% panels' },
      { value: 33, label: 'One-third panels' },
      { value: 50, label: 'Equal split' },
    ],
    className: 'h-full',
    children: [
      <div
        key="sidebar"
        className="flex h-full flex-col gap-3 rounded-lg bg-[#1e1b4b] p-4"
      >
        <div className="rounded bg-[#6366f1]/30 p-3 text-sm text-white">
          Panel 1: Existing Nodes
        </div>
        <div className="rounded bg-[#8b5cf6]/30 p-3 text-sm text-white">
          Panel 2: External Data
        </div>
      </div>,
      <div
        key="main"
        className="flex h-full flex-wrap content-start gap-3 rounded-lg bg-[#0f172a] p-4"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6366f1] text-xs text-white"
          >
            Node {i + 1}
          </div>
        ))}
      </div>,
    ],
  },
};
