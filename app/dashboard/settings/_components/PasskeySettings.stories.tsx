import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PasskeySettings from './PasskeySettings';

const meta = {
  title: 'Settings/PasskeySettings',
  component: PasskeySettings,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PasskeySettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoPasskeys: Story = {
  args: {
    initialPasskeys: [],
    sandboxMode: false,
  },
};

export const WithPasskeys: Story = {
  args: {
    initialPasskeys: [
      {
        id: 'passkey-1',
        friendlyName: 'iCloud Keychain',
        deviceType: 'multiDevice',
        createdAt: new Date('2025-11-15'),
        lastUsedAt: new Date('2026-02-28'),
        backedUp: true,
      },
      {
        id: 'passkey-2',
        friendlyName: 'YubiKey 5C',
        deviceType: 'singleDevice',
        createdAt: new Date('2026-01-10'),
        lastUsedAt: null,
        backedUp: false,
      },
    ],
    sandboxMode: false,
  },
};

export const SandboxMode: Story = {
  args: {
    initialPasskeys: [
      {
        id: 'passkey-1',
        friendlyName: 'iCloud Keychain',
        deviceType: 'multiDevice',
        createdAt: new Date('2025-11-15'),
        lastUsedAt: new Date('2026-02-28'),
        backedUp: true,
      },
    ],
    sandboxMode: true,
  },
};
