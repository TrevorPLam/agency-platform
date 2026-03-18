import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@agency/database/admin'
import { StorageService, StorageConfig } from '@agency/storage'
import { getCurrentUser } from '@/lib/auth'
import { validateTenantAccess } from '@/lib/tenant-validation'
import { z } from 'zod'

// Environment variable validation schema
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STORAGE_BUCKET_NAME: z.string().default('uploads'),
  VIRUS_SCANNING_ENABLED: z.enum(['true', 'false']).transform(val => val === 'true').default(false),
  VIRUS_SCAN_PROVIDER: z.enum(['clamav', 'virustotal', 'none']).default('none'),
  VIRUSTOTAL_API_KEY: z.string().optional(),
  VIRUS_SCAN_TIMEOUT: z.string().transform(Number).default('30000'),
  VIRUS_SCAN_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),
  VIRUS_SCAN_RETRY_DELAY: z.string().transform(Number).default('1000'),
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'),
  ENABLE_FILE_QUARANTINE: z.enum(['true', 'false']).transform(val => val !== 'false').default(true),
  FILE_RETENTION_DAYS: z.string().transform(Number).default('365'),
})

// Validate environment variables
const env = EnvSchema.parse(process.env)

// Storage configuration from validated environment
const storageConfig: StorageConfig = {
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  bucketName: env.STORAGE_BUCKET_NAME,
  virusScanning: {
    enabled: env.VIRUS_SCANNING_ENABLED,
    provider: env.VIRUS_SCAN_PROVIDER,
    apiKey: env.VIRUSTOTAL_API_KEY,
    timeout: env.VIRUS_SCAN_TIMEOUT,
    retryAttempts: env.VIRUS_SCAN_RETRY_ATTEMPTS,
    retryDelay: env.VIRUS_SCAN_RETRY_DELAY,
  },
  maxFileSize: env.MAX_FILE_SIZE,
  enableQuarantine: env.ENABLE_FILE_QUARANTINE,
  retentionDays: env.FILE_RETENTION_DAYS,
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication and authorization
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required to upload files.',
        },
        { status: 401 }
      )
    }

    // 2. Tenant validation
    const tenantAccess = await validateTenantAccess(request)
    if (!tenantAccess) {
      return NextResponse.json(
        {
          code: 'TENANT_NOT_FOUND',
          status: 404,
          title: 'Tenant not found',
          detail: 'Tenant could not be resolved from request.',
        },
        { status: 404 }
      )
    }

    // 3. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          code: 'MISSING_FILE',
          status: 400,
          title: 'Missing file',
          detail: 'No file provided in upload request.',
        },
        { status: 400 }
      )
    }

    // 4. Validate file size
    if (file.size > storageConfig.maxFileSize) {
      return NextResponse.json(
        {
          code: 'FILE_TOO_LARGE',
          status: 413,
          title: 'File too large',
          detail: `File size ${file.size} bytes exceeds maximum allowed size of ${storageConfig.maxFileSize} bytes.`,
        },
        { status: 413 }
      )
    }

    // 5. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 6. Extract content type or default to application/octet-stream
    const contentType = file.type || 'application/octet-stream'

    // 7. Initialize storage service
    const storageService = new StorageService(storageConfig)

    // 8. Upload file with security validation
    const uploadResult = await storageService.uploadFile({
      file: buffer,
      filename: file.name,
      contentType,
      tenantId: tenantAccess.tenantId,
      uploadedBy: user.id,
      metadata: {
        originalContentType: file.type,
        lastModified: file.lastModified,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      },
    })

    // 9. Return upload result
    if (uploadResult.success) {
      return NextResponse.json({
        success: true,
        fileId: uploadResult.fileId,
        url: uploadResult.url,
        metadata: uploadResult.metadata,
        validation: uploadResult.validation,
        scanResult: uploadResult.scanResult,
        warnings: uploadResult.warnings,
      })
    } else {
      return NextResponse.json(
        {
          code: 'UPLOAD_FAILED',
          status: 400,
          title: 'Upload failed',
          detail: 'File upload failed security validation.',
          errors: uploadResult.errors,
          warnings: uploadResult.warnings,
          validation: uploadResult.validation,
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        title: 'Internal server error',
        detail: 'An unexpected error occurred during file upload.',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication and authorization
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required to list files.',
        },
        { status: 401 }
      )
    }

    // 2. Tenant validation
    const tenantAccess = await validateTenantAccess(request)
    if (!tenantAccess) {
      return NextResponse.json(
        {
          code: 'TENANT_NOT_FOUND',
          status: 404,
          title: 'Tenant not found',
          detail: 'Tenant could not be resolved from request.',
        },
        { status: 404 }
      )
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || undefined
    const contentType = searchParams.get('contentType') || undefined

    // 4. Initialize storage service
    const storageService = new StorageService(storageConfig)

    // 5. List files
    const result = await storageService.listFiles(tenantAccess.tenantId, {
      limit,
      offset,
      search,
      contentType,
    })

    // 6. Return results
    return NextResponse.json({
      success: true,
      files: result.files,
      total: result.total,
      limit,
      offset,
    })

  } catch (error) {
    console.error('List files error:', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        title: 'Internal server error',
        detail: 'An unexpected error occurred while listing files.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication and authorization
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          code: 'UNAUTHORIZED',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required to delete files.',
        },
        { status: 401 }
      )
    }

    // 2. Tenant validation
    const tenantAccess = await validateTenantAccess(request)
    if (!tenantAccess) {
      return NextResponse.json(
        {
          code: 'TENANT_NOT_FOUND',
          status: 404,
          title: 'Tenant not found',
          detail: 'Tenant could not be resolved from request.',
        },
        { status: 404 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        {
          code: 'MISSING_FILE_ID',
          status: 400,
          title: 'Missing file ID',
          detail: 'File ID is required for deletion.',
        },
        { status: 400 }
      )
    }

    // 4. Initialize storage service
    const storageService = new StorageService(storageConfig)

    // 5. Delete file
    const result = await storageService.deleteFile(fileId, tenantAccess.tenantId)

    // 6. Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      })
    } else {
      return NextResponse.json(
        {
          code: 'DELETE_FAILED',
          status: 400,
          title: 'Delete failed',
          detail: result.error || 'Failed to delete file.',
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Delete file error:', error)

    return NextResponse.json(
      {
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        title: 'Internal server error',
        detail: 'An unexpected error occurred while deleting the file.',
      },
      { status: 500 }
    )
  }
}
