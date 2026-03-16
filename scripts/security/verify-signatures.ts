#!/usr/bin/env tsx

/**
 * Cryptographic Verification Script
 * 
 * This script provides cryptographic verification capabilities for
 * build artifacts, signatures, and supply chain security.
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { CryptoVerifier, KeyPair, DigitalSignature } from '../../packages/security/src/crypto'

const program = new Command()

program
  .name('verify-signatures')
  .description('Cryptographic verification for agency platform')
  .option('-p, --path <path>', 'Path to verify', '.')
  .option('-o, --output <path>', 'Output directory for reports', './crypto-reports')
  .option('--generate-keys', 'Generate new key pair', false)
  .option('--key-type <type>', 'Key type (rsa|ed25519)', 'ed25519')
  .option('--key-size <size>', 'RSA key size (2048|4096)', '2048')
  .option('--sign <file>', 'Sign a file')
  .option('--verify <file>', 'Verify a file')
  .option('--signature <sig>', 'Signature file for verification')
  .option('--public-key <key>', 'Public key file for verification')
  .option('--key-id <id>', 'Key ID for stored keys')
  .option('--build-proof', 'Generate build proof for directory', false)
  .option('--hash <file>', 'Calculate file hash')
  .option('--algorithm <algo>', 'Hash algorithm (sha256|sha384|sha512)', 'sha256')
  .action(async (options) => {
    try {
      console.log('🔒 Agency Platform Cryptographic Verifier')
      console.log('==========================================')

      // Create output directory
      if (!existsSync(options.output)) {
        mkdirSync(options.output, { recursive: true })
      }

      // Initialize crypto verifier
      const verifier = new CryptoVerifier()

      if (options.generateKeys) {
        // Generate new key pair
        console.log('🔑 Generating new key pair...')
        
        const keyType = options.keyType as 'rsa' | 'ed25519'
        const keySize = parseInt(options.keySize)
        
        const keyPair = verifier.generateKeyPair(keyType, keySize)
        const keyId = verifier['generateKeyId'](keyPair.publicKey)
        
        console.log(`✅ Key pair generated: ${keyId}`)
        console.log(`🔧 Type: ${keyType}`)
        if (keyType === 'rsa') {
          console.log(`📏 Size: ${keySize} bits`)
        }
        
        // Save key pair
        verifier.saveKeyPair(keyPair, keyId, options.output)
        
        // Save key info
        const keyInfo = {
          keyId,
          keyType,
          keySize: keyType === 'rsa' ? keySize : undefined,
          generated: new Date().toISOString(),
          publicKeyFingerprint: verifier['generateKeyId'](keyPair.publicKey),
        }
        
        const keyInfoFile = join(options.output, `${keyId}-info.json`)
        writeFileSync(keyInfoFile, JSON.stringify(keyInfo, null, 2))
        console.log(`📄 Key info: ${keyInfoFile}`)
        
        console.log('')
        console.log('🔐 Public Key:')
        console.log(keyPair.publicKey)
        console.log('')
        console.log('⚠️  Keep your private key secure!')
        return
      }

      if (options.sign) {
        // Sign a file
        console.log(`✍️  Signing file: ${options.sign}`)
        
        if (!existsSync(options.sign)) {
          console.error(`❌ Error: File not found: ${options.sign}`)
          process.exit(1)
        }

        // Load or generate key pair
        let keyPair: KeyPair
        if (options.keyId) {
          keyPair = verifier.loadKeyPair(options.keyId, options.output)
        } else {
          console.log('🔑 No key ID provided, generating temporary key pair...')
          keyPair = verifier.generateKeyPair('ed25519')
        }

        const fileContent = require('fs').readFileSync(options.sign, 'utf8')
        const signature = verifier.sign(fileContent, keyPair.privateKey)
        
        // Save signature
        const signatureFile = join(options.output, `${options.sign}.sig`)
        writeFileSync(signatureFile, JSON.stringify(signature, null, 2))
        
        console.log(`✅ File signed successfully`)
        console.log(`📄 Signature: ${signatureFile}`)
        console.log(`🔐 Key ID: ${verifier['generateKeyId'](keyPair.publicKey)}`)
        console.log(`⏰ Timestamp: ${signature.timestamp}`)
        return
      }

      if (options.verify && options.signature && options.publicKey) {
        // Verify a file
        console.log(`🔍 Verifying file: ${options.verify}`)
        
        if (!existsSync(options.verify)) {
          console.error(`❌ Error: File not found: ${options.verify}`)
          process.exit(1)
        }

        if (!existsSync(options.signature)) {
          console.error(`❌ Error: Signature file not found: ${options.signature}`)
          process.exit(1)
        }

        if (!existsSync(options.publicKey)) {
          console.error(`❌ Error: Public key file not found: ${options.publicKey}`)
          process.exit(1)
        }

        const fileContent = require('fs').readFileSync(options.verify, 'utf8')
        const signatureData = JSON.parse(require('fs').readFileSync(options.signature, 'utf8'))
        const publicKey = require('fs').readFileSync(options.publicKey, 'utf8')

        const signature: DigitalSignature = {
          ...signatureData,
          publicKey,
        }

        const result = verifier.verifySignature(fileContent, signature)
        
        console.log(`📊 Verification result: ${result.verified ? 'VERIFIED' : 'FAILED'}`)
        console.log(`🔧 Algorithm: ${result.algorithm}`)
        console.log(`⏰ Timestamp: ${result.timestamp}`)
        
        if (result.error) {
          console.log(`❌ Error: ${result.error}`)
        }

        if (result.details) {
          console.log('')
          console.log('📈 Details:')
          Object.entries(result.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`)
          })
        }

        if (!result.verified) {
          console.log('')
          console.log('❌ Signature verification failed!')
          process.exit(1)
        }

        console.log('')
        console.log('✅ Signature verified successfully!')
        return
      }

      if (options.buildProof) {
        // Generate build proof for directory
        console.log(`🏗️  Generating build proof for: ${options.path}`)
        
        if (!existsSync(options.path)) {
          console.error(`❌ Error: Path not found: ${options.path}`)
          process.exit(1)
        }

        // Get all files and their hashes
        const artifacts = []
        const { readdirSync, statSync } = require('fs')
        const { join } = require('path')
        
        const getAllFiles = (dir: string): string[] => {
          const files: string[] = []
          const items = readdirSync(dir)
          
          for (const item of items) {
            const fullPath = join(dir, item)
            const stats = statSync(fullPath)
            
            if (stats.isDirectory()) {
              files.push(...getAllFiles(fullPath))
            } else {
              files.push(fullPath)
            }
          }
          
          return files
        }

        const files = getAllFiles(options.path)
        
        for (const file of files) {
          try {
            const content = require('fs').readFileSync(file, 'utf8')
            const hash = verifier.createHash(content, 'sha256')
            artifacts.push({ path: file, hash })
          } catch (error) {
            console.warn(`Warning: Could not hash file ${file}`)
          }
        }

        // Generate or load key pair
        let keyPair: KeyPair
        if (options.keyId) {
          keyPair = verifier.loadKeyPair(options.keyId, options.output)
        } else {
          console.log('🔑 No key ID provided, generating temporary key pair...')
          keyPair = verifier.generateKeyPair('ed25519')
        }

        // Generate build proof
        const buildProof = verifier.generateBuildProof(artifacts, keyPair.privateKey)
        
        // Save build proof
        const proofFile = join(options.output, 'build-proof.json')
        writeFileSync(proofFile, JSON.stringify(buildProof, null, 2))
        
        // Save signature
        const signatureFile = join(options.output, 'build-proof.signature')
        writeFileSync(signatureFile, JSON.stringify(buildProof.signature, null, 2))
        
        console.log(`✅ Build proof generated`)
        console.log(`📄 Proof: ${proofFile}`)
        console.log(`📄 Signature: ${signatureFile}`)
        console.log(`🔐 Key ID: ${verifier['generateKeyId'](keyPair.publicKey)}`)
        console.log(`📦 Artifacts: ${artifacts.length}`)
        return
      }

      if (options.hash) {
        // Calculate file hash
        console.log(`🔢 Calculating hash for: ${options.hash}`)
        
        if (!existsSync(options.hash)) {
          console.error(`❌ Error: File not found: ${options.hash}`)
          process.exit(1)
        }

        const algorithm = options.algorithm as 'sha256' | 'sha384' | 'sha512'
        const fileContent = require('fs').readFileSync(options.hash, 'utf8')
        const hash = verifier.createHash(fileContent, algorithm)
        
        console.log(`🔢 Hash (${algorithm}): ${hash}`)
        
        // Save hash info
        const hashInfo = {
          file: options.hash,
          algorithm,
          hash,
          timestamp: new Date().toISOString(),
          fileSize: fileContent.length,
        }
        
        const hashFile = join(options.output, `${options.hash}.${algorithm}`)
        writeFileSync(hashFile, JSON.stringify(hashInfo, null, 2))
        console.log(`📄 Hash info: ${hashFile}`)
        return
      }

      // Default: comprehensive cryptographic verification
      console.log('🔍 Running comprehensive cryptographic verification...')
      
      const results = []
      
      // Check for existing signatures
      const signatureFiles = require('fs').readdirSync(options.path)
        .filter((file: string) => file.endsWith('.sig'))
      
      for (const sigFile of signatureFiles) {
        const sigPath = join(options.path, sigFile)
        const originalFile = sigFile.replace('.sig', '')
        const originalPath = join(options.path, originalFile)
        
        if (existsSync(originalPath)) {
          try {
            const fileContent = require('fs').readFileSync(originalPath, 'utf8')
            const signatureData = JSON.parse(require('fs').readFileSync(sigPath, 'utf8'))
            const result = verifier.verifySignature(fileContent, signatureData)
            
            results.push({
              file: originalFile,
              verified: result.verified,
              algorithm: result.algorithm,
              timestamp: result.timestamp,
              error: result.error,
            })
            
            const status = result.verified ? '✅' : '❌'
            console.log(`${status} ${originalFile}: ${result.verified ? 'VERIFIED' : 'FAILED'}`)
          } catch (error) {
            results.push({
              file: originalFile,
              verified: false,
              algorithm: 'unknown',
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            
            console.log(`❌ ${originalFile}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // Generate summary report
      const verifiedCount = results.filter(r => r.verified).length
      const failedCount = results.filter(r => !r.verified).length
      
      console.log('')
      console.log('📊 Verification Summary:')
      console.log(`   Total files: ${results.length}`)
      console.log(`   Verified: ${verifiedCount}`)
      console.log(`   Failed: ${failedCount}`)
      
      // Save verification report
      const report = {
        timestamp: new Date().toISOString(),
        path: options.path,
        results,
        summary: {
          total: results.length,
          verified: verifiedCount,
          failed: failedCount,
        },
      }
      
      const reportFile = join(options.output, 'crypto-verification-report.json')
      writeFileSync(reportFile, JSON.stringify(report, null, 2))
      console.log(`📄 Verification report: ${reportFile}`)

      if (failedCount > 0) {
        console.log('')
        console.log('❌ Some cryptographic verifications failed!')
        process.exit(1)
      }

      console.log('')
      console.log('✅ All cryptographic verifications passed!')

    } catch (error) {
      console.error('❌ Error in cryptographic verification:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()

// Export for use in other scripts
export {}
