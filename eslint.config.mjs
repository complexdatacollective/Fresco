import { fixupPluginRules } from '@eslint/compat';
import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'public/**',
      'storybook-static/**',
      '.next/**',
      'tests/e2e/playwright-report/**',
      'lib/db/generated/**',
    ],
  },

  // Base recommended for all files
  eslint.configs.recommended,

  // TypeScript configs - applies to all files but type-checked rules only work on TS
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Parser options with project service
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Disable type-checked rules for JS files
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Next.js plugin
  nextPlugin.configs['core-web-vitals'],
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },

  // React plugins
  {
    plugins: {
      'react': reactPlugin,
      'react-hooks': fixupPluginRules(reactHooksPlugin),
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },

  // jsx-a11y plugin (accessibility rules from eslint-config-next)
  {
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      'jsx-a11y/alt-text': [
        'warn',
        {
          elements: ['img'],
          img: ['Image'],
        },
      ],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },

  // Import plugin - base config for all files (just no-cycle)
  {
    plugins: {
      import: fixupPluginRules(importPlugin),
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      'import/no-cycle': 'error',
      'import/no-anonymous-default-export': 'off',
    },
  },

  // Import plugin - recommended rules for JS files only (matching old config)
  {
    files: ['**/*.js', '**/*.jsx'],
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/no-named-as-default': 'warn',
      'import/no-named-as-default-member': 'warn',
      'import/no-duplicates': 'warn',
    },
  },

  // Storybook
  ...storybookPlugin.configs['flat/recommended'],

  // Custom rules for TypeScript files only (type-checked rules)
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
    },
  },

  // Disable unbound-method for test files (mock functions don't use `this`)
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Custom rules for all files (non-type-checked rules)
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'no-process-env': 'error',
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
          argsIgnorePattern: '^_',
        },
      ],
      'no-unreachable': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/cache',
              importNames: ['cacheTag', 'updateTag', 'revalidateTag'],
              message:
                'Use safeCacheTag, safeUpdateTag, or safeRevalidateTag from ~/lib/cache for type-safe cache tags.',
            },
          ],
        },
      ],
    },
  },

  // Better TailwindCSS plugin
  {
    extends: [eslintPluginBetterTailwindcss.configs.correctness],
    rules: {
      'better-tailwindcss/enforce-canonical-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'warn',
    },
    settings: {
      'better-tailwindcss': {
        // Use the full path via meta.url to avoid issues with CWD when running ESLint from different directories
        entryPoint: import.meta.dirname + '/styles/globals.css',
      },
    },
  },

  // Disable no-unknown-classes for legacy/special directories
  {
    files: ['**/lib/legacy-ui/**', '**/lib/interviewer/**'],
    rules: {
      'better-tailwindcss/no-unknown-classes': 'off',
    },
  },

  // Declaration files require `interface` for ambient type merging
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },

  // Prettier must be last
  eslintConfigPrettier,
);
