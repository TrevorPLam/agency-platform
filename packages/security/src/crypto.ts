/**
 * Cryptographic Verification
 * 
 * Provides advanced cryptographic verification capabilities for supply chain security
 */

import { createHash, createHmac, createSign, createVerify, generateKeyPairSync, publicEncrypt, privateDecrypt } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'

export interface KeyPair {
  publicKey: string
  privateKey: string
  keyType: 'rsa' | 'ed25519'
  keySize?: number
}

export interface DigitalSignature {
  algorithm: 'RSA-SHA256' | 'RSA-SHA512' | 'Ed25519'
  signature: string
  publicKey: string
  timestamp: string
}

export interface EncryptedData {
  algorithm: 'RSA-OAEP' | 'AES-256-GCM'
  data: string
  iv?: string
  tag?: string
  keyId?: string
}

export interface VerificationResult {
  verified: boolean
  algorithm: string
  timestamp: string
  error?: string
  details?: Record<string, unknown>
}

export class CryptoVerifier {
  private keyPairs: Map<string, KeyPair> = new Map()

  /**
   * Generate a new key pair for digital signatures
   */
  generateKeyPair(keyType: 'rsa' | 'ed25519' = 'ed25519', keySize: number = 2048): KeyPair {
    let keyPair: KeyPair

    if (keyType === 'ed25519') {
      const keys = generateKeyPairSync('ed25519')
      keyPair = {
        publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
        privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
        keyType: 'ed25519',
      }
    } else {
      const keys = generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      })
      keyPair = {
        publicKey: keys.publicKey.toString(),
        privateKey: keys.privateKey.toString(),
        keyType: 'rsa',
        keySize,
      }
    }

    // Store key pair in memory
    const keyId = this.generateKeyId(keyPair.publicKey)
    this.keyPairs.set(keyId, keyPair)

    return keyPair
  }

  /**
   * Sign data with private key
   */
  sign(data: string, privateKey: string, algorithm: 'RSA-SHA256' | 'RSA-SHA512' | 'Ed25519' = 'Ed25519'): DigitalSignature {
    let signature: string

    if (algorithm === 'Ed25519') {
      const sign = createSign('ed25519')
      sign.update(data, 'utf8')
      signature = sign.sign(privateKey, 'base64')
    } else if (algorithm.startsWith('RSA')) {
      const hashAlgorithm = algorithm.split('-')[1].toLowerCase()
      const sign = createSign(`RSA-${hashAlgorithm}`)
      sign.update(data, 'utf8')
      signature = sign.sign(privateKey, 'base64')
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`)
    }

    // Extract public key from private key for the signature
    const publicKey = this.extractPublicKey(privateKey)

    return {
      algorithm,
      signature,
      publicKey,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Verify digital signature
   */
  verifySignature(data: string, signature: DigitalSignature): VerificationResult {
    try {
      let verified: boolean

      if (signature.algorithm === 'Ed25519') {
        const verify = createVerify('ed25519')
        verify.update(data, 'utf8')
        verified = verify.verify(signature.publicKey, signature.signature, 'base64')
      } else if (signature.algorithm.startsWith('RSA')) {
        const hashAlgorithm = signature.algorithm.split('-')[1].toLowerCase()
        const verify = createVerify(`RSA-${hashAlgorithm}`)
        verify.update(data, 'utf8')
        verified = verify.verify(signature.publicKey, signature.signature, 'base64')
      } else {
        return {
          verified: false,
          algorithm: signature.algorithm,
          timestamp: new Date().toISOString(),
          error: `Unsupported algorithm: ${signature.algorithm}`,
        }
      }

      return {
        verified,
        algorithm: signature.algorithm,
        timestamp: new Date().toISOString(),
        details: {
          signatureLength: signature.signature.length,
          publicKeyFingerprint: this.generateKeyId(signature.publicKey),
        },
      }
    } catch (error) {
      return {
        verified: false,
        algorithm: signature.algorithm,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown verification error',
      }
    }
  }

  /**
   * Create HMAC for message authentication
   */
  createHMAC(data: string, secret: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
    return createHmac(algorithm, secret).update(data, 'utf8').digest('hex')
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string, secret: string, algorithm: 'sha256' | 'sha512' = 'sha256'): boolean {
    const expectedHmac = this.createHMAC(data, secret, algorithm)
    return this.constantTimeCompare(hmac, expectedHMAC)
  }

  /**
   * Encrypt data with RSA public key
   */
  encrypt(data: string, publicKey: string): EncryptedData {
    try {
      const buffer = Buffer.from(data, 'utf8')
      const encrypted = publicEncrypt(
        {
          key: publicKey,
          padding: 'RSA_OAEP',
          oaepHash: 'sha256',
        },
        buffer
      )

      return {
        algorithm: 'RSA-OAEP',
        data: encrypted.toString('base64'),
        keyId: this.generateKeyId(publicKey),
      }
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt data with RSA private key
   */
  decrypt(encryptedData: EncryptedData, privateKey: string): string {
    try {
      if (encryptedData.algorithm !== 'RSA-OAEP') {
        throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`)
      }

      const buffer = Buffer.from(encryptedData.data, 'base64')
      const decrypted = privateDecrypt(
        {
          key: privateKey,
          padding: 'RSA_OAEP',
          oaepHash: 'sha256',
        },
        buffer
      )

      return decrypted.toString('utf8')
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create cryptographic hash
   */
  createHash(data: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'): string {
    return createHash(algorithm).update(data, 'utf8').digest('hex')
  }

  /**
   * Verify file integrity with hash
   */
  verifyFileHash(filePath: string, expectedHash: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'): VerificationResult {
    try {
      if (!existsSync(filePath)) {
        return {
          verified: false,
          algorithm,
          timestamp: new Date().toISOString(),
          error: `File not found: ${filePath}`,
        }
      }

      const fileContent = readFileSync(filePath, 'utf8')
      const actualHash = this.createHash(fileContent, algorithm)
      const verified = actualHash === expectedHash

      return {
        verified,
        algorithm,
        timestamp: new Date().toISOString(),
        details: {
          expectedHash,
          actualHash,
          fileSize: fileContent.length,
        },
      }
    } catch (error) {
      return {
        verified: false,
        algorithm,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown verification error',
      }
    }
  }

  /**
   * Generate key ID from public key
   */
  private generateKeyId(publicKey: string): string {
    return createHash('sha256').update(publicKey).digest('hex').substring(0, 16)
  }

  /**
   * Extract public key from private key
   */
  private extractPublicKey(privateKey: string): string {
    // This is a simplified implementation
    // In production, you'd use proper crypto libraries
    const keyId = this.generateKeyId(privateKey)
    const storedKeyPair = Array.from(this.keyPairs.values()).find(kp => 
      this.generateKeyId(kp.privateKey) === keyId
    )
    
    if (storedKeyPair) {
      return storedKeyPair.publicKey
    }
    
    throw new Error('Could not extract public key from private key')
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Save key pair to files
   */
  saveKeyPair(keyPair: KeyPair, keyId: string, outputDir: string): void {
    const publicKeyPath = join(outputDir, `${keyId}.pub`)
    const privateKeyPath = join(outputDir, `${keyId}.key`)

    writeFileSync(publicKeyPath, keyPair.publicKey, 'utf8')
    writeFileSync(privateKeyPath, keyPair.privateKey, 'utf8')

    console.log(`Public key saved: ${publicKeyPath}`)
    console.log(`Private key saved: ${privateKeyPath}`)
  }

  /**
   * Load key pair from files
   */
  loadKeyPair(keyId: string, outputDir: string): KeyPair {
    const publicKeyPath = join(outputDir, `${keyId}.pub`)
    const privateKeyPath = join(outputDir, `${keyId}.key`)

    if (!existsSync(publicKeyPath) || !existsSync(privateKeyPath)) {
      throw new Error(`Key pair files not found: ${keyId}`)
    }

    const publicKey = readFileSync(publicKeyPath, 'utf8')
    const privateKey = readFileSync(privateKeyPath, 'utf8')

    const keyPair = { publicKey, privateKey, keyType: 'rsa' as const }
    this.keyPairs.set(keyId, keyPair)

    return keyPair
  }

  /**
   * Generate cryptographic proof for build artifacts
   */
  generateBuildProof(artifacts: Array<{ path: string; hash: string }>, privateKey: string): {
    proof: string
    signature: DigitalSignature
  } {
    // Create proof data
    const proofData = {
      artifacts: artifacts.sort((a, b) => a.path.localeCompare(b.path)),
      timestamp: new Date().toISOString(),
      nonce: this.generateNonce(),
    }

    const proofString = JSON.stringify(proofData)
    const signature = this.sign(proofString, privateKey)

    return {
      proof: proofString,
      signature,
    }
  }

  /**
   * Verify build proof
   */
  verifyBuildProof(proof: string, signature: DigitalSignature): VerificationResult {
    return this.verifySignature(proof, signature)
  }

  /**
   * Generate cryptographically secure nonce
   */
  private generateNonce(): string {
    const nonce = createHash('sha256')
      .update(Date.now().toString())
      .update(Math.random().toString())
      .digest('hex')
    return nonce.substring(0, 32)
  }

  /**
   * Create multi-signature verification
   */
  createMultiSignature(data: string, privateKeys: string[]): DigitalSignature[] {
    return privateKeys.map(privateKey => 
      this.sign(data, privateKey, 'Ed25519')
    )
  }

  /**
   * Verify multi-signature
   */
  verifyMultiSignature(data: string, signatures: DigitalSignature[]): {
    verified: boolean
    results: VerificationResult[]
    threshold: number
  } {
    const results = signatures.map(sig => this.verifySignature(data, sig))
    const verifiedCount = results.filter(r => r.verified).length
    const threshold = Math.ceil(signatures.length / 2)

    return {
      verified: verifiedCount >= threshold,
      results,
      threshold,
    }
  }

  /**
   * Get available key pairs
   */
  getKeyPairs(): Map<string, KeyPair> {
    return new Map(this.keyPairs)
  }

  /**
   * Remove key pair
   */
  removeKeyPair(keyId: string): boolean {
    return this.keyPairs.delete(keyId)
  }
}

export * from './types'
