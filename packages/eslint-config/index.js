module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable base ESLint rule in favor of TypeScript version
    'no-restricted-imports': 'off',
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../apps/**'],
            message: 'Importing from apps directory is not allowed in packages. This creates a reversed dependency graph.',
          },
        ],
      },
    ],
    // Additional TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'prefer-const': 'error',
  },
};
