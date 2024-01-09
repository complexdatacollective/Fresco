import { type Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/interviewer/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    colors: {
      // NC colors
      'neon-coral': {
        DEFAULT: 'hsl(var(--neon-coral) / <alpha-value>)',
        dark: 'hsl(var(--neon-coral--dark) / <alpha-value>)',
      },
      'sea-green': {
        DEFAULT: 'hsl(var(--sea-green) / <alpha-value>)',
        dark: 'hsl(var(--sea-green--dark) / <alpha-value>)',
      },
      'slate-blue': {
        DEFAULT: 'hsl(var(--slate-blue) / <alpha-value>)',
        dark: 'hsl(var(--slate-blue--dark) / <alpha-value>)',
      },
      'navy-taupe': {
        DEFAULT: 'hsl(var(--navy-taupe) / <alpha-value>)',
        dark: 'hsl(var(--navy-taupe--dark) / <alpha-value>)',
      },
      'cyber-grape': {
        DEFAULT: 'hsl(var(--cyber-grape) / <alpha-value>)',
        dark: 'hsl(var(--cyber-grape--dark) / <alpha-value>)',
      },
      'rich-black': {
        DEFAULT: 'hsl(var(--rich-black) / <alpha-value>)',
        dark: 'hsl(var(--rich-black--dark) / <alpha-value>)',
      },
      'charcoal': {
        DEFAULT: 'hsl(var(--charcoal) / <alpha-value>)',
        dark: 'hsl(var(--charcoal--dark) / <alpha-value>)',
      },
      'platinum': {
        DEFAULT: 'hsl(var(--platinum) / <alpha-value>)',
        dark: 'hsl(var(--platinum--dark) / <alpha-value>)',
      },
      'sea-serpent': {
        DEFAULT: 'hsl(var(--sea-serpent) / <alpha-value>)',
        dark: 'hsl(var(--sea-serpent--dark) / <alpha-value>)',
      },
      'purple-pizzazz': {
        DEFAULT: 'hsl(var(--purple-pizzazz) / <alpha-value>)',
        dark: 'hsl(var(--purple-pizzazz--dark) / <alpha-value>)',
      },
      'paradise-pink': {
        DEFAULT: 'hsl(var(--paradise-pink) / <alpha-value>)',
        dark: 'hsl(var(--paradise-pink--dark) / <alpha-value>)',
      },
      'cerulean-blue': {
        DEFAULT: 'hsl(var(--cerulean-blue) / <alpha-value>)',
        dark: 'hsl(var(--cerulean-blue--dark) / <alpha-value>)',
      },
      'kiwi': {
        DEFAULT: 'hsl(var(--kiwi) / <alpha-value>)',
        dark: 'hsl(var(--kiwi--dark) / <alpha-value>)',
      },
      'neon-carrot': {
        DEFAULT: 'hsl(var(--neon-carrot) / <alpha-value>)',
        dark: 'hsl(var(--neon-carrot--dark) / <alpha-value>)',
      },
      'barbie-pink': {
        DEFAULT: 'hsl(var(--barbie-pink) / <alpha-value>)',
        dark: 'hsl(var(--barbie-pink--dark) / <alpha-value>)',
      },
      'tomato': {
        DEFAULT: 'hsl(var(--tomato) / <alpha-value>)',
        dark: 'hsl(var(--tomato--dark) / <alpha-value>)',
      },

      // Semantic slots
      'background': 'hsl(var(--background))',
      'foreground': 'hsl(var(--foreground))',
      'primary': {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      'secondary': {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      'destructive': {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      'success': {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))',
      },
      'muted': {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      'accent': {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      'popover': {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      'card': {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      'panel': {
        DEFAULT: 'hsl(var(--panel))',
        foreground: 'hsl(var(--foreground))',
      },
    },
    extend: {
      borderRadius: {
        lg: 'calc(var(--radius) * 1.5)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) * 0.75)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'indeterminate-progress-bar': {
          '0%': { transform: ' translateX(0) scaleX(0)' },
          '40%': { transform: 'translateX(0) scaleX(0.4)' },
          '100%': { transform: 'translateX(100%) scaleX(0.5)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'indeterminate-progress-bar':
          'indeterminate-progress-bar 1s infinite linear',
      },
      transformOrigin: {
        'left-right': '0% 50%',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    require('tailwindcss-animate'),
  ],
} satisfies Config;
