import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import React from 'react';

const meta: Meta = {
  title: 'Systems/Elevation',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

// Shadow Elevation Levels
export const ElevationLevels: StoryFn = () => (
  <div className="bg-surface bg-scope h-screen space-y-8 p-8">
    <h2 className="text-text mb-6 text-2xl font-bold">Elevation Levels</h2>
    <p className="text-text mb-8 opacity-70">
      Three elevation levels create depth hierarchy using mathematically
      generated multi-layer shadows.
    </p>
    <div className="grid grid-cols-3 gap-8">
      <div className="bg-surface-1 elevation-low rounded-lg p-6">
        <h3 className="text-surface-1-contrast mb-2 font-semibold">
          Low Elevation
        </h3>
        <p className="text-surface-1-contrast opacity-70">
          2 shadow layers for buttons and inputs
        </p>
      </div>
      <div className="bg-surface-1 elevation-medium rounded-lg p-6">
        <h3 className="text-surface-1-contrast mb-2 font-semibold">
          Medium Elevation
        </h3>
        <p className="text-surface-1-contrast opacity-70">
          3 shadow layers for cards and panels
        </p>
      </div>
      <div className="bg-surface-1 elevation-high rounded-lg p-6">
        <h3 className="text-surface-1-contrast mb-2 font-semibold">
          High Elevation
        </h3>
        <p className="text-surface-1-contrast opacity-70">
          5 shadow layers for modals and dialogs
        </p>
      </div>
    </div>
  </div>
);

// Color Inheritance Demo
export const ColorInheritance: StoryFn = () => (
  <div className="bg-background h-screen space-y-8 p-8">
    <h2 className="text-text mb-6 text-2xl font-bold">
      Automatic Shadow Color Inheritance
    </h2>
    <p className="text-text mb-8 opacity-70">
      Shadows automatically inherit and adapt to their parent&apos;s background
      color using the{' '}
      <code className="bg-surface-1 rounded px-1">bg-scope</code> utility.
    </p>

    <div className="grid grid-cols-2 gap-8">
      <div className="bg-cerulean-blue bg-scope rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">
          Cerulean Blue Background
        </h3>
        <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
          <p className="text-surface-1-contrast">
            Card with blue-derived shadow
          </p>
        </div>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with blue-derived shadow
          </p>
        </div>
      </div>

      <div className="bg-sea-green bg-scope rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">Sea Green Background</h3>
        <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
          <p className="text-surface-1-contrast">
            Card with green-derived shadow
          </p>
        </div>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with green-derived shadow
          </p>
        </div>
      </div>

      <div className="bg-purple-pizazz bg-scope rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">
          Purple Pizazz Background
        </h3>
        <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
          <p className="text-surface-1-contrast">
            Card with purple-derived shadow
          </p>
        </div>
        <div className="bg-surface elevation-high rounded-lg p-4">
          <p className="text-surface-contrast">
            Modal with purple-derived shadow
          </p>
        </div>
      </div>

      <div className="bg-neon-carrot bg-scope rounded-xl p-12">
        <h3 className="mb-4 font-semibold text-white">
          Neon Carrot Background
        </h3>
        <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
          <p className="text-surface-1-contrast">
            Card with orange-derived shadow
          </p>
        </div>
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
  <div className="bg-neon-coral bg-scope h-screen p-8">
    <h2 className="mb-6 text-2xl font-bold text-white">
      Nested Shadow Scoping
    </h2>
    <p className="mb-8 text-white opacity-80">
      Inner scopes override outer ones, allowing for complex shadow inheritance
      patterns.
    </p>

    <div className="bg-cerulean-blue bg-scope rounded-lg p-6">
      <h3 className="mb-4 font-semibold text-white">
        Cerulean Blue Scope Override
      </h3>
      <div className="bg-surface-1 elevation-medium mb-4 rounded-lg p-4">
        <p className="text-surface-1-contrast">Card inherits blue shadows</p>
      </div>

      <div className="bg-kiwi bg-scope rounded p-4">
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
export const ChromaMapping: StoryFn = () => {
  return (
    <div className="bg-surface space-y-8 p-8">
      <h2 className="text-text mb-6 text-2xl font-bold">
        Shadow Chroma Mapping
      </h2>

      {/* Visual demonstration with actual colors */}
      <div>
        <p className="text-text mb-6 opacity-70">
          All backgrounds use the same hue (280°) and lightness (95%), only
          chroma varies.
        </p>
        <div className="grid grid-cols-3">
          {[
            0.01, 0.02, 0.04, 0.06, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32,
            0.4,
          ].map((chroma) => {
            const bgColor = `oklch(95% ${chroma} 280)`;
            return (
              <div
                key={chroma}
                className="flex flex-col items-center p-12"
                style={
                  {
                    'backgroundColor': bgColor,
                    '--bg-scope': bgColor,
                  } as React.CSSProperties
                }
              >
                <div
                  key={chroma}
                  className="elevation-high bg-surface text-surface-contrast flex items-center justify-center rounded-xl p-6"
                >
                  <h4 className="mb-2 text-sm font-semibold opacity-70">
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
