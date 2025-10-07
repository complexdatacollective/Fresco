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

export const WithCheckboxes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="terms"
          className="border-input h-4 w-4 rounded"
        />
        <Label htmlFor="terms" className="cursor-pointer">
          I agree to the terms and conditions
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="newsletter"
          className="border-input h-4 w-4 rounded"
        />
        <Label htmlFor="newsletter" className="cursor-pointer">
          Subscribe to newsletter
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="marketing"
          className="border-input h-4 w-4 rounded"
          disabled
        />
        <Label
          htmlFor="marketing"
          className="cursor-not-allowed peer-disabled:opacity-70"
        >
          Receive marketing emails (disabled)
        </Label>
      </div>
    </div>
  ),
};

export const WithRadioButtons: Story = {
  render: () => (
    <div className="space-y-2">
      <Label>Preferred Contact Method</Label>
      <div className="ml-4 space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="contact-email"
            name="contact"
            className="h-4 w-4"
            defaultChecked
          />
          <Label htmlFor="contact-email" className="cursor-pointer">
            Email
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="contact-phone"
            name="contact"
            className="h-4 w-4"
          />
          <Label htmlFor="contact-phone" className="cursor-pointer">
            Phone
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="contact-sms"
            name="contact"
            className="h-4 w-4"
          />
          <Label htmlFor="contact-sms" className="cursor-pointer">
            SMS
          </Label>
        </div>
      </div>
    </div>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <select
        id="country"
        className="border-input w-full rounded-lg border px-3 py-2"
      >
        <option>United States</option>
        <option>United Kingdom</option>
        <option>Canada</option>
        <option>Australia</option>
        <option>Germany</option>
      </select>
    </div>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="disabled-input">Disabled Input</Label>
        <input
          id="disabled-input"
          type="text"
          disabled
          placeholder="This input is disabled"
          className="border-input w-full rounded-lg border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs">
          Note: Label opacity is managed by the peer-disabled: variant
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="disabled-check"
          disabled
          className="peer border-input h-4 w-4 rounded"
        />
        <Label htmlFor="disabled-check" className="peer-disabled:opacity-70">
          Disabled checkbox with automatically dimmed label
        </Label>
      </div>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="custom1" className="text-primary">
          Primary Colored Label
        </Label>
        <input
          id="custom1"
          type="text"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom2" className="text-lg">
          Larger Label
        </Label>
        <input
          id="custom2"
          type="text"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom3" className="text-sm">
          Smaller, Normal Weight Label
        </Label>
        <input
          id="custom3"
          type="text"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom4" className="text-xs tracking-wider uppercase">
          All Caps Label
        </Label>
        <input
          id="custom4"
          type="text"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <input
          id="username"
          type="text"
          placeholder="johndoe"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
        <p className="text-sm">Choose a unique username for your account</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <input
          id="password"
          type="password"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
        <p className="text-sm">
          Must be at least 8 characters with a mix of letters and numbers
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <input
          id="age"
          type="number"
          min="0"
          max="120"
          className="border-destructive w-full rounded-lg border px-3 py-2"
        />
        <p className="text-destructive text-sm">
          Age must be between 0 and 120
        </p>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="border-surface-1 bg-surface max-w-md space-y-6 rounded-lg border p-6">
      <h2 className="text-xl">Contact Information</h2>

      <div className="space-y-2">
        <Label htmlFor="form-name">Full Name *</Label>
        <input
          id="form-name"
          type="text"
          required
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-email">Email Address *</Label>
        <input
          id="form-email"
          type="email"
          required
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-phone">Phone Number</Label>
        <input
          id="form-phone"
          type="tel"
          className="border-input w-full rounded-lg border px-3 py-2"
        />
        <p className="text-xs">Optional - for urgent matters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-message">Message *</Label>
        <textarea
          id="form-message"
          required
          rows={4}
          className="border-input w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="form-consent"
          required
          className="border-input h-4 w-4 rounded"
        />
        <Label htmlFor="form-consent" className="cursor-pointer">
          I consent to being contacted *
        </Label>
      </div>

      <button
        type="submit"
        className="bg-primary text-primary-contrast w-full rounded-lg px-4 py-2 hover:opacity-90"
      >
        Submit
      </button>
    </form>
  ),
};
