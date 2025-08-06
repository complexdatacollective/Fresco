import { type Meta, type StoryObj } from '@storybook/nextjs';
import { MVPList } from './MVPList';

const meta: Meta<typeof MVPList> = {
  title: 'Components/MVPList',
  component: MVPList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = Array.from({ length: 100 }, (_, i) => `${i + 1}`);

export const Default: Story = {
  args: {
    items: sampleItems,
  },
};
