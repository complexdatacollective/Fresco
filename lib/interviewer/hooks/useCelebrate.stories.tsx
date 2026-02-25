'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef } from 'react';
import Button from '~/components/ui/Button';
import { useCelebrate } from './useCelebrate';

const meta = {
  title: 'Hooks/useCelebrate',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
    docs: {
      description: {
        component:
          'A hook that provides a spring scale bounce animation on the referenced element, with an optional particle burst effect. Used for positive feedback when nodes are added or categorized.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const celebrate = useCelebrate(ref, {});

    return (
      <div className="flex flex-col items-center gap-6">
        <div
          ref={ref}
          className="bg-primary text-primary-foreground flex size-28 items-center justify-center rounded-full text-lg font-semibold"
        >
          Add
        </div>
        <Button onClick={celebrate}>Celebrate (Defaults)</Button>
      </div>
    );
  },
};

export const SingleColor: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const celebrate = useCelebrate(ref, {
      particleColor: 'oklch(0.7 0.25 330)',
    });

    return (
      <div className="flex flex-col items-center gap-6">
        <div
          ref={ref}
          className="flex size-28 items-center justify-center rounded-full bg-[oklch(0.7_0.25_330)] text-lg font-semibold text-white"
        >
          Add
        </div>
        <Button onClick={celebrate}>Single Color</Button>
      </div>
    );
  },
};

export const ColorPalette: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const celebrate = useCelebrate(ref, {
      particleColor: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'],
    });

    return (
      <div className="flex flex-col items-center gap-6">
        <div
          ref={ref}
          className="bg-primary text-primary-foreground flex size-28 items-center justify-center rounded-full text-lg font-semibold"
        >
          Add
        </div>
        <Button onClick={celebrate}>Palette</Button>
      </div>
    );
  },
};

export const ParticleSizes: Story = {
  render: () => {
    const smallRef = useRef<HTMLDivElement>(null);
    const mediumRef = useRef<HTMLDivElement>(null);
    const largeRef = useRef<HTMLDivElement>(null);
    const celebrateSmall = useCelebrate(smallRef, { particleSize: 'small' });
    const celebrateMedium = useCelebrate(mediumRef, { particleSize: 'medium' });
    const celebrateLarge = useCelebrate(largeRef, { particleSize: 'large' });

    return (
      <div className="flex items-start gap-12">
        <div className="flex flex-col items-center gap-4">
          <div
            ref={smallRef}
            className="bg-primary text-primary-foreground flex size-20 items-center justify-center rounded-full text-sm font-semibold"
          >
            Small
          </div>
          <Button onClick={celebrateSmall} size="sm">
            Small
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div
            ref={mediumRef}
            className="bg-primary text-primary-foreground flex size-24 items-center justify-center rounded-full font-semibold"
          >
            Medium
          </div>
          <Button onClick={celebrateMedium} size="sm">
            Medium
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div
            ref={largeRef}
            className="bg-primary text-primary-foreground flex size-28 items-center justify-center rounded-full text-lg font-semibold"
          >
            Large
          </div>
          <Button onClick={celebrateLarge} size="sm">
            Large
          </Button>
        </div>
      </div>
    );
  },
};

export const WithoutParticles: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const celebrate = useCelebrate(ref, { particles: false });

    return (
      <div className="flex flex-col items-center gap-6">
        <div
          ref={ref}
          className="bg-primary text-primary-foreground flex size-28 items-center justify-center rounded-full text-lg font-semibold"
        >
          Drop
        </div>
        <Button onClick={celebrate}>Bounce Only</Button>
      </div>
    );
  },
};
