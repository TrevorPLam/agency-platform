#!/usr/bin/env tsx

import { program } from 'commander';
import { retentionManager } from '@agency/artifacts/retention';
import { Environment } from '@agency/artifacts/types';

program
  .name('cleanup-artifacts')
  .description('Apply retention policies to clean up old artifacts')
  .option('-e, --environment <environment>', 'Target environment (development, staging, production)')
  .option('-d, --dry-run', 'Show what would be deleted without actually deleting')
  .option('-r, --report', 'Generate detailed cleanup report')
  .parse();

const options = program.opts();

async function main() {
  try {
    const environment = options.environment as Environment;
    
    if (environment && !['development', 'staging', 'production'].includes(environment)) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    console.log('🧹 Running artifact cleanup...');
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No artifacts will be deleted');
    }

    // Get retention statistics first
    const stats = await retentionManager.getRetentionStatistics();
    console.log(`\n📊 Current Statistics:`);
    console.log(`   Total Artifacts: ${stats.totalArtifacts}`);
    console.log(`   Total Policies: ${stats.totalPolicies}`);
    console.log(`   Estimated Storage Savings: ${(stats.estimatedStorageSavings / 1024 / 1024).toFixed(2)} MB`);

    if (environment) {
      console.log(`   Environment: ${environment}`);
      console.log(`   Artifacts in ${environment}: ${stats.artifactsByEnvironment[environment] || 0}`);
    }

    if (!options.dryRun) {
      // Apply retention policies
      const report = await retentionManager.applyRetentionPolicies();
      
      console.log(`\n✅ Cleanup completed!`);
      console.log(`📋 Summary:`);
      console.log(`   Total Policies Applied: ${report.totalPolicies}`);
      console.log(`   Total Artifacts Evaluated: ${report.totalArtifactsEvaluated}`);
      console.log(`   Artifacts Archived: ${report.artifactsArchived}`);
      console.log(`   Artifacts Deleted: ${report.artifactsDeleted}`);
      console.log(`   Artifacts Retained: ${report.artifactsRetained}`);
      
      if (report.errors.length > 0) {
        console.log(`\n⚠️  Errors (${report.errors.length}):`);
        report.errors.forEach(error => {
          console.log(`   ❌ ${error.policyName}: ${error.error}`);
        });
      }

      if (options.report) {
        console.log(`\n📄 Detailed Report:`);
        report.details.forEach(policyReport => {
          console.log(`\n🏷️  Policy: ${policyReport.policyName} (${policyReport.environment})`);
          console.log(`   Evaluated: ${policyReport.totalArtifactsEvaluated}`);
          console.log(`   Archived: ${policyReport.artifactsArchived}`);
          console.log(`   Deleted: ${policyReport.artifactsDeleted}`);
          console.log(`   Retained: ${policyReport.artifactsRetained}`);
          
          policyReport.details.forEach(artifactReport => {
            if (artifactReport.deleted > 0 || artifactReport.archived > 0) {
              console.log(`\n   📦 ${artifactReport.artifactName}:`);
              console.log(`      Versions: ${artifactReport.totalVersions}`);
              console.log(`      Deleted: ${artifactReport.deleted}`);
              console.log(`      Archived: ${artifactReport.archived}`);
              console.log(`      Retained: ${artifactReport.retained}`);
              
              artifactReport.actions.forEach(action => {
                console.log(`      ${action.action === 'deleted' ? '🗑️' : '📦'} ${action.version} - ${action.reason} (${action.ageInDays} days old)`);
              });
            }
          });
        });
      }
    } else {
      console.log('\n💡 To actually delete artifacts, run without --dry-run flag');
    }

  } catch (error) {
    console.error('❌ Failed to cleanup artifacts:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
