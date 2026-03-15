'use strict';

/**
 * Flat config for Next.js apps (ESLint 9).
 * Use in apps via: export default [...require('@agency/eslint-config/flat')];
 */
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
module.exports = Array.isArray(nextCoreWebVitals) ? nextCoreWebVitals : [nextCoreWebVitals];
