import agencyFlat from '@agency/eslint-config/flat';

const config = [
  ...agencyFlat,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];
export default config;
