#!/usr/bin/env node

/**
 * Governance Report Generator
 * Combines compliance and risk assessment data into a unified governance report.
 *
 * Usage:
 *   node scripts/governance/generate-report.js \
 *     --compliance compliance-report.json \
 *     --risk risk-assessment.json \
 *     --output governance-report.json
 */

const fs = require('fs');

const args = process.argv.slice(2);
const get = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const compliancePath = get('--compliance');
const riskPath = get('--risk');
const outputPath = get('--output');

if (!outputPath) {
  console.error('--output flag is required');
  process.exit(1);
}

const report = {
  generatedAt: new Date().toISOString(),
  compliance: compliancePath && fs.existsSync(compliancePath)
    ? JSON.parse(fs.readFileSync(compliancePath, 'utf8'))
    : { status: 'not-run' },
  risk: riskPath && fs.existsSync(riskPath)
    ? JSON.parse(fs.readFileSync(riskPath, 'utf8'))
    : { status: 'not-run' },
  summary: 'Governance report generated successfully.',
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`Governance report written to ${outputPath}`);
