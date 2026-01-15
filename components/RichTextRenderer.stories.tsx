'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { JSONContent } from '@tiptap/react';
import { useState } from 'react';
import { RichTextEditorField } from '../lib/form/components/fields/RichTextEditor';
import RichTextRenderer from './RichTextRenderer';

const meta: Meta<typeof RichTextRenderer> = {
  title: 'UI/RichTextRenderer',
  component: RichTextRenderer,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content with all supported elements
const sampleContent: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Welcome to the Renderer' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is a paragraph with ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'italic text' },
        { type: 'text', text: ', as well as ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'italic' }],
          text: 'bold italic text',
        },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Features' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Static rendering of JSON content' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Uses the ' },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: 'same typography',
                },
                { type: 'text', text: ' as the editor' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'No editor overhead' }],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Steps to Use' }],
    },
    {
      type: 'orderedList',
      attrs: { start: 1 },
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Import the component' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Pass JSON content as a prop' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Enjoy the rendered output!' }],
            },
          ],
        },
      ],
    },
  ],
};

export const Default: Story = {
  render: () => (
    <div className="w-[600px]">
      <RichTextRenderer content={sampleContent} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-[600px]">
      <RichTextRenderer />
    </div>
  ),
};

// Live preview showing editor and renderer side by side
function LivePreviewComponent() {
  const [content, setContent] = useState<JSONContent>(sampleContent);

  return (
    <div className="flex w-[1200px] gap-8">
      <div className="flex-1">
        <h2 className="mb-4 text-lg font-semibold">Editor</h2>
        <RichTextEditorField
          value={content}
          onChange={setContent}
          placeholder="Start typing..."
        />
      </div>
      <div className="flex-1">
        <h2 className="mb-4 text-lg font-semibold">Rendered Output</h2>
        <div className="rounded-lg border border-current/10 p-6">
          <RichTextRenderer content={content} />
        </div>
      </div>
    </div>
  );
}

export const LivePreview: Story = {
  render: () => <LivePreviewComponent />,
  parameters: {
    layout: 'padded',
  },
};

// Show JSON alongside the renderer
function WithJsonPreviewComponent() {
  const [content, setContent] = useState<JSONContent>(sampleContent);

  return (
    <div className="flex gap-6">
      <div className="shrink-0">
        <h2 className="mb-4 text-lg font-semibold">Editor</h2>
        <RichTextEditorField
          value={content}
          onChange={setContent}
          placeholder="Start typing..."
        />
      </div>
      <div className="shrink-0">
        <h2 className="mb-4 text-lg font-semibold">Rendered Output</h2>
        <div className="rounded-lg border border-current/10 p-6">
          <RichTextRenderer content={content} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <h2 className="mb-4 text-lg font-semibold">JSON Content</h2>
        <pre className="bg-surface-1 text-surface-1-contrast max-h-[500px] overflow-auto rounded-lg p-4 text-xs">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export const WithJsonPreview: Story = {
  render: () => <WithJsonPreviewComponent />,
  parameters: {
    layout: 'fullscreen',
  },
};
