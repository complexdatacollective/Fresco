import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Heading from './Heading';
import Paragraph from './Paragraph';
import UnorderedList from './UnorderedList';

const meta = {
  title: 'UI/Typography/UnorderedList',
  component: UnorderedList,
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
} satisfies Meta<typeof UnorderedList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <UnorderedList>
      <li>First item in the list</li>
      <li>Second item in the list</li>
      <li>Third item in the list</li>
      <li>Fourth item in the list</li>
    </UnorderedList>
  ),
};

export const NestedLists: Story = {
  render: () => (
    <UnorderedList>
      <li>Top-level item one</li>
      <li>
        Top-level item two with nested items
        <UnorderedList>
          <li>Nested item one</li>
          <li>Nested item two</li>
          <li>
            Nested item three with deeper nesting
            <UnorderedList>
              <li>Deeply nested item one</li>
              <li>Deeply nested item two</li>
            </UnorderedList>
          </li>
        </UnorderedList>
      </li>
      <li>Top-level item three</li>
    </UnorderedList>
  ),
};

export const LongContent: Story = {
  render: () => (
    <div className="max-w-2xl">
      <UnorderedList>
        <li>
          Short items are displayed with standard line height and spacing for
          optimal readability.
        </li>
        <li>
          Longer items automatically wrap to multiple lines while maintaining
          proper indentation. The text flows naturally and the bullet point
          remains aligned with the first line of text, creating a clean visual
          appearance.
        </li>
        <li>
          Very long items can span multiple lines and still maintain readability
          through proper line height and spacing. The fluid type system ensures
          that text remains comfortable to read at all viewport sizes, adapting
          the scale ratio from 1.2 on mobile to 1.333 on desktop for optimal
          readability across devices.
        </li>
        <li>Another short item for comparison</li>
      </UnorderedList>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Paragraph intent="smallText">Custom className with text-sm</Paragraph>
      <UnorderedList className="text-sm">
        <li>Smaller text size</li>
        <li>Custom styling applied</li>
        <li>Still maintains list structure</li>
      </UnorderedList>

      <Paragraph intent="smallText">Custom className with text-lg</Paragraph>
      <UnorderedList className="text-lg">
        <li>Larger text size</li>
        <li>Custom styling applied</li>
        <li>Still maintains list structure</li>
      </UnorderedList>
    </div>
  ),
};

export const WithOtherTypography: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Heading level="h2">Design System Principles</Heading>
      <Paragraph>
        A successful design system is built on several key principles that guide
        its development and usage:
      </Paragraph>
      <UnorderedList>
        <li>
          <strong>Consistency:</strong> Apply styles systematically across the
          entire interface to create a cohesive user experience
        </li>
        <li>
          <strong>Accessibility:</strong> Ensure all components meet WCAG
          standards and work with assistive technologies
        </li>
        <li>
          <strong>Scalability:</strong> Design components that can adapt to
          different contexts and grow with the product
        </li>
        <li>
          <strong>Maintainability:</strong> Create clear documentation and
          patterns that team members can easily understand and follow
        </li>
      </UnorderedList>
      <Paragraph>
        These principles help teams build interfaces that are both beautiful and
        functional.
      </Paragraph>
    </div>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Heading level="h1">Getting Started with Fresco</Heading>
      <Paragraph intent="lead">
        Follow these steps to set up your development environment and start
        building with Fresco.
      </Paragraph>

      <Heading level="h2">Prerequisites</Heading>
      <Paragraph>
        Before you begin, ensure you have the following installed:
      </Paragraph>
      <UnorderedList>
        <li>Node.js version 18 or higher</li>
        <li>pnpm package manager</li>
        <li>Docker for running the database</li>
        <li>A code editor like VS Code</li>
      </UnorderedList>

      <Heading level="h2">Installation Steps</Heading>
      <Paragraph>Clone the repository and install dependencies:</Paragraph>
      <UnorderedList>
        <li>Clone the repository from GitHub</li>
        <li>Run pnpm install to install dependencies</li>
        <li>Copy the .env.example file to .env.local</li>
        <li>Configure your environment variables</li>
        <li>Start the development server with pnpm dev</li>
      </UnorderedList>

      <Heading level="h2">Next Steps</Heading>
      <Paragraph>Once your environment is set up, you can:</Paragraph>
      <UnorderedList>
        <li>Explore the codebase structure</li>
        <li>Review the component documentation in Storybook</li>
        <li>Read through the architecture overview</li>
        <li>Start building your first feature</li>
      </UnorderedList>
    </div>
  ),
};

export const ComplexNestedStructure: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Heading level="h2">Project Structure</Heading>
      <Paragraph>
        The application is organized into the following directories:
      </Paragraph>
      <UnorderedList>
        <li>
          <strong>/app</strong> - Next.js App Router pages and API routes
          <UnorderedList>
            <li>(blobs)/ - Authentication and setup pages</li>
            <li>(interview)/ - Interview interface</li>
            <li>dashboard/ - Admin dashboard</li>
          </UnorderedList>
        </li>
        <li>
          <strong>/components</strong> - Shared UI components
          <UnorderedList>
            <li>Based on shadcn/ui</li>
            <li>Organized by feature and type</li>
          </UnorderedList>
        </li>
        <li>
          <strong>/lib</strong> - Core libraries
          <UnorderedList>
            <li>
              interviewer/ - Network Canvas interview engine
              <UnorderedList>
                <li>Redux state in ducks/</li>
                <li>UI components in components/</li>
                <li>Drag & drop in behaviors/</li>
              </UnorderedList>
            </li>
            <li>network-exporters/ - Data export functionality</li>
          </UnorderedList>
        </li>
        <li>
          <strong>/actions</strong> - Server actions for data operations
        </li>
        <li>
          <strong>/queries</strong> - Prisma database queries
        </li>
      </UnorderedList>
    </div>
  ),
};

export const MixedListContent: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Heading level="h2">Typography Best Practices</Heading>
      <UnorderedList>
        <li>
          Use semantic HTML elements like <code>&lt;h1&gt;</code> through{' '}
          <code>&lt;h6&gt;</code> for headings
        </li>
        <li>
          Maintain proper heading hierarchy:
          <UnorderedList>
            <li>Only one h1 per page</li>
            <li>Don&apos;t skip heading levels</li>
            <li>Use headings for structure, not styling</li>
          </UnorderedList>
        </li>
        <li>
          <em>Italic text</em> for subtle emphasis and{' '}
          <strong>bold text</strong> for strong emphasis
        </li>
        <li>
          Keep line length between 45-75 characters for optimal readability
        </li>
      </UnorderedList>
    </div>
  ),
};
