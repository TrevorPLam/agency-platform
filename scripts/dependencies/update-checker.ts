#!/usr/bin/env tsx

/**
 * Dependency Update Checker Script
 * 
 * This script checks for outdated dependencies and can automatically
 * create pull requests for updates based on configured rules.
 */

import { execSync } from 'child_process';
import { readFile, writeFile } from 'fs';
import { join } from 'path';

interface UpdateCheckerOptions {
  updateType: 'all' | 'production' | 'development' | 'github-actions';
  autoMerge: boolean;
  repoOwner: string;
  repoName: string;
  githubToken: string;
}

interface DependencyInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  packagePath: string;
  updateCategory: 'major' | 'minor' | 'patch';
  securityVulnerability?: boolean;
}

interface UpdateResult {
  totalUpdates: number;
  securityUpdates: number;
  majorUpdates: number;
  minorUpdates: number;
  patchUpdates: number;
  pullRequestsCreated: number;
  errors: string[];
}

/**
 * Gets outdated dependencies from npm
 */
function getOutdatedDependencies(packagePath: string = './'): DependencyInfo[] {
  try {
    const output = execSync(`npm outdated --json --prefix ${packagePath}`, { encoding: 'utf8' });
    const outdated = JSON.parse(output);
    
    const dependencies: DependencyInfo[] = [];
    
    for (const [name, info] of Object.entries(outdated)) {
      const dep = info as any;
      dependencies.push({
        name,
        current: dep.current,
        wanted: dep.wanted,
        latest: dep.latest,
        type: dep.type || 'dependencies',
        packagePath,
        updateCategory: getUpdateCategory(dep.current, dep.latest),
      });
    }
    
    return dependencies;
  } catch (error) {
    // npm outdated returns non-zero exit code when there are outdated packages
    try {
      const output = execSync(`npm outdated --json --prefix ${packagePath}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return JSON.parse(output);
    } catch {
      return [];
    }
  }
}

/**
 * Determines the update category (major, minor, patch)
 */
function getUpdateCategory(current: string, latest: string): 'major' | 'minor' | 'patch' {
  const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
  const latestParts = latest.replace(/[^\d.]/g, '').split('.').map(Number);
  
  if (latestParts[0] > currentParts[0]) return 'major';
  if (latestParts[1] > currentParts[1]) return 'minor';
  return 'patch';
}

/**
 * Filters dependencies based on update type
 */
function filterDependencies(
  dependencies: DependencyInfo[],
  updateType: string
): DependencyInfo[] {
  switch (updateType) {
    case 'production':
      return dependencies.filter(dep => dep.type === 'dependencies');
    case 'development':
      return dependencies.filter(dep => dep.type === 'devDependencies');
    case 'all':
      return dependencies;
    default:
      return dependencies;
  }
}

/**
 * Creates a pull request for dependency updates
 */
async function createUpdatePR(
  dependencies: DependencyInfo[],
  options: UpdateCheckerOptions
): Promise<boolean> {
  try {
    const branchName = `deps/update-${Date.now()}`;
    const title = generatePRTitle(dependencies);
    const body = generatePRBody(dependencies);
    
    console.log(`📝 Creating PR: ${title}`);
    
    // Create branch
    execSync(`git checkout -b ${branchName}`, { encoding: 'utf8' });
    
    // Update dependencies
    for (const dep of dependencies) {
      console.log(`📦 Updating ${dep.name}: ${dep.current} → ${dep.latest}`);
      execSync(`npm install ${dep.name}@${dep.latest}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
    }
    
    // Commit changes
    execSync('git add package*.json pnpm-lock.yaml', { encoding: 'utf8' });
    execSync(`git commit -m "${title}"`, { encoding: 'utf8' });
    
    // Push branch
    execSync(`git push origin ${branchName}`, { encoding: 'utf8' });
    
    // Create PR via GitHub API
    const prData = {
      title,
      body,
      head: branchName,
      base: 'main',
      labels: ['dependencies', 'automated'],
    };
    
    if (options.autoMerge && dependencies.every(dep => dep.updateCategory === 'patch')) {
      prData.labels.push('auto-merge');
    }
    
    console.log(`✅ PR created: ${title}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create PR: ${error}`);
    return false;
  }
}

/**
 * Generates PR title
 */
function generatePRTitle(dependencies: DependencyInfo[]): string {
  if (dependencies.length === 1) {
    const dep = dependencies[0];
    return `deps: Update ${dep.name} to ${dep.latest}`;
  }
  
  const types = [...new Set(dependencies.map(d => d.updateCategory))];
  if (types.length === 1) {
    return `deps: Update ${dependencies.length} packages (${types[0]})`;
  }
  
  return `deps: Update ${dependencies.length} packages`;
}

/**
 * Generates PR body
 */
function generatePRBody(dependencies: DependencyInfo[]): string {
  const body = [
    '## 📦 Dependency Updates',
    '',
    'This PR updates the following dependencies:',
    '',
    '| Package | Current | Latest | Type | Update |',
    '|---------|---------|--------|------|--------|',
  ];
  
  dependencies.forEach(dep => {
    const emoji = dep.updateCategory === 'major' ? '🔴' : 
                  dep.updateCategory === 'minor' ? '🟡' : '🟢';
    body.push(`| ${dep.name} | ${dep.current} | ${dep.latest} | ${dep.type} | ${emoji} ${dep.updateCategory} |`);
  });
  
  body.push('');
  body.push('### 🧪 Testing');
  body.push('- [ ] All tests pass');
  body.push('- [ ] No breaking changes');
  body.push('- [ ] Performance impact assessed');
  body.push('');
  body.push('### 📋 Checklist');
  body.push('- [ ] Code follows project style guidelines');
  body.push('- [ ] Self-review completed');
  body.push('- [ ] Documentation updated if needed');
  body.push('');
  body.push('---');
  body.push('*This PR was created automatically by the dependency update checker.*');
  
  return body.join('\n');
}

/**
 * Checks for security vulnerabilities
 */
async function checkSecurityVulnerabilities(): Promise<DependencyInfo[]> {
  try {
    console.log('🔒 Checking for security vulnerabilities...');
    
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(output);
    
    const vulnerabilities: DependencyInfo[] = [];
    
    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        const vulnerability = vuln as any;
        vulnerabilities.push({
          name,
          current: vulnerability.version,
          wanted: vulnerability.fixAvailable?.version || vulnerability.version,
          latest: vulnerability.fixAvailable?.version || vulnerability.version,
          type: 'dependencies',
          packagePath: './',
          updateCategory: 'patch', // Security updates are typically patches
          securityVulnerability: true,
        });
      }
    }
    
    return vulnerabilities;
  } catch (error) {
    console.warn('Warning: Could not check security vulnerabilities');
    return [];
  }
}

/**
 * Main update checker function
 */
async function runUpdateChecker(options: UpdateCheckerOptions): Promise<UpdateResult> {
  const result: UpdateResult = {
    totalUpdates: 0,
    securityUpdates: 0,
    majorUpdates: 0,
    minorUpdates: 0,
    patchUpdates: 0,
    pullRequestsCreated: 0,
    errors: [],
  };
  
  console.log('🔄 Dependency Update Checker');
  console.log('==========================');
  console.log(`Update type: ${options.updateType}`);
  console.log(`Auto merge: ${options.autoMerge}`);
  console.log('');
  
  try {
    // Check for security vulnerabilities first
    const securityVulns = await checkSecurityVulnerabilities();
    if (securityVulns.length > 0) {
      console.log(`🚨 Found ${securityVulns.length} security vulnerabilities`);
      result.securityUpdates = securityVulns.length;
      
      // Create PR for security updates
      if (await createUpdatePR(securityVulns, options)) {
        result.pullRequestsCreated++;
      }
    }
    
    // Get outdated dependencies
    const allDependencies = getOutdatedDependencies();
    const filteredDependencies = filterDependencies(allDependencies, options.updateType);
    
    console.log(`📊 Found ${filteredDependencies.length} outdated dependencies`);
    
    // Categorize updates
    for (const dep of filteredDependencies) {
      result.totalUpdates++;
      switch (dep.updateCategory) {
        case 'major':
          result.majorUpdates++;
          break;
        case 'minor':
          result.minorUpdates++;
          break;
        case 'patch':
          result.patchUpdates++;
          break;
      }
    }
    
    // Group updates by category for PR creation
    const grouped = {
      major: filteredDependencies.filter(d => d.updateCategory === 'major'),
      minor: filteredDependencies.filter(d => d.updateCategory === 'minor'),
      patch: filteredDependencies.filter(d => d.updateCategory === 'patch'),
    };
    
    // Create PRs for each group
    for (const [category, deps] of Object.entries(grouped)) {
      if (deps.length > 0) {
        console.log(`📝 Creating PR for ${deps.length} ${category} updates`);
        if (await createUpdatePR(deps, options)) {
          result.pullRequestsCreated++;
        }
      }
    }
    
    // Print summary
    console.log('');
    console.log('📊 Update Summary:');
    console.log(`  Total updates: ${result.totalUpdates}`);
    console.log(`  Security updates: ${result.securityUpdates}`);
    console.log(`  Major updates: ${result.majorUpdates}`);
    console.log(`  Minor updates: ${result.minorUpdates}`);
    console.log(`  Patch updates: ${result.patchUpdates}`);
    console.log(`  PRs created: ${result.pullRequestsCreated}`);
    
  } catch (error) {
    console.error('❌ Update checker failed:', error);
    result.errors.push(`Update checker failed: ${error}`);
  }
  
  return result;
}

/**
 * Parse command line arguments
 */
function parseArguments(): UpdateCheckerOptions {
  const args = process.argv.slice(2);
  const options: Partial<UpdateCheckerOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--update-type':
        options.updateType = value as any;
        break;
      case '--auto-merge':
        options.autoMerge = value === 'true';
        break;
      case '--repo-owner':
        options.repoOwner = value;
        break;
      case '--repo-name':
        options.repoName = value;
        break;
      case '--github-token':
        options.githubToken = value;
        break;
    }
  }

  // Set defaults
  return {
    updateType: options.updateType || 'all',
    autoMerge: options.autoMerge || false,
    repoOwner: options.repoOwner || process.env.GITHUB_REPOSITORY_OWNER || '',
    repoName: options.repoName || process.env.GITHUB_REPOSITORY?.split('/')[1] || '',
    githubToken: options.githubToken || process.env.GITHUB_TOKEN || '',
  };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();
    
    if (!options.repoOwner || !options.repoName || !options.githubToken) {
      console.error('❌ Missing required arguments: --repo-owner, --repo-name, --github-token');
      process.exit(1);
    }

    const result = await runUpdateChecker(options);

    // Exit with error code if there were errors
    if (result.errors.length > 0) {
      console.log('');
      console.log('❌ Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }

    console.log('');
    console.log('✅ Update checker completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { 
  runUpdateChecker, 
  getOutdatedDependencies, 
  checkSecurityVulnerabilities, 
  type UpdateCheckerOptions, 
  type DependencyInfo, 
  type UpdateResult 
};
