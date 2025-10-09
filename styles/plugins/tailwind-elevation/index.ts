import plugin from 'tailwindcss/plugin';
import { type Elevation, generateShadowLayers } from './jwc';

type ShadowLayer = {
  offsetX: string;
  offsetY: string;
  blurRadius: string;
  spreadRadius: string;
  opacity: number;
};

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
  oomph?: number; // 0-1, affects shadow intensity/opacity
  crispy?: number; // 0-1, affects blur sharpness (0=softer, 1=crisper)
  lightX?: number; // 0-1, horizontal light position (0=left, 1=right)
  lightY?: number; // 0-1, vertical light position (0=top, 1=bottom)
  resolution?: number; // 0-1, affects detail level of shadow layers
};

export default plugin.withOptions<PluginConfig>(
  (options = {}) =>
    (api) => {
      const {
        lightX = 0,
        lightY = -0.5,
        oomph = 0.5,
        crispy = 0.75,
        resolution = 0.3,
      } = options;

      const defaultShadowColor = 'oklch(100% 1 0)';

      const generateShadow = (elevation: Elevation) => {
        return generateShadowLayers(
          elevation,
          oomph,
          crispy,
          {
            x: lightX,
            y: lightY,
          },
          resolution,
        )
          .map(({ opacity, blurRadius, spreadRadius, offsetX, offsetY }) => {
            // Create shadows by reducing background lightness by 40%
            return `${offsetX} ${offsetY} ${blurRadius} ${spreadRadius} oklch(from var(--bg-scope, ${defaultShadowColor}) calc(l * 0.75) c h / ${opacity})`;
          })
          .join(', ');
      };

      const shadowUtilities: Record<string, Record<string, string>> = {
        '.elevation-none': {
          'box-shadow': 'none',
        },
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
