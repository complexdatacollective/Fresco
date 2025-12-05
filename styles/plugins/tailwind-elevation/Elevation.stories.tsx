import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import React from 'react';
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
    <h2 className="text-text mb-6 text-2xl font-bold">Elevation Levels</h2>
    <p className="mb-8 text-current/70">
      Three elevation levels create depth hierarchy using mathematically
      generated multi-layer shadows.
    </p>
    <div className="grid grid-cols-3 gap-8">
      <div className="bg-surface elevation-low rounded-lg p-6">
        <h3 className="text-surface-contrast font-semibold">Low Elevation</h3>
        <p className="text-surface-contrast/50">
          2 shadow layers for buttons and inputs
        </p>
      </div>
      <div className="bg-surface elevation-medium rounded-lg p-6">
        <h3 className="text-surface-contrast font-semibold">
          Medium Elevation
        </h3>
        <p className="text-surface-contrast/50">
          3 shadow layers for cards and panels
        </p>
      </div>
      <div className="bg-surface elevation-high rounded-lg p-6">
        <h3 className="text-surface-contrast font-semibold">High Elevation</h3>
        <p className="text-surface-contrast/50">
          5 shadow layers for modals and dialogs
        </p>
      </div>
    </div>
  </div>
);

// Color Inheritance Demo
export const ColorInheritance: StoryFn = () => (
  <div className="bg-background publish-colors h-screen space-y-8 p-8">
    <h2 className="text-text mb-6 text-2xl font-bold">
      Automatic Shadow Color Inheritance
    </h2>
    <div className="grid grid-cols-2 gap-8">
      <div className="bg-cerulean-blue publish-colors elevation-high rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">
          Cerulean Blue Background
        </h3>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with blue-derived shadow
          </p>
        </div>
      </div>

      <div className="bg-sea-green publish-colors elevation-high rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">Sea Green Background</h3>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with green-derived shadow
          </p>
        </div>
      </div>

      <div className="bg-purple-pizazz publish-colors elevation-high rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">
          Purple Pizazz Background
        </h3>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with purple-derived shadow
          </p>
        </div>
      </div>

      <div className="bg-neon-carrot publish-colors elevation-high rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">
          Neon Carrot Background
        </h3>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with orange-derived shadow
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Nested Scoping
export const NestedScoping: StoryFn = () => (
  <div className="bg-neon-coral publish-colors h-screen p-8">
    <h2 className="mb-6 text-2xl font-bold text-white">
      Nested Shadow Scoping
    </h2>
    <p className="mb-8 text-white opacity-80">
      Inner scopes override outer ones, allowing for complex shadow inheritance
      patterns.
    </p>

    <div className="bg-cerulean-blue publish-colors rounded-lg p-6">
      <h3 className="mb-4 font-semibold text-white">
        Cerulean Blue Scope Override
      </h3>
      <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
        <p className="text-surface-1-contrast">Card inherits blue shadows</p>
      </div>

      <div className="bg-kiwi publish-colors rounded p-4">
        <h4 className="mb-3 font-medium text-white">Kiwi Nested Scope</h4>
        <div className="bg-surface-1 elevation-medium rounded p-3">
          <p className="text-surface-1-contrast text-sm">
            Card inherits green shadows
          </p>
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
        <h2 className="text-text text-2xl font-bold">Shadow Chroma Mapping</h2>
        <p className="text-text mb-4 opacity-70">
          All backgrounds use the same hue ({hue}°) and lightness ({lightness}
          %), only chroma varies.
        </p>
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
                  <h4 className="text-sm font-semibold opacity-70">
                    Chroma: {chroma.toFixed(2)}
                  </h4>
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
