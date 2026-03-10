import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import React from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';

const meta: Meta = {
  title: 'Design System/Elevation',
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: true },
  },
  tags: ['autodocs'],
};

export default meta;

// Shadow Elevation Levels
export const ElevationLevels: StoryFn = () => (
  <div className="bg-background publish-colors h-screen space-y-8 p-8">
    <Heading level="h2" margin="none" className="text-text mb-6">
      Elevation Levels
    </Heading>
    <Paragraph margin="none" className="mb-8 text-current/70">
      Three elevation levels create depth hierarchy using mathematically
      generated multi-layer shadows.
    </Paragraph>
    <div className="grid grid-cols-3 gap-8">
      <div className="bg-surface elevation-low rounded-lg p-6">
        <Heading level="h3" margin="none" className="text-surface-contrast">
          Low Elevation
        </Heading>
        <Paragraph margin="none" className="text-surface-contrast/50">
          2 shadow layers for buttons and inputs
        </Paragraph>
      </div>
      <div className="bg-surface elevation-medium rounded-lg p-6">
        <Heading level="h3" margin="none" className="text-surface-contrast">
          Medium Elevation
        </Heading>
        <Paragraph margin="none" className="text-surface-contrast/50">
          3 shadow layers for cards and panels
        </Paragraph>
      </div>
      <div className="bg-surface elevation-high rounded-lg p-6">
        <Heading level="h3" margin="none" className="text-surface-contrast">
          High Elevation
        </Heading>
        <Paragraph margin="none" className="text-surface-contrast/50">
          5 shadow layers for modals and dialogs
        </Paragraph>
      </div>
    </div>
  </div>
);

// Color Inheritance Demo
export const ColorInheritance: StoryFn = () => (
  <div className="bg-background publish-colors h-screen space-y-8 p-8">
    <Heading level="h2" margin="none" className="text-text mb-6">
      Automatic Shadow Color Inheritance
    </Heading>
    <div className="grid grid-cols-2 gap-8">
      <div className="bg-cerulean-blue publish-colors elevation-high rounded-xl p-12">
        <Heading level="h3" margin="none" className="mb-4 text-white">
          Cerulean Blue Background
        </Heading>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <Paragraph margin="none" className="text-surface-contrast">
            Modal with blue-derived shadow
          </Paragraph>
        </div>
      </div>

      <div className="bg-sea-green publish-colors elevation-high rounded-xl p-12">
        <Heading level="h3" margin="none" className="mb-4 text-white">
          Sea Green Background
        </Heading>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <Paragraph margin="none" className="text-surface-contrast">
            Modal with green-derived shadow
          </Paragraph>
        </div>
      </div>

      <div className="bg-purple-pizazz publish-colors elevation-high rounded-xl p-12">
        <Heading level="h3" margin="none" className="mb-4 text-white">
          Purple Pizazz Background
        </Heading>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <Paragraph margin="none" className="text-surface-contrast">
            Modal with purple-derived shadow
          </Paragraph>
        </div>
      </div>

      <div className="bg-neon-carrot publish-colors elevation-high rounded-xl p-12">
        <Heading level="h3" margin="none" className="mb-4 text-white">
          Neon Carrot Background
        </Heading>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <Paragraph margin="none" className="text-surface-contrast">
            Modal with orange-derived shadow
          </Paragraph>
        </div>
      </div>
    </div>
  </div>
);

// Nested Scoping
export const NestedScoping: StoryFn = () => (
  <div className="bg-neon-coral publish-colors h-screen p-8">
    <Heading level="h2" margin="none" className="mb-6 text-white">
      Nested Shadow Scoping
    </Heading>
    <Paragraph margin="none" className="mb-8 text-white opacity-80">
      Inner scopes override outer ones, allowing for complex shadow inheritance
      patterns.
    </Paragraph>

    <div className="bg-cerulean-blue publish-colors rounded-lg p-6">
      <Heading level="h3" margin="none" className="mb-4 text-white">
        Cerulean Blue Scope Override
      </Heading>
      <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
        <Paragraph margin="none" className="text-surface-1-contrast">
          Card inherits blue shadows
        </Paragraph>
      </div>

      <div className="bg-kiwi publish-colors rounded p-4">
        <Heading level="h4" margin="none" className="mb-3 text-white">
          Kiwi Nested Scope
        </Heading>
        <div className="bg-surface-1 elevation-medium rounded p-3">
          <Paragraph margin="none" className="text-surface-1-contrast text-sm">
            Card inherits green shadows
          </Paragraph>
        </div>
      </div>
    </div>
  </div>
);

// Chroma Mapping Demonstration
export const ChromaMapping: StoryFn<{
  hue: number;
  lightness: number;
  elevation: 'low' | 'medium' | 'high';
}> = ({ hue = 280, lightness = 95, elevation = 'medium' }) => {
  return (
    <div className="bg-surface p-2">
      <div>
        <Heading level="h2" margin="none" className="text-text">
          Shadow Chroma Mapping
        </Heading>
        <Paragraph margin="none" className="text-text mb-4 opacity-70">
          All backgrounds use the same hue ({hue}°) and lightness ({lightness}
          %), only chroma varies.
        </Paragraph>
        <div className="grid grid-cols-3">
          {[
            0.01, 0.02, 0.04, 0.06, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32,
            0.4,
          ].map((chroma) => {
            const bgColor = `oklch(${lightness}% ${chroma} ${hue})`;
            return (
              <div
                key={chroma}
                className="flex flex-col items-center p-12"
                style={
                  {
                    'backgroundColor': bgColor,
                    '--published-bg': bgColor,
                  } as React.CSSProperties
                }
              >
                <div
                  key={chroma}
                  className={cx(
                    'bg-surface text-surface-contrast flex items-center justify-center rounded-xl p-6',
                    elevation === 'low' && 'elevation-low',
                    elevation === 'medium' && 'elevation-medium',
                    elevation === 'high' && 'elevation-high',
                  )}
                >
                  <Heading
                    level="h4"
                    margin="none"
                    className="text-sm opacity-70"
                  >
                    Chroma: {chroma.toFixed(2)}
                  </Heading>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

ChromaMapping.args = {
  hue: 280,
  lightness: 95,
  elevation: 'medium',
};

ChromaMapping.argTypes = {
  hue: {
    control: { type: 'range', min: 0, max: 360, step: 1 },
    description: 'Hue angle in degrees (0-360)',
  },
  lightness: {
    control: { type: 'range', min: 0, max: 100, step: 1 },
    description: 'Lightness percentage (0-100%)',
  },
  elevation: {
    control: { type: 'select' },
    options: ['low', 'medium', 'high'],
    description: 'Elevation level for shadows',
  },
};
