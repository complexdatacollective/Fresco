import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { User } from 'lucide-react';
import { cx } from '~/utils/cva';

const meta: Meta = {
  title: 'Design System/Inset Surface',
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: true },
  },
  tags: ['autodocs'],
};

export default meta;

const colors = [
  { name: 'primary/10', bg: 'bg-primary/10', text: 'text-primary' },
  { name: 'info', bg: 'bg-info', text: 'text-info-contrast' },
  { name: 'success', bg: 'bg-success', text: 'text-success-contrast' },
  { name: 'warning', bg: 'bg-warning', text: 'text-warning-contrast' },
  {
    name: 'destructive',
    bg: 'bg-destructive',
    text: 'text-destructive-contrast',
  },
  { name: 'surface-1', bg: 'bg-surface-1', text: 'text-surface-1-contrast' },
  { name: 'cerulean-blue', bg: 'bg-cerulean-blue', text: 'text-white' },
  { name: 'sea-green', bg: 'bg-sea-green', text: 'text-white' },
  { name: 'neon-coral', bg: 'bg-neon-coral', text: 'text-white' },
  { name: 'purple-pizazz', bg: 'bg-purple-pizazz', text: 'text-white' },
];

export const Comparison: StoryFn = () => (
  <div className="bg-background publish-colors min-h-screen space-y-8 p-8">
    <h2 className="text-text text-2xl font-bold">
      Inset Surface: With vs Without
    </h2>
    <p className="text-text/70">
      Each pair shows the same background color without (left) and with (right)
      the inset-surface utility.
    </p>
    <div className="grid grid-cols-2 gap-6">
      {colors.map(({ name, bg, text }) => (
        <div key={name} className="flex items-center gap-4">
          <div
            className={cx(
              bg,
              text,
              'flex h-16 flex-1 items-center justify-center rounded-lg text-sm font-medium',
            )}
          >
            {name}
          </div>
          <div
            className={cx(
              bg,
              text,
              'inset-surface flex h-16 flex-1 items-center justify-center rounded-lg text-sm font-medium',
            )}
          >
            {name} + inset
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const Shapes: StoryFn = () => (
  <div className="bg-background publish-colors min-h-screen space-y-8 p-8">
    <h2 className="text-text text-2xl font-bold">Shapes</h2>
    <p className="text-text/70">
      The inset effect works on any shape: rounded, pill, square, and circular.
    </p>
    <div className="flex flex-wrap items-center gap-6">
      <div className="bg-primary/10 text-primary inset-surface flex h-20 w-40 items-center justify-center rounded-lg text-sm font-medium">
        Rounded
      </div>
      <div className="bg-primary/10 text-primary inset-surface flex h-12 w-32 items-center justify-center rounded-full text-sm font-medium">
        Pill
      </div>
      <div className="bg-primary/10 text-primary inset-surface flex size-20 items-center justify-center text-sm font-medium">
        Square
      </div>
      <div className="bg-primary/10 text-primary inset-surface flex size-14 items-center justify-center rounded-full">
        <User className="size-7" />
      </div>
    </div>
  </div>
);

export const IconContainers: StoryFn = () => (
  <div className="bg-background publish-colors min-h-screen space-y-8 p-8">
    <h2 className="text-text text-2xl font-bold">Icon Containers</h2>
    <p className="text-text/70">
      Common use case: circular icon containers with inset appearance.
    </p>
    <div className="flex flex-wrap items-center gap-6">
      {colors.slice(0, 5).map(({ name, bg, text }) => (
        <div
          key={name}
          className={cx(
            bg,
            text,
            'inset-surface flex size-14 items-center justify-center rounded-full',
          )}
        >
          <User className="size-7" />
        </div>
      ))}
    </div>
  </div>
);
