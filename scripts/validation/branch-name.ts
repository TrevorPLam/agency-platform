#!/usr/bin/env tsx

/**
 * Branch Name Validation Script
 * 
 * This script validates branch names against the agency platform naming conventions.
 * It can be used locally or as part of CI/CD pipelines.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Branch naming patterns
const BRANCH_PATTERNS = {
  feature: /^(feature|feat)\/[a-z0-9-]+$/,
  fix: /^(fix|bugfix)\/[a-z0-9-]+$/,
  hotfix: /^hotfix\/[a-z0-9-]+$/,
  release: /^(release|rel)\/[a-z0-9.-]+$/,
  chore: /^(chore|docs|style|refactor|test)\/[a-z0-9-]+$/,
  deploy: /^deploy\/[a-z0-9-]+$/,
} as const;

type BranchType = keyof typeof BRANCH_PATTERNS;

interface ValidationResult {
  valid: boolean;
  branchName: string;
  branchType?: BranchType;
  errors: string[];
  suggestions: string[];
}

/**
 * Validates a branch name against the naming conventions
 */
function validateBranchName(branchName: string): ValidationResult {
  const result: ValidationResult = {
    valid: false,
    branchName,
    errors: [],
    suggestions: [],
  };

  // Skip validation for main branch
  if (branchName === 'main') {
    result.valid = true;
    return result;
  }

  // Check each pattern
  for (const [type, pattern] of Object.entries(BRANCH_PATTERNS)) {
    if (pattern.test(branchName)) {
      result.valid = true;
      result.branchType = type as BranchType;
      return result;
    }
  }

  // If no pattern matched, generate helpful error messages
  result.errors.push(
    `Branch name "${branchName}" does not follow naming conventions`,
    'Branch names must start with a type prefix followed by a slash',
    'Use only lowercase letters, numbers, and hyphens in the branch name'
  );

  // Generate suggestions based on the branch name
  result.suggestions = generateSuggestions(branchName);

  return result;
}

/**
 * Generates suggested branch names based on an invalid branch name
 */
function generateSuggestions(branchName: string): string[] {
  const suggestions: string[] = [];
  const cleanName = branchName
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  // Common patterns to suggest
  const commonPrefixes = ['feature', 'feat', 'fix', 'bugfix', 'hotfix', 'chore', 'docs', 'style', 'refactor', 'test'];
  
  for (const prefix of commonPrefixes) {
    suggestions.push(`${prefix}/${cleanName}`);
  }

  // If the branch name already has a prefix, just fix the format
  if (branchName.includes('/')) {
    const [prefix, ...nameParts] = branchName.split('/');
    const cleanSuffix = nameParts.join('-').replace(/[^a-z0-9-]/g, '-').toLowerCase();
    
    for (const validPrefix of commonPrefixes) {
      if (prefix.toLowerCase().includes(validPrefix) || validPrefix.includes(prefix.toLowerCase())) {
        suggestions.push(`${validPrefix}/${cleanSuffix}`);
      }
    }
  }

  return [...new Set(suggestions)].slice(0, 5); // Remove duplicates and limit to 5 suggestions
}

/**
 * Gets the current branch name
 */
function getCurrentBranchName(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    throw new Error('Failed to get current branch name. Make sure you\'re in a git repository.');
  }
}

/**
 * Prints validation results with helpful formatting
 */
function printValidationResult(result: ValidationResult): void {
  if (result.valid) {
    console.log(`✅ Valid branch name: ${result.branchName}`);
    if (result.branchType) {
      console.log(`   Type: ${result.branchType}`);
    }
    return;
  }

  console.log(`❌ Invalid branch name: ${result.branchName}`);
  console.log('');
  
  console.log('📋 Valid Branch Name Patterns:');
  console.log('  • feature/branch-name    - New features');
  console.log('  • feat/branch-name       - New features (short)');
  console.log('  • fix/branch-name        - Bug fixes');
  console.log('  • bugfix/branch-name     - Bug fixes (long)');
  console.log('  • hotfix/branch-name     - Critical fixes');
  console.log('  • release/branch-name    - Release preparation');
  console.log('  • rel/branch-name        - Release preparation (short)');
  console.log('  • chore/branch-name     - Maintenance tasks');
  console.log('  • docs/branch-name       - Documentation changes');
  console.log('  • style/branch-name     - Code style changes');
  console.log('  • refactor/branch-name  - Code refactoring');
  console.log('  • test/branch-name      - Test additions');
  console.log('  • deploy/branch-name    - Deployment configurations');
  console.log('');
  
  console.log('📝 Branch Name Rules:');
  console.log('  • Use lowercase letters, numbers, and hyphens only');
  console.log('  • No spaces or special characters except hyphens');
  console.log('  • Be descriptive but concise');
  console.log('  • Examples: feature/user-authentication, fix/login-bug, hotfix/security-patch');
  console.log('');
  
  if (result.errors.length > 0) {
    console.log('🚫 Errors:');
    result.errors.forEach(error => console.log(`  • ${error}`));
    console.log('');
  }
  
  if (result.suggestions.length > 0) {
    console.log('💡 Suggested Names:');
    result.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
    console.log('');
  }
  
  console.log('🔧 How to Rename:');
  console.log('  git checkout -b new-branch-name');
  console.log('  git push origin new-branch-name');
  console.log('  git branch -d old-branch-name');
  console.log('  git push origin --delete old-branch-name');
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  let branchName: string;

  if (args.length > 0) {
    branchName = args[0];
  } else {
    try {
      branchName = getCurrentBranchName();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  const result = validateBranchName(branchName);
  printValidationResult(result);

  if (!result.valid) {
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { validateBranchName, type ValidationResult, type BranchType };
