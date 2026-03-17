'use strict';

/**
 * Flat config for Next.js apps (ESLint 9).
 * Includes Next.js core-web-vitals plus TypeScript and monorepo boundary rules.
 * Use in apps via: export default [...require('@agency/eslint-config/flat')];
 */
const nextConfig = require('eslint-config-next/core-web-vitals');
const nextConfigArray = Array.isArray(nextConfig) ? nextConfig : [nextConfig];

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

const agencyRules = {
  'no-restricted-imports': 'off',
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['../apps/**'],
          message:
            'Importing from apps directory is not allowed in packages. This creates a reversed dependency graph.',
        },
      ],
    },
  ],
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/no-explicit-any': 'error',
  'prefer-const': 'error',
};

module.exports = [
  ...nextConfigArray,
  // Ignore config files that are not in tsconfig (avoids parserOptions.project errors)
  {
    ignores: [
      '**/eslint.config.mjs',
      '**/postcss.config.mjs',
      '**/next.config.*',
    ],
  },
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: agencyRules,
  },
];
