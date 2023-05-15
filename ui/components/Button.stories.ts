import type { Meta, StoryObj } from '@storybook/react';

import * as LucideIcons from 'lucide-react';

import Button from './Button';

console.log(LucideIcons);

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta<typeof Button> = {
  title: 'Example/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {
    children: 'Button',
    color: 'primary',
    size: 'medium',
    iconPosition: 'left',
    icon: LucideIcons.ArrowRight,
    disabled: false,
  },
  argTypes: {
    onClick: { action: 'clicked' },
    icon: {
      options: Object.values(LucideIcons),
      control: {
        type: 'select',
      },
    }
  },
};