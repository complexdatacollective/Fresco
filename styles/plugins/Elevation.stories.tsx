import type { Meta, StoryFn } from '@storybook/nextjs-vite';

const meta: Meta = {
  title: 'Styles/Elevation System',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

// Shadow Elevation Levels
export const ElevationLevels: StoryFn = () => (
  <div className="bg-surface bg-scope h-full h-screen space-y-8 p-8">
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
      <div className="bg-cerulean-blue bg-scope rounded-xl p-6">
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

      <div className="bg-sea-green bg-scope rounded-xl p-6">
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

      <div className="bg-purple-pizzazz bg-scope rounded-xl p-6">
        <h3 className="mb-4 font-semibold text-white">
          Purple Pizzazz Background
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

      <div className="bg-neon-carrot bg-scope rounded-xl p-6">
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

// Multi-layer Shadow Breakdown
export const MultiLayerBreakdown: StoryFn = () => (
  <div className="bg-surface-1 bg-scope h-screen space-y-8 p-8">
    <h2 className="text-surface-1-contrast mb-6 text-2xl font-bold">
      Multi-Layer Shadow System
    </h2>
    <p className="text-surface-1-contrast mb-8 opacity-70">
      Each elevation level uses multiple shadow layers with different blur,
      spread, and opacity values to create realistic depth.
    </p>

    <div className="grid grid-cols-3 gap-8">
      <div>
        <h3 className="text-surface-1-contrast mb-4 font-semibold">
          Low (2 layers)
        </h3>
        <div className="bg-surface elevation-low mb-4 rounded-lg p-6">
          <p className="text-surface-contrast opacity-70">Combined result</p>
        </div>
        <div className="text-surface-1-contrast font-mono text-xs opacity-60">
          Layer 0: Sharp, minimal offset
          <br />
          Layer 1: Softer, larger offset
        </div>
      </div>

      <div>
        <h3 className="text-surface-1-contrast mb-4 font-semibold">
          Medium (3 layers)
        </h3>
        <div className="bg-surface elevation-medium mb-4 rounded-lg p-6">
          <p className="text-surface-contrast opacity-70">Combined result</p>
        </div>
        <div className="text-surface-1-contrast font-mono text-xs opacity-60">
          Layer 0: Sharp, minimal offset
          <br />
          Layer 1: Medium blur and offset
          <br />
          Layer 2: Soft, large offset
        </div>
      </div>

      <div>
        <h3 className="text-surface-1-contrast mb-4 font-semibold">
          High (5 layers)
        </h3>
        <div className="bg-surface elevation-high mb-4 rounded-lg p-6">
          <p className="text-surface-contrast opacity-70">Combined result</p>
        </div>
        <div className="text-surface-1-contrast font-mono text-xs opacity-60">
          Layer 0: Sharp, minimal offset
          <br />
          Layer 1-4: Progressive blur increase
          <br />
          Maximum depth effect
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

// Usage Patterns
export const UsagePatterns: StoryFn = () => (
  <div className="bg-surface bg-scope h-screen space-y-8 p-8">
    <h2 className="text-text mb-6 text-2xl font-bold">Common Usage Patterns</h2>
    <p className="text-text mb-8 opacity-70">
      How to use the elevation system effectively in real interfaces.
    </p>

    <div className="space-y-8">
      {/* Button Group */}
      <div>
        <h3 className="text-text mb-4 font-semibold">Interactive Elements</h3>
        <div className="flex space-x-4">
          <button className="bg-primary text-primary-contrast elevation-low hover:elevation-medium rounded px-4 py-2 transition-shadow">
            Button
          </button>
          <button className="bg-surface-1 text-surface-1-contrast elevation-low hover:elevation-medium rounded border px-4 py-2 transition-shadow">
            Secondary
          </button>
          <input
            type="text"
            placeholder="Input field"
            className="bg-input text-input-contrast elevation-low focus:elevation-medium rounded border px-3 py-2 transition-shadow outline-none"
          />
        </div>
      </div>

      {/* Card Layout */}
      <div>
        <h3 className="text-text mb-4 font-semibold">Card Layouts</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-1 elevation-medium rounded-lg p-4">
            <h4 className="text-surface-1-contrast mb-2 font-medium">
              Product Card
            </h4>
            <p className="text-surface-1-contrast text-sm opacity-70">
              Standard card for content
            </p>
          </div>
          <div className="bg-surface-1 elevation-medium rounded-lg p-4">
            <h4 className="text-surface-1-contrast mb-2 font-medium">
              Feature Card
            </h4>
            <p className="text-surface-1-contrast text-sm opacity-70">
              Highlighted content
            </p>
          </div>
          <div className="bg-surface-1 elevation-medium rounded-lg p-4">
            <h4 className="text-surface-1-contrast mb-2 font-medium">
              Info Card
            </h4>
            <p className="text-surface-1-contrast text-sm opacity-70">
              Supporting information
            </p>
          </div>
        </div>
      </div>

      {/* Modal Example */}
      <div>
        <h3 className="text-text mb-4 font-semibold">Modal & Overlays</h3>
        <div className="relative">
          <div className="bg-surface-2 rounded-lg p-8 opacity-50">
            <p className="text-surface-2-contrast">
              Background content (dimmed)
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-surface-1 elevation-high max-w-sm rounded-lg p-6">
              <h4 className="text-surface-1-contrast mb-2 font-semibold">
                Modal Dialog
              </h4>
              <p className="text-surface-1-contrast mb-4 text-sm opacity-70">
                High elevation for prominence
              </p>
              <button className="bg-primary text-primary-contrast elevation-low rounded px-3 py-1 text-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Technical Documentation
export const TechnicalDetails: StoryFn = () => (
  <div className="bg-surface h-screen space-y-8 p-8">
    <h2 className="text-text mb-6 text-2xl font-bold">
      Technical Implementation
    </h2>

    <div className="grid grid-cols-2 gap-8">
      <div>
        <h3 className="text-text mb-4 font-semibold">CSS Classes</h3>
        <div className="bg-surface-1 rounded p-4">
          <code className="text-surface-1-contrast text-sm">
            .elevation-low
            <br />
            .elevation-medium
            <br />
            .elevation-high
            <br />
            .bg-scope
          </code>
        </div>
        <p className="text-text mt-4 text-sm opacity-70">
          Apply <code className="bg-surface-2 rounded px-1">bg-scope</code> to
          parent containers, then use elevation classes on child elements.
        </p>
      </div>

      <div>
        <h3 className="text-text mb-4 font-semibold">Shadow Layers</h3>
        <div className="bg-surface-1 rounded p-4">
          <div className="text-surface-1-contrast text-sm">
            <div className="mb-2">
              <strong>Low:</strong> 2 layers
            </div>
            <div className="mb-2">
              <strong>Medium:</strong> 3 layers
            </div>
            <div className="mb-2">
              <strong>High:</strong> 5 layers
            </div>
          </div>
        </div>
        <p className="text-text mt-4 text-sm opacity-70">
          Each layer has calculated offset, blur, spread, and opacity values
          based on mathematical formulas.
        </p>
      </div>

      <div>
        <h3 className="text-text mb-4 font-semibold">Configuration</h3>
        <div className="bg-surface-1 rounded p-4">
          <code className="text-surface-1-contrast text-sm">
            oomph: 0-1 (intensity)
            <br />
            crispy: 0-1 (sharpness)
            <br />
            lightX: 0-1 (horizontal)
            <br />
            lightY: 0-1 (vertical)
          </code>
        </div>
        <p className="text-text mt-4 text-sm opacity-70">
          Plugin accepts configuration options to customize shadow behavior and
          light direction.
        </p>
      </div>

      <div>
        <h3 className="text-text mb-4 font-semibold">Color System</h3>
        <div className="bg-surface-1 rounded p-4">
          <code className="text-surface-1-contrast text-sm">
            oklch(from var(--bg-scope, fallback)
            <br />
            50% c h / opacity)
          </code>
        </div>
        <p className="text-text mt-4 text-sm opacity-70">
          Uses OKLCH color space for perceptual uniformity and automatic color
          derivation from background.
        </p>
      </div>
    </div>

    {/* Usage Example */}
    <div className="bg-sea-serpent bg-scope rounded-lg p-6">
      <h3 className="mb-4 font-semibold text-white">Example Usage</h3>
      <div className="bg-surface-1 elevation-medium mb-4 rounded p-4">
        <code className="text-surface-1-contrast text-sm">
          &lt;div className=&quot;bg-sea-serpent bg-scope&quot;&gt;
          <br />
          &nbsp;&nbsp;&lt;div className=&quot;bg-surface-1
          elevation-medium&quot;&gt;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Card content
          <br />
          &nbsp;&nbsp;&lt;/div&gt;
          <br />
          &lt;/div&gt;
        </code>
      </div>
      <p className="text-sm text-white opacity-80">
        This card demonstrates the code above - sea serpent-tinted shadows
        derived from the parent&apos;s background.
      </p>
    </div>
  </div>
);
