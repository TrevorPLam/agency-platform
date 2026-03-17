// File validation and security
export {
  FileValidator,
  FileValidationSchema,
  type FileValidationInput,
  type FileValidationResult,
  type FileMetadata,
  FILE_SIGNATURES,
  ALLOWED_FILE_TYPES,
  BLOCKED_FILE_TYPES,
  FILE_SIZE_LIMITS,
} from './file-validator'

// Virus scanning
export {
  VirusScanner,
  VirusTotalScanner,
  MockVirusScanner,
  VirusScannerFactory,
  VirusScanningService,
  VirusScanConfigSchema,
  type VirusScanConfig,
  type ScanResult,
  type ScanRequest,
} from './virus-scanner'

// Storage service
export {
  StorageService,
  StorageConfigSchema,
  type StorageConfig,
  type UploadRequest,
  type UploadResult,
  type FileRecord,
} from './storage-service'

// Re-export for convenience
export type { FileValidator as IFileValidator } from './file-validator'
export type { VirusScanner as IVirusScanner } from './virus-scanner'
export type { StorageService as IStorageService } from './storage-service'
