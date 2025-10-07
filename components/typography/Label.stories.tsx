import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from './Label';

const meta = {
  title: 'Systems/Typography/Label',
  component: Label,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default Label',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <input
          id="name"
          type="text"
          placeholder="Enter your name"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biography</Label>
        <textarea
          id="bio"
          placeholder="Tell us about yourself"
          className="border-input w-full rounded-lg border px-3 py-2"
          rows={4}
        />
      </div>
    </div>
  ),
};
