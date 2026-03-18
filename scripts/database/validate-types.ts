#!/usr/bin/env tsx

/**
 * Database Type Generation Validation Script
 * 
 * This script validates that the database types are in sync with the current schema.
 * It's designed to work in both local and CI environments.
 * 
 * Usage:
 *   - Local: `pnpm db:types:validate`
 *   - CI: Automatically called via GitHub Actions
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')
const typesPath = join(projectRoot, 'packages', 'database', 'src', 'types.ts')
const tempTypesPath = join(projectRoot, '.tmp', 'types-check.ts')

interface ValidationResult {
  success: boolean
  message: string
  details?: string
}

function ensureDirExists(filePath: string): void {
  const dir = dirname(filePath)
  try {
    execSync(`mkdir -p "${dir}"`, { stdio: 'ignore' })
  } catch (error) {
    // Directory already exists or couldn't be created (ignore)
  }
}

function generateTypes(outputPath: string): ValidationResult {
  try {
    console.log('🔄 Generating database types...')
    
    // Generate types using Supabase CLI with deterministic schema
    const command = `npx supabase gen types typescript --local --schema public > "${outputPath}"`
    execSync(command, { 
      stdio: 'pipe',
      cwd: projectRoot,
      env: {
        ...process.env,
        // Ensure deterministic output by setting locale
        LC_ALL: 'C',
        LANG: 'C'
      }
    })
    
    console.log('✅ Database types generated successfully')
    return { success: true, message: 'Types generated successfully' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Failed to generate database types:', errorMessage)
    return { 
      success: false, 
      message: 'Failed to generate types', 
      details: errorMessage 
    }
  }
}

function compareFiles(file1: string, file2: string): boolean {
  try {
    const content1 = readFileSync(file1, 'utf8').trim()
    const content2 = readFileSync(file2, 'utf8').trim()
    
    // Normalize line endings and whitespace for consistent comparison
    const normalize = (content: string) => 
      content.replace(/\r\n/g, '\n')
            .replace(/\s+$/gm, '') // Remove trailing whitespace
            .trim()
    
    return normalize(content1) === normalize(content2)
  } catch (error) {
    console.error('❌ Failed to compare files:', error)
    return false
  }
}

function validateTypes(): ValidationResult {
  try {
    // Check if types.ts exists
    try {
      readFileSync(typesPath, 'utf8')
    } catch (error) {
      return {
        success: false,
        message: 'Database types file does not exist',
        details: `Run 'pnpm db:generate-types:local' to create it`
      }
    }

    // Generate temporary types for comparison
    ensureDirExists(tempTypesPath)
    const generateResult = generateTypes(tempTypesPath)
    if (!generateResult.success) {
      return generateResult
    }

    // Compare current types with generated types
    const areIdentical = compareFiles(typesPath, tempTypesPath)
    
    if (areIdentical) {
      console.log('✅ Database types are up to date')
      return { success: true, message: 'Types are up to date' }
    } else {
      console.log('⚠️  Database types are out of sync')
      
      // Show diff for debugging (optional, can be verbose)
      if (process.env.DEBUG === 'true') {
        try {
          execSync(`diff -u "${typesPath}" "${tempTypesPath}" || true`, { 
            stdio: 'inherit',
            cwd: projectRoot 
          })
        } catch (error) {
          // Diff command always exits with 1 when files differ, ignore
        }
      }
      
      return {
        success: false,
        message: 'Database types are out of sync',
        details: `Run 'pnpm db:generate-types:local' to update types.ts`
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: 'Validation failed',
      details: errorMessage
    }
  } finally {
    // Clean up temporary file
    try {
      execSync(`rm -f "${tempTypesPath}"`, { stdio: 'ignore' })
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

function updateTypes(): ValidationResult {
  try {
    const result = generateTypes(typesPath)
    if (result.success) {
      console.log('✅ Database types updated successfully')
      console.log('💡 Don\'t forget to commit the changes to types.ts')
    }
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: 'Failed to update types',
      details: errorMessage
    }
  }
}

// Main execution
function main(): void {
  const command = process.argv[2]
  
  switch (command) {
    case 'check':
      const validationResult = validateTypes()
      if (!validationResult.success) {
        console.error('❌', validationResult.message)
        if (validationResult.details) {
          console.error('📝', validationResult.details)
        }
        process.exit(1)
      }
      break
      
    case 'update':
      const updateResult = updateTypes()
      if (!updateResult.success) {
        console.error('❌', updateResult.message)
        if (updateResult.details) {
          console.error('📝', updateResult.details)
        }
        process.exit(1)
      }
      break
      
    default:
      console.log('Usage:')
      console.log('  tsx validate-types.ts check   - Validate types are up to date')
      console.log('  tsx validate-types.ts update  - Update types from current schema')
      process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { validateTypes, updateTypes }
