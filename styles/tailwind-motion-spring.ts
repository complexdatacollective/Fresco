import { spring } from 'motion';
import plugin from 'tailwindcss/plugin';

const springPresets = {
  short: [0.25, 0.8],
  medium: [0.35, 0.5],
  long: [0.55, 0.3],
};

/**
 * Idea with this is to create a TW plugin that adds spring motion utilities
 * from motion, so that you can generate springy animations using CSS.
 */
export default plugin((api) => {
  // Add preset spring utilities
  const presetUtilities: Record<string, Record<string, string>> = {};

  Object.entries(springPresets).forEach(([name, [stiffness, damping]]) => {
    const springValue = spring(stiffness, damping);
    presetUtilities[`.spring-${name}`] = {
      transition: `all ${springValue.toString()}`,
    };
  });

  if (api.addUtilities) {
    api.addUtilities(presetUtilities);
  }

  // Add arbitrary value spring utilities
  if (api.matchUtilities) {
    api.matchUtilities(
      {
        spring: (value) => {
          // Parse the value - could be "0.5,0.5".
          const params = value.split(',').map((v) => parseFloat(v.trim()));

          if (params.length < 2 || params.some(isNaN)) {
            return {
              transition: `all ${spring().toString()}`,
            };
          }

          const [duration, bounciness] = params;
          const springValue = spring(duration, bounciness);

          return {
            transition: `all ${springValue.toString()}`,
          };
        },
      },
      {
        values: {},
        type: 'any',
      },
    );
  }
});
