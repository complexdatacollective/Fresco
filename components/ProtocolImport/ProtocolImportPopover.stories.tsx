import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import ProtocolImportPopover from './ProtocolImportPopover';

const meta: Meta<typeof ProtocolImportPopover> = {
  title: 'Components/ProtocolImport/ProtocolImportPopover',
  component: ProtocolImportPopover,
  parameters: {
    layout: 'centered',
  },
  args: {
    onFilesAccepted: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomButtonVariant: Story = {
  args: {
    buttonVariant: 'outline',
    buttonSize: 'sm',
  },
};

export const Disabled: Story = {
  args: {
    buttonDisabled: true,
  },
};
