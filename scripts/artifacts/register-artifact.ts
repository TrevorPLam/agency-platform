#!/usr/bin/env tsx

import { program } from 'commander';
import { artifactRegistry } from '@agency/artifacts/registry';
import { ArtifactType, Environment } from '@agency/artifacts/types';

program
  .name('register-artifact')
  .description('Register a new artifact in the registry')
  .requiredOption('-n, --name <name>', 'Artifact name')
  .requiredOption('-v, --version <version>', 'Artifact version')
  .requiredOption('-t, --type <type>', 'Artifact type (package, container, binary, document)')
  .requiredOption('-e, --environment <environment>', 'Target environment (development, staging, production)')
  .requiredOption('-f, --file <path>', 'Path to artifact file')
  .option('-b, --build-id <id>', 'Build ID')
  .option('-c, --commit-sha <sha>', 'Commit SHA')
  .option('-B, --branch <branch>', 'Git branch')
  .option('-a, --author <author>', 'Author name')
  .option('-d, --description <description>', 'Artifact description')
  .option('--tags <tags>', 'Comma-separated tags')
  .parse();

const options = program.opts();

async function main() {
  try {
    // Validate inputs
    const artifactType = options.type as ArtifactType;
    const environment = options.environment as Environment;
    
    if (!['package', 'container', 'binary', 'document'].includes(artifactType)) {
      throw new Error(`Invalid artifact type: ${artifactType}`);
    }
    
    if (!['development', 'staging', 'production'].includes(environment)) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    // Read artifact file
    const fs = await import('fs/promises');
    const content = await fs.readFile(options.file);

    // Parse tags
    const tags = options.tags ? options.tags.split(',').map((tag: string) => tag.trim()) : [];

    // Create metadata
    const metadata = {
      buildId: options.buildId || `build-${Date.now()}`,
      commitSha: options.commitSha || 'unknown',
      branch: options.branch || 'main',
      author: options.author || 'unknown',
      description: options.description,
      tags,
      dependencies: [], // Would be extracted from package.json or similar
    };

    // Register artifact
    const artifact = await artifactRegistry.registerArtifact(
      options.name,
      options.version,
      artifactType,
      environment,
      content,
      metadata
    );

    console.log('✅ Artifact registered successfully!');
    console.log(`📦 ID: ${artifact.id}`);
    console.log(`📋 Name: ${artifact.name}:${artifact.version}`);
    console.log(`🏷️  Type: ${artifact.type}`);
    console.log(`🌍 Environment: ${artifact.environment}`);
    console.log(`📏 Size: ${artifact.size} bytes`);
    console.log(`🔐 Integrity: ${artifact.integrity}`);
    console.log(`📅 Created: ${artifact.createdAt.toISOString()}`);
    
  } catch (error) {
    console.error('❌ Failed to register artifact:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
