#!/usr/bin/env tsx

/**
 * Stale Branch Cleanup Script
 * 
 * This script identifies and optionally deletes stale branches from the repository.
 * It respects protected branches and provides notifications before deletion.
 */

import { execSync } from 'child_process';
import { readFile, writeFile } from 'fs';
import { join } from 'path';

interface CleanupOptions {
  daysThreshold: number;
  protectedBranches: string[];
  dryRun: boolean;
  repoOwner: string;
  repoName: string;
  githubToken: string;
}

interface BranchInfo {
  name: string;
  lastCommitDate: Date;
  lastCommitHash: string;
  lastCommitMessage: string;
  author: string;
  authorEmail: string;
  daysInactive: number;
  isProtected: boolean;
  hasOpenPRs: boolean;
  mergedPR?: boolean;
}

interface CleanupResult {
  totalBranches: number;
  staleBranches: BranchInfo[];
  deletedBranches: string[];
  protectedBranches: string[];
  errors: string[];
}

/**
 * Gets all branches from the repository
 */
function getAllBranches(): string[] {
  try {
    const output = execSync('git branch -a --format="%(refname:short)"', { encoding: 'utf8' });
    return output
      .split('\n')
      .map(branch => branch.trim())
      .filter(branch => branch && !branch.startsWith('origin/'));
  } catch (error) {
    throw new Error('Failed to get branch list');
  }
}

/**
 * Gets branch information including last commit details
 */
function getBranchInfo(branchName: string): BranchInfo {
  try {
    // Get last commit details
    const lastCommitOutput = execSync(
      `git show -s --format="%H|%cI|%s|%an|%ae" ${branchName}`,
      { encoding: 'utf8' }
    ).trim();

    const [hash, dateIso, message, author, email] = lastCommitOutput.split('|');
    const lastCommitDate = new Date(dateIso);
    
    // Calculate days inactive
    const daysInactive = Math.floor(
      (Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      name: branchName,
      lastCommitDate,
      lastCommitHash: hash,
      lastCommitMessage: message,
      author,
      authorEmail: email,
      daysInactive,
      isProtected: false,
      hasOpenPRs: false,
    };
  } catch (error) {
    throw new Error(`Failed to get info for branch ${branchName}: ${error}`);
  }
}

/**
 * Checks if a branch has open pull requests
 */
async function hasOpenPRs(branchName: string, options: CleanupOptions): Promise<boolean> {
  try {
    // GitHub API call to check for open PRs
    const apiUrl = `https://api.github.com/repos/${options.repoOwner}/${options.repoName}/pulls`;
    const response = await fetch(`${apiUrl}?head=${branchName}&state=open`, {
      headers: {
        'Authorization': `token ${options.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to check PRs for branch ${branchName}: ${response.statusText}`);
      return false;
    }

    const prs = await response.json();
    return prs.length > 0;
  } catch (error) {
    console.warn(`Error checking PRs for branch ${branchName}: ${error}`);
    return false;
  }
}

/**
 * Deletes a branch locally and remotely
 */
function deleteBranch(branchName: string, dryRun: boolean): void {
  if (dryRun) {
    console.log(`🔍 DRY RUN: Would delete branch: ${branchName}`);
    return;
  }

  try {
    // Delete local branch
    execSync(`git branch -D ${branchName}`, { encoding: 'utf8' });
    
    // Delete remote branch
    execSync(`git push origin --delete ${branchName}`, { encoding: 'utf8' });
    
    console.log(`🗑️ Deleted branch: ${branchName}`);
  } catch (error) {
    console.error(`❌ Failed to delete branch ${branchName}: ${error}`);
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function cleanupStaleBranches(options: CleanupOptions): Promise<CleanupResult> {
  const result: CleanupResult = {
    totalBranches: 0,
    staleBranches: [],
    deletedBranches: [],
    protectedBranches: [],
    errors: [],
  };

  console.log(`🔍 Analyzing branches with ${options.daysThreshold} days threshold...`);
  console.log(`🛡️ Protected branches: ${options.protectedBranches.join(', ')}`);
  console.log(`🔍 Dry run: ${options.dryRun ? 'YES' : 'NO'}`);
  console.log('');

  try {
    // Get all branches
    const allBranches = getAllBranches();
    result.totalBranches = allBranches.length;

    console.log(`📊 Found ${allBranches.length} total branches`);

    // Analyze each branch
    for (const branchName of allBranches) {
      try {
        const branchInfo = getBranchInfo(branchName);
        
        // Check if branch is protected
        branchInfo.isProtected = options.protectedBranches.includes(branchName);
        if (branchInfo.isProtected) {
          result.protectedBranches.push(branchName);
          console.log(`🛡️ Protected: ${branchName} (${branchInfo.daysInactive} days inactive)`);
          continue;
        }

        // Check if branch has open PRs
        branchInfo.hasOpenPRs = await hasOpenPRs(branchName, options);

        // Check if branch is stale
        if (branchInfo.daysInactive >= options.daysThreshold) {
          result.staleBranches.push(branchInfo);
          
          const status = branchInfo.hasOpenPRs ? '🔄 Has PRs' : '📅 Stale';
          console.log(
            `${status}: ${branchName} (${branchInfo.daysInactive} days inactive, last: ${branchInfo.lastCommitMessage.substring(0, 50)}...)`
          );

          // Delete branch if it's stale and doesn't have open PRs
          if (!branchInfo.hasOpenPRs && !options.dryRun) {
            deleteBranch(branchName, options.dryRun);
            result.deletedBranches.push(branchName);
          }
        } else {
          console.log(`✅ Active: ${branchName} (${branchInfo.daysInactive} days inactive)`);
        }
      } catch (error) {
        const errorMsg = `Failed to analyze branch ${branchName}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log('');
    console.log('📋 Summary:');
    console.log(`  Total branches: ${result.totalBranches}`);
    console.log(`  Protected branches: ${result.protectedBranches.length}`);
    console.log(`  Stale branches: ${result.staleBranches.length}`);
    console.log(`  Deleted branches: ${result.deletedBranches.length}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (!options.dryRun && result.deletedBranches.length > 0) {
      console.log('');
      console.log('🗑️ Deleted branches:');
      result.deletedBranches.forEach(branch => console.log(`  - ${branch}`));
    }

    if (result.staleBranches.length > 0 && options.dryRun) {
      console.log('');
      console.log('📅 Stale branches (would be deleted without open PRs):');
      result.staleBranches
        .filter(branch => !branch.hasOpenPRs)
        .forEach(branch => console.log(`  - ${branch} (${branch.daysInactive} days)`));
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    result.errors.push(`Cleanup failed: ${error}`);
  }

  return result;
}

/**
 * Parse command line arguments
 */
function parseArguments(): CleanupOptions {
  const args = process.argv.slice(2);
  const options: Partial<CleanupOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--days-threshold':
        options.daysThreshold = parseInt(value, 10);
        break;
      case '--protected-branches':
        options.protectedBranches = value.split(',').map(b => b.trim());
        break;
      case '--dry-run':
        options.dryRun = value === 'true';
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
    daysThreshold: options.daysThreshold || 90,
    protectedBranches: options.protectedBranches || ['main', 'develop', 'staging', 'production'],
    dryRun: options.dryRun !== false, // Default to true
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

    console.log('🧹 Stale Branch Cleanup');
    console.log('========================');
    console.log('');

    const result = await cleanupStaleBranches(options);

    // Exit with error code if there were errors
    if (result.errors.length > 0) {
      console.log('');
      console.log('❌ Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }

    console.log('');
    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { cleanupStaleBranches, type CleanupOptions, type BranchInfo, type CleanupResult };
