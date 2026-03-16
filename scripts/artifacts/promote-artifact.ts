#!/usr/bin/env tsx

import { program } from 'commander';
import { artifactPromotion } from '@agency/artifacts/promotion';
import { createArtifactId, Environment } from '@agency/artifacts/types';

program
  .name('promote-artifact')
  .description('Create and manage artifact promotions')
  .requiredOption('-a, --artifact-id <id>', 'Artifact ID')
  .requiredOption('-e, --environment <environment>', 'Target environment (development, staging, production)')
  .option('-r, --required-approvals <number>', 'Number of required approvals', '1')
  .option('--approve', 'Approve the promotion request')
  .option('--reject', 'Reject the promotion request')
  .option('--reason <reason>', 'Reason for rejection (required with --reject)')
  .option('--approver <name>', 'Approver name (required with --approve)')
  .parse();

const options = program.opts();

async function main() {
  try {
    const artifactId = createArtifactId(options.artifactId);
    const environment = options.environment as Environment;
    const requiredApprovals = parseInt(options.requiredApprovals, 10);

    // Validate inputs
    if (!['development', 'staging', 'production'].includes(environment)) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    if (isNaN(requiredApprovals) || requiredApprovals < 1) {
      throw new Error(`Invalid required approvals: ${options.requiredApprovals}`);
    }

    if (options.approve && !options.approver) {
      throw new Error('--approver is required when using --approve');
    }

    if (options.reject && !options.reason) {
      throw new Error('--reason is required when using --reject');
    }

    // Create promotion request
    const promotion = await artifactPromotion.createPromotionRequest(
      artifactId,
      environment,
      requiredApprovals
    );

    console.log('✅ Promotion request created successfully!');
    console.log(`📋 ID: ${promotion.id}`);
    console.log(`🔄 From: ${promotion.fromEnvironment} → To: ${promotion.toEnvironment}`);
    console.log(`📊 Status: ${promotion.status}`);
    console.log(`✅ Required Approvals: ${promotion.requiredApprovals}`);
    console.log(`👥 Current Approvals: ${promotion.currentApprovals}`);
    console.log(`📅 Created: ${promotion.createdAt.toISOString()}`);
    console.log(`🔍 Checks: ${promotion.checks.length}`);

    // Handle approval/rejection
    if (options.approve) {
      console.log(`\n🎯 Approving promotion as ${options.approver}...`);
      const approvedPromotion = await artifactPromotion.approvePromotion(promotion.id, options.approver);
      
      console.log(`✅ Promotion approved!`);
      console.log(`📊 Status: ${approvedPromotion.status}`);
      console.log(`👥 Current Approvals: ${approvedPromotion.currentApprovals}`);
      
      if (approvedPromotion.status === 'completed') {
        console.log(`🎉 Promotion completed at ${approvedPromotion.completedAt?.toISOString()}`);
      }
    } else if (options.reject) {
      console.log(`\n❌ Rejecting promotion...`);
      const rejectedPromotion = await artifactPromotion.rejectPromotion(promotion.id, options.reason, options.approver || 'system');
      
      console.log(`❌ Promotion rejected!`);
      console.log(`📊 Status: ${rejectedPromotion.status}`);
      console.log(`💬 Reason: ${options.reason}`);
      console.log(`📅 Rejected at: ${rejectedPromotion.completedAt?.toISOString()}`);
    } else {
      console.log(`\n💡 To approve this promotion, run:`);
      console.log(`   tsx scripts/artifacts/promote-artifact.ts --artifact-id ${options.artifactId} --environment ${environment} --approve --approver <your-name>`);
      console.log(`\n💡 To reject this promotion, run:`);
      console.log(`   tsx scripts/artifacts/promote-artifact.ts --artifact-id ${options.artifactId} --environment ${environment} --reject --reason "<reason>"`);
    }
    
  } catch (error) {
    console.error('❌ Failed to manage promotion:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
