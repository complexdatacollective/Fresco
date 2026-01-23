import plugin from 'tailwindcss/plugin';
import { type Elevation, generateShadowLayers } from './jwc';

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
 * The background color of the parent element is exposed via CSS variables:
 * - `--scoped-bg` is set by `bg-*` utilities on the current element
 * - `--published-bg` is set by the `publish-colors` class, which references `--scoped-bg`
 *
 * To prevent child elements with `bg-*` utilities from overriding the published
 * background (which would break shadow colors), any element with a `bg-*` class
 * but NOT `publish-colors` will have its `--scoped-bg` forced to `inherit`. This
 * ensures elevation shadows always reference the parent's published background.
 *
 * A fallback color is provided to ensure shadows are visible even if
 * `publish-colors` is not applied.
 *
 * Usage:
 *
 * - Apply the `publish-colors` class to a parent element to set the background color context.
 * - Use the 'elevation-low', 'elevation-medium', or 'elevation-high' classes on child elements to apply the corresponding shadow effect.
 * - Child elements can have their own `bg-*` utilities without breaking the elevation shadows.
 * - NOTE: You CANNOT apply `elevation` classes to elements that set their own background color!
 *
 */

type PluginConfig = {
  oomph?: number; // 0-1, affects shadow intensity/opacity
  crispy?: number; // 0-1, affects blur sharpness (0=softer, 1=crisper)
  lightX?: number; // 0-1, horizontal light position (0=left, 1=right)
  lightY?: number; // 0-1, vertical light position (0=top, 1=bottom)
  resolution?: number; // 0-1, affects detail level of shadow layers
  opacityScaleFactor?: number; // multiplier for overall opacity
};

export default plugin.withOptions<PluginConfig>(
  (options = {}) =>
    (api) => {
      const {
        lightX = 0,
        lightY = -0.5,
        oomph = 0.5,
        crispy = 1,
        resolution = 0.5,
        opacityScaleFactor = 0.65,
      } = options;

      const defaultShadowColor = 'oklch(10% 1 180)';

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
            const boostedOpacity = opacity * opacityScaleFactor;
            // Clamp chroma
            return `${offsetX} ${offsetY} ${blurRadius} ${spreadRadius} oklch(from var(--published-bg, ${defaultShadowColor}) clamp(0.025, calc(l - 0.5), 0.1) clamp(0.03, calc(l * 1.3), 0.15) h / ${boostedOpacity})`;
          })
          .join(', ');
      };

      // Reset --scoped-bg on elements with bg-* but not publish-colors
      // This prevents child elements from overriding the published background
      api.addBase({
        '[class*="elevation-"]:where(:not(.publish-colors))': {
          '--scoped-bg': 'inherit !important',
        },
      });

      api.addUtilities({
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
        '.publish-colors': {
          // These need to be css Color values
          '--published-bg': 'var(oklch(var(--scoped-bg)), --color-background)',
          '--published-text': 'var(oklch(var(--scoped-text)), currentColor)',
        },
      });

      // Use matchUtilities to create bg utilities that set --scoped-bg
      api.matchUtilities(
        {
          bg: (value) => ({
            '--scoped-bg': value,
          }),
        },
        {
          values: (api.theme?.('backgroundColor') ??
            api.theme?.('colors') ??
            {}) as Record<string, string>,
        },
      );

      api.matchUtilities(
        {
          text: (value) => ({
            '--scoped-text': value,
          }),
        },
        {
          values: (api.theme?.('textColor') ??
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
