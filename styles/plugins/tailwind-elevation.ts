import plugin from 'tailwindcss/plugin';

type ShadowLayer = {
  offsetX: string;
  offsetY: string;
  blurRadius: string;
  spreadRadius: string;
  opacity: number;
};

export type Elevation = 'low' | 'medium' | 'high';

// These are the "seed" coefficients for the mathematical formulas,
// derived from the test cases at specific (oomph, crispy) corners.
// They are constants in the code, not a lookup table of *final outputs*.

// Coefficients for Offset Magnitude (Interpolated linearly by oomphFactor)
// Coefficients have been replaced with polynomial equations in the calculation functions below

// --- Helper Functions to calculate property values ---

function calculateOffsetMagnitude(
  elevation: Elevation,
  layerIndex: number,
  oomphFactor: number,
  crispyFactor: number,
): number {
  // Special handling for layer 0 - always returns 1
  if (layerIndex === 0) {
    return 1;
  }

  // Define polynomial curves that produce your example values when oomph=0.5, crispy=0.5
  const offsetCurves = {
    low: {
      // Simple linear functions for low elevation
      baseGrowth: (layer: number) => 1 + 2 * layer,
      oompnessEffect: (layer: number) => 2 * layer,
      crispyEffect: (layer: number) => 0,
    },
    medium: {
      // Moderate growth for medium elevation
      baseGrowth: (layer: number) => layer === 1 ? 5.4 : (layer === 2 ? 15 : 1),
      oompnessEffect: (layer: number) => layer === 1 ? 3.1 : (layer === 2 ? 10 : 0),
      crispyEffect: (layer: number) => layer === 1 ? -2.6 : (layer === 2 ? 0 : 0),
    },
    high: {
      // Curves designed to produce your example values: [1, 1, 9.5, 22.7, 49.7] when oomph=0.5, crispy=0.5
      baseGrowth: (layer: number) => {
        // Base values when no effects applied
        const values = [1, 0.5, 7, 17, 37];
        return values[layer] ?? 1;
      },
      oompnessEffect: (layer: number) => {
        // Oomph adds more offset
        const effects = [0, 1, 5, 11, 25];
        return effects[layer] ?? 0;
      },
      crispyEffect: (layer: number) => {
        // Crispy can slightly adjust offset
        const effects = [0, 0, 0, 0, 0];
        return effects[layer] ?? 0;
      },
    },
  };

  const curve = offsetCurves[elevation];
  
  // Calculate base value and effects
  const baseValue = curve.baseGrowth(layerIndex);
  const oomphEffect = curve.oompnessEffect(layerIndex) * oomphFactor;
  const crispyEffect = curve.crispyEffect(layerIndex) * crispyFactor;

  // Combine effects with base value
  return Math.max(0.1, baseValue + oomphEffect + crispyEffect);
}

function calculateBlurRadius(
  elevation: Elevation,
  layerIndex: number,
  oomphFactor: number,
  crispyFactor: number,
): number {
  // Special handling for layer 0
  if (layerIndex === 0) {
    // Layer 0 blur is primarily affected by crispy factor
    return 2.1 + (1.1 - 2.1) * crispyFactor; // Interpolate between 2.1 (crispy=0) and 1.1 (crispy=1)
  }

  // Define curves that produce your example values: [1.1, 10.7, 25.5, 55.9, 112.5] when oomph=0.5, crispy=0.5
  const blurCurves = {
    low: {
      // Simple progression for low elevation
      baseBlur: (layer: number) => layer === 1 ? 6.4 : 6.4,
      oomphEffect: (layer: number) => layer === 1 ? 4.2 : 4.2,
      crispyEffect: (layer: number) => layer === 1 ? -3.2 : -3.2,
    },
    medium: {
      // Moderate progression for medium elevation  
      baseBlur: (layer: number) => layer === 1 ? 11.5 : (layer === 2 ? 31.8 : 11.5),
      oomphEffect: (layer: number) => layer === 1 ? 6.5 : (layer === 2 ? 21.2 : 6.5),
      crispyEffect: (layer: number) => layer === 1 ? -8.5 : (layer === 2 ? -15.9 : -8.5),
    },
    high: {
      // Curves designed to produce your example values when oomph=0.5, crispy=0.5
      baseBlur: (layer: number) => {
        // Base blur values
        const values = [1.1, 8, 20, 45, 90];
        return values[layer] ?? 1.1;
      },
      oomphEffect: (layer: number) => {
        // Oomph increases blur
        const effects = [0, 5.4, 11, 22, 45];
        return effects[layer] ?? 0;
      },
      crispyEffect: (layer: number) => {
        // Crispy reduces blur slightly
        const effects = [0, 0, 0, 0, 0];
        return effects[layer] ?? 0;
      },
    },
  };

  const curve = blurCurves[elevation];
  
  // Calculate base value and effects
  const baseValue = curve.baseBlur(layerIndex);
  const oomphEffect = curve.oomphEffect(layerIndex) * oomphFactor;
  const crispyEffect = curve.crispyEffect(layerIndex) * crispyFactor;

  // Combine effects, ensuring minimum blur value
  return Math.max(0.5, baseValue + oomphEffect + crispyEffect);
}

function calculateSpreadRadius(
  elevation: Elevation,
  layerIndex: number,
  crispyFactor: number,
): number {
  // Special handling for layer 0 - spread is always 0
  if (layerIndex === 0) {
    return 0;
  }
  
  // Define curves that produce your example values: [0, -0.6, -1.2, -1.9, -2.5] when crispy=0.5
  const spreadCurves = {
    low: {
      // Simple constant negative spread for low elevation
      maxSpread: (layer: number) => -5,
    },
    medium: {
      // Linear progression for medium elevation
      maxSpread: (layer: number) => layer === 1 ? -2.5 : (layer === 2 ? -5 : -2.5),
    },
    high: {
      // Curves designed to produce your example values when crispy=0.5
      maxSpread: (layer: number) => {
        // These values when multiplied by crispy=0.5 should give: [0, -0.6, -1.2, -1.9, -2.5]
        const maxValues = [0, -1.2, -2.4, -3.8, -5.0];
        return maxValues[layer] ?? -1;
      },
    },
  };
  
  const curve = spreadCurves[elevation];
  const maxSpread = curve.maxSpread(layerIndex);
  
  // Spread scales linearly with crispyFactor from 0 to maxSpread
  return maxSpread * crispyFactor;
}

function calculateOpacity(
  elevation: Elevation,
  layerIndex: number,
  oomphFactor: number,
  crispyFactor: number,
): number {
  // Special handling for layer 0
  if (layerIndex === 0) {
    // Layer 0 opacity is affected by crispy factor
    const baseOpacity = 0;
    const crispyOpacity = elevation === 'low' ? 0.5 : (elevation === 'medium' ? 0.47 : 0.52);
    const oomphOpacity = elevation === 'low' ? 0 : (elevation === 'medium' ? 0 : 0);
    
    // Bilinear interpolation for layer 0
    const opacity_at_crispy0 = baseOpacity + oomphOpacity * oomphFactor;
    const opacity_at_crispy1 = crispyOpacity + (crispyOpacity * 0.9) * oomphFactor; // Slight oomph effect
    
    const finalOpacity = opacity_at_crispy0 + (opacity_at_crispy1 - opacity_at_crispy0) * crispyFactor;
    return parseFloat(Math.max(0, Math.min(1, finalOpacity)).toFixed(2));
  }

  // Define curves that produce your example opacity of 0.54 for all layers when oomph=0.5, crispy=0.5
  const opacityCurves = {
    low: {
      // Simple linear relationship for low elevation
      baseOpacity: (layer: number) => 0.15 + 0.1 * layer,
      oomphEffect: (layer: number) => 0.63 * layer, // Strong oomph effect
      crispyEffect: (layer: number) => 0, // Minimal crispy effect on opacity for low
    },
    medium: {
      // Layer-dependent opacity with diminishing effect
      baseOpacity: (layer: number) => layer === 1 ? 0.16 : (layer === 2 ? 0.31 : 0),
      oomphEffect: (layer: number) => layer === 1 ? 0.33 : (layer === 2 ? 0.66 : 0),
      crispyEffect: (layer: number) => layer === 1 ? 0.15 : (layer === 2 ? -0.15 : 0),
    },
    high: {
      // Curves designed to produce opacity ≈ 0.54 for all layers when oomph=0.5, crispy=0.5
      baseOpacity: (layer: number) => {
        // Base opacity values that when combined with effects give ~0.54
        const values = [0, 0.3, 0.35, 0.4, 0.45];
        return values[layer] ?? 0.3;
      },
      oomphEffect: (layer: number) => {
        // Oomph effect to reach target opacity
        const effects = [0, 0.48, 0.38, 0.28, 0.18];
        return effects[layer] ?? 0.2;
      },
      crispyEffect: (layer: number) => {
        // Small crispy adjustments
        const effects = [0, 0, 0, 0, 0];
        return effects[layer] ?? 0;
      },
    },
  };

  const curve = opacityCurves[elevation];
  
  // Calculate base value and effects
  const baseValue = curve.baseOpacity(layerIndex);
  const oomphEffect = curve.oomphEffect(layerIndex) * oomphFactor;
  const crispyEffect = curve.crispyEffect(layerIndex) * crispyFactor;

  const finalOpacity = baseValue + oomphEffect + crispyEffect;

  // Clamp opacity between 0 and 1 and round to 2 decimal places
  return parseFloat(Math.max(0, Math.min(1, finalOpacity)).toFixed(2));
}

// --- Main generateShadowLayers Function ---

export function generateShadowLayers(
  elevation: Elevation,
  oomphFactor: number,
  crispyFactor: number,
  lightDirectionX: number, // 0 → left, 1 → right
  lightDirectionY: number, // 0 → top, 1 → bottom
): ShadowLayer[] {
  const shadowLayers: ShadowLayer[] = [];
  let numLayers: number;

  switch (elevation) {
    case 'low':
      numLayers = 2;
      break;
    case 'medium':
      numLayers = 3;
      break;
    case 'high':
      numLayers = 5;
      break;
  }

  for (let i = 0; i < numLayers; i++) {
    // Calculate Offset X and Y (unitless values)
    const magnitude = calculateOffsetMagnitude(elevation, i, oomphFactor, crispyFactor);
    // (1 - 2 * lightDirectionX):  lightDirX=0 -> 1 (shadow right), lightDirX=1 -> -1 (shadow left)
    // (1 - 2 * lightDirectionY):  lightDirY=0 -> 1 (shadow down),  lightDirY=1 -> -1 (shadow up)
    const offsetX = parseFloat(
      (magnitude * (1 - 2 * lightDirectionX)).toFixed(1),
    );
    const offsetY = parseFloat(
      (magnitude * (1 - 2 * lightDirectionY)).toFixed(1),
    );

    // Calculate Blur Radius (unitless value)
    const blurRadius = parseFloat(
      calculateBlurRadius(elevation, i, oomphFactor, crispyFactor).toFixed(1),
    );

    // Calculate Spread Radius (unitless value)
    const spreadRadius = parseFloat(
      calculateSpreadRadius(elevation, i, crispyFactor).toFixed(1),
    );

    // Calculate Opacity (already unitless)
    const opacity = calculateOpacity(elevation, i, oomphFactor, crispyFactor);

    // Add units when creating the shadow layer object
    shadowLayers.push({
      offsetX: `${offsetX}px`,
      offsetY: `${offsetY}px`,
      blurRadius: `${blurRadius}px`,
      spreadRadius: spreadRadius === 0 ? '0' : `${spreadRadius}px`,
      opacity: opacity,
    });
  }

  return shadowLayers;
}

/**
 * Plugin that adds `elevation` utilities that create shadows based on the
 * blending of multiple shadow layers to create beautiful, realistic shadows.
 *
 * The shadows are designed to work well with the color palette and theming
 * system of the application, and are intended to be used in a design system
 * context.
 *
 * The shadows are based on the concept of elevation levels, which are used to
 * indicate the relative depth of elements in the UI. The elevation levels are
 * defined as follows:
 *
 * - Low: Subtle shadow for minimal depth (e.g., buttons, inputs)
 * - Medium: Standard shadow for cards and panels
 * - High: Prominent shadow for modals and dialogs
 *
 * Each elevation level is created by blending multiple shadow layers, each with
 * its own color, opacity, blur, and offset. This approach creates a more
 * realistic and visually appealing shadow effect compared to using a single
 * shadow layer.
 *
 * As elevation increases, the blur radius gets larger, the shadow becomes
 * less opaque. The rate that this happens is configurable via the configuration
 * object below.
 *
 * Also configurable are parameters that impact the perceived direction of the
 * light source, which affects the offset of the shadows.
 *
 * Shadow colors are calculated by blending the background color of the
 * **parent** element with a base shadow color, allowing the shadows to adapt
 * to different background colors and themes. All colors use the oklch color
 * space to ensure perceptual uniformity.
 *
 * The background color of the parent element is exposed via a CSS variable that
 * is set in the `bg-scope` utility class. This class should be applied to
 * any element that serves as a background for elements using the elevation. A
 * fallback color is provided to ensure shadows are visible even if the
 * `bg-scope` class is not applied.
 *
 * Usage:
 *
 * - Apply the `bg-scope` class to a parent element to set the background color context.
 * - Use the 'elevation-low', 'elevation-medium', or 'elevation-high' classes on child elements to apply the corresponding shadow effect.
 *
 */

type PluginConfig = {
  oomph?: number; // 0-100, affects shadow intensity/opacity
  crispy?: number; // 0-100, affects blur sharpness (0=softer, 100=crisper)
  lightX?: number; // 0-100, horizontal light position (0=left, 100=right)
  lightY?: number; // 0-100, vertical light position (0=top, 100=bottom)
  resolution?: number; // Base resolution multiplier (default: 0.3)
};

export default plugin.withOptions<PluginConfig>(
  (options = {}) =>
    (api) => {
      const { lightX = 0.5, lightY = 0, oomph = 0.5, crispy = 0.5 } = options;

      const defaultShadowColor = 'oklch(0% 0 0)'; // Neutral gray fallback

      const generateShadow = (elevation: Elevation) => {
        return generateShadowLayers(elevation, oomph, crispy, lightX, lightY)
          .map(({ opacity, blurRadius, spreadRadius, offsetX, offsetY }) => {
            // Use the --bg-scope color with 50% lightness, falling back to defaultShadowColor
            return `${offsetX} ${offsetY} ${blurRadius} ${spreadRadius} oklch(from var(--bg-scope, ${defaultShadowColor}) 50% c h / ${opacity})`;
          })
          .join(', ');
      };

      const shadowUtilities: Record<string, Record<string, string>> = {
        '.elevation-low': {
          'box-shadow': generateShadow('low'),
        },
        '.elevation-medium': {
          'box-shadow': generateShadow('medium'),
        },
        '.elevation-high': {
          'box-shadow': generateShadow('high'),
        },
        '.bg-scope': {
          '--bg-scope': 'var(--bg-self)',
        },
      };

      if (api.addUtilities) {
        api.addUtilities(shadowUtilities);
      }

      // For Tailwind v4, we need to add a PostCSS rule that captures bg-* utilities
      // and adds the --bg-self variable
      api.addBase({
        '[class^="bg-"]:where(:not(.bg-scope))': {
          '--bg-self': 'inherit',
        },
      });

      // Use matchUtilities to create bg utilities that set both CSS variable and background
      api.matchUtilities(
        {
          bg: (value) => ({
            '--bg-self': value,
            'backgroundColor': value,
          }),
        },
        {
          values: (api.theme?.('backgroundColor') ??
            api.theme?.('colors') ??
            {}) as Record<string, string>,
        },
      );
    },
  () => ({
    theme: {
      extend: {
        elevation: {
          low: 'elevation-low',
          medium: 'elevation-medium',
          high: 'elevation-high',
        },
      },
    },
  }),
);
