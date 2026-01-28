import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Button from './Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Whether the tooltip is open by default',
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button>Hover me</Button>} />
      <TooltipContent>This is a tooltip</TooltipContent>
    </Tooltip>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger
        render={<Button>Hover for tooltip without arrow</Button>}
      />
      <TooltipContent showArrow={false}>
        Tooltip without an arrow pointer
      </TooltipContent>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8 p-16">
      <div />
      <Tooltip>
        <TooltipTrigger render={<Button className="w-full">Top</Button>} />
        <TooltipContent side="top">Top tooltip</TooltipContent>
      </Tooltip>
      <div />

      <Tooltip>
        <TooltipTrigger render={<Button className="w-full">Left</Button>} />
        <TooltipContent side="left">Left tooltip</TooltipContent>
      </Tooltip>
      <div />
      <Tooltip>
        <TooltipTrigger render={<Button className="w-full">Right</Button>} />
        <TooltipContent side="right">Right tooltip</TooltipContent>
      </Tooltip>

      <div />
      <Tooltip>
        <TooltipTrigger render={<Button className="w-full">Bottom</Button>} />
        <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
      </Tooltip>
      <div />
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger render={<Button>Start align</Button>} />
          <TooltipContent side="bottom" align="start">
            Aligned to start
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button>Center align</Button>} />
          <TooltipContent side="bottom" align="center">
            Aligned to center
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button>End align</Button>} />
          <TooltipContent side="bottom" align="end">
            Aligned to end
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  ),
};

export const CustomOffset: Story = {
  render: () => (
    <div className="flex gap-8">
      <Tooltip>
        <TooltipTrigger render={<Button>Default offset</Button>} />
        <TooltipContent>Default offset</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={<Button>Large offset (24px)</Button>} />
        <TooltipContent sideOffset={24}>24px offset</TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger>
        <Button>I start open</Button>
      </TooltipTrigger>
      <TooltipContent>This tooltip is open by default</TooltipContent>
    </Tooltip>
  ),
};
