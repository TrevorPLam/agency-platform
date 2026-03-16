#!/usr/bin/env tsx

/**
 * Branch Owner Notification Script
 * 
 * This script sends notifications to branch owners about stale branches
 * that will be deleted in the next cleanup run.
 */

interface NotificationOptions {
  repoOwner: string;
  repoName: string;
  githubToken: string;
  daysThreshold: number;
}

interface BranchOwner {
  name: string;
  email: string;
  branches: string[];
}

interface NotificationResult {
  notificationsSent: number;
  errors: string[];
}

/**
 * Gets branches that are about to be deleted (stale but with grace period)
 */
async function getBranchesForNotification(options: NotificationOptions): Promise<BranchOwner[]> {
  // This would typically query the GitHub API or a database
  // For now, we'll return a mock implementation
  return [];
}

/**
 * Creates a notification issue for a branch owner
 */
async function createNotificationIssue(
  owner: BranchOwner,
  options: NotificationOptions
): Promise<boolean> {
  try {
    const issueTitle = `🧹 Stale Branch Cleanup Notification - ${owner.branches.length} branches`;
    
    const issueBody = `
## 🧹 Stale Branch Cleanup Notification

Hello @${owner.name},

This is an automated notification about stale branches that you own.

### 📋 Affected Branches
${owner.branches.map(branch => `- \`${branch}\``).join('\n')}

### ⏰ Cleanup Timeline
- **Current Date**: ${new Date().toLocaleDateString()}
- **Stale Threshold**: ${options.daysThreshold} days
- **Next Cleanup**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

### 🔄 What to Do

1. **Review the branches** - Check if any of these branches contain work you need
2. **Open a PR** - If you need to keep the work, create a pull request
3. **Let us know** - Comment on this issue if you need more time

### 🛡️ How to Protect Your Branches

Branches with open pull requests are automatically protected from deletion.

### 📚 More Information

- [Branch Naming Conventions](../docs/CONTRIBUTING.md)
- [Development Workflow](../docs/DEVELOPMENT.md)

---

*This is an automated notification. Please respond if you need assistance.*
`;

    const apiUrl = `https://api.github.com/repos/${options.repoOwner}/${options.repoName}/issues`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${options.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['stale-branches', 'notification'],
        assignees: [owner.name],
      }),
    });

    if (!response.ok) {
      console.error(`Failed to create issue for ${owner.name}: ${response.statusText}`);
      return false;
    }

    console.log(`📧 Created notification issue for ${owner.name}`);
    return true;
  } catch (error) {
    console.error(`Error creating notification for ${owner.name}: ${error}`);
    return false;
  }
}

/**
 * Main notification function
 */
async function notifyBranchOwners(options: NotificationOptions): Promise<NotificationResult> {
  const result: NotificationResult = {
    notificationsSent: 0,
    errors: [],
  };

  console.log('📧 Sending branch owner notifications...');
  console.log('');

  try {
    const branchOwners = await getBranchesForNotification(options);
    
    if (branchOwners.length === 0) {
      console.log('✅ No branches require notification');
      return result;
    }

    console.log(`📋 Found ${branchOwners.length} branch owners to notify`);

    for (const owner of branchOwners) {
      try {
        const success = await createNotificationIssue(owner, options);
        if (success) {
          result.notificationsSent++;
        }
      } catch (error) {
        const errorMsg = `Failed to notify ${owner.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log('');
    console.log('📊 Notification Summary:');
    console.log(`  Notifications sent: ${result.notificationsSent}`);
    console.log(`  Errors: ${result.errors.length}`);

  } catch (error) {
    console.error('❌ Notification process failed:', error);
    result.errors.push(`Notification process failed: ${error}`);
  }

  return result;
}

/**
 * Parse command line arguments
 */
function parseArguments(): NotificationOptions {
  const args = process.argv.slice(2);
  const options: Partial<NotificationOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--repo-owner':
        options.repoOwner = value;
        break;
      case '--repo-name':
        options.repoName = value;
        break;
      case '--github-token':
        options.githubToken = value;
        break;
      case '--days-threshold':
        options.daysThreshold = parseInt(value, 10);
        break;
    }
  }

  // Set defaults
  return {
    repoOwner: options.repoOwner || process.env.GITHUB_REPOSITORY_OWNER || '',
    repoName: options.repoName || process.env.GITHUB_REPOSITORY?.split('/')[1] || '',
    githubToken: options.githubToken || process.env.GITHUB_TOKEN || '',
    daysThreshold: options.daysThreshold || 90,
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

    console.log('📧 Branch Owner Notifications');
    console.log('============================');
    console.log('');

    const result = await notifyBranchOwners(options);

    // Exit with error code if there were errors
    if (result.errors.length > 0) {
      console.log('');
      console.log('❌ Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }

    console.log('');
    console.log('✅ Notification process completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { notifyBranchOwners, type NotificationOptions, type BranchOwner, type NotificationResult };
