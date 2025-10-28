# Storage Provider Abstraction

## Overview

This implementation provides a clean abstraction layer for file storage operations, allowing easy switching between different storage providers (MinIO, AWS S3, Cloudinary, local filesystem, etc.) without changing business logic.

## Architecture

The storage abstraction follows the repository pattern and is inspired by the AI service abstraction already present in the codebase.

### Key Components

1. **Domain Interface** (`src/domain/interfaces/storage.interface.ts`)
   - `StorageProvider` - Base interface for all providers
   - `FileStorageProvider` - Extended interface with file operations
   - Supporting types: `UploadParams`, `UploadResult`, `FileMetadata`, etc.

2. **Provider Implementations** (`src/infrastructure/storage/`)
   - `MinIOStorageProvider` - MinIO implementation (currently available)
   - Future: S3, Cloudinary, Local filesystem providers

3. **Factory** (`src/infrastructure/storage/storage.factory.ts`)
   - `createStorageProvider()` - Creates provider based on config
   - `getStorageProvider()` - Returns singleton instance
   - `initializeStorageProvider()` - Initializes buckets/containers

## Usage

### Basic Usage

The abstraction is already integrated into existing services. No changes needed for current functionality:

```typescript
import { StorageService } from '@/application/services/storage.service'

const storageService = new StorageService()

// Upload a file
const result = await storageService.uploadFile(buffer, 'image.png', {
  bucket: 'ASSETS',
  contentType: 'image/png'
})

// Delete a file
await storageService.deleteFile('assets', 'image.png')
```

### Configuration

Set the storage provider via environment variable:

```env
# Choose provider: minio | s3 | cloudinary | local
STORAGE_PROVIDER=minio

# MinIO Configuration (current default)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

### Direct Provider Usage

You can also use providers directly:

```typescript
import { getStorageProvider } from '@/infrastructure/storage/storage.factory'

const provider = getStorageProvider()

const result = await provider.uploadFile({
  buffer: fileBuffer,
  filename: 'document.pdf',
  bucket: 'general',
  contentType: 'application/pdf',
  metadata: { userId: '123' }
})
```

## Adding a New Storage Provider

To add support for a new storage provider (e.g., AWS S3):

### Step 1: Create Provider Implementation

Create `src/infrastructure/storage/s3-storage.provider.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import type {
  FileStorageProvider,
  UploadParams,
  UploadResult,
  // ... other types
} from '@/domain/interfaces/storage.interface'

export class S3StorageProvider implements FileStorageProvider {
  public readonly name = 's3'
  private client: S3Client

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  }

  isAvailable(): boolean {
    return !!this.client
  }

  async initialize(): Promise<void> {
    // Create buckets if needed
  }

  async uploadFile(params: UploadParams): Promise<UploadResult> {
    // Implement S3 upload logic
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.filename,
      Body: params.buffer,
      ContentType: params.contentType
    })
    await this.client.send(command)
    // Return result
  }

  // Implement other required methods...
}
```

### Step 2: Update Factory

Update `src/infrastructure/storage/storage.factory.ts`:

```typescript
import { S3StorageProvider } from './s3-storage.provider'

export function createStorageProvider(): FileStorageProvider {
  const provider = env.STORAGE_PROVIDER || 'minio'

  switch (provider) {
    case 'minio':
      return new MinIOStorageProvider(/* ... */)
    
    case 's3':
      return new S3StorageProvider(
        env.AWS_REGION || 'us-east-1',
        env.AWS_ACCESS_KEY_ID!,
        env.AWS_SECRET_ACCESS_KEY!
      )
    
    // Add more providers...
    
    default:
      throw new Error(`Unsupported storage provider: ${provider}`)
  }
}
```

### Step 3: Add Environment Variables

Update `.env.example`:

```env
# AWS S3 Configuration (when STORAGE_PROVIDER=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 4: Test Your Provider

Create tests following the pattern in `upload.config.spec.ts`:

```typescript
describe('S3StorageProvider', () => {
  it('should upload files to S3', async () => {
    const provider = new S3StorageProvider(/* ... */)
    const result = await provider.uploadFile({
      buffer: Buffer.from('test'),
      filename: 'test.txt',
      bucket: 'test-bucket',
      contentType: 'text/plain'
    })
    expect(result.url).toBeDefined()
  })
})
```

## Interface Methods

All storage providers must implement:

### File Operations
- `uploadFile(params)` - Upload from buffer
- `uploadStream(params)` - Upload from stream
- `downloadFile(bucket, objectName)` - Download file
- `deleteFile(bucket, objectName)` - Delete single file
- `deleteFiles(bucket, objectNames)` - Delete multiple files

### Metadata Operations
- `getFileUrl(bucket, objectName, expiry?)` - Get file URL
- `fileExists(bucket, objectName)` - Check existence
- `getFileMetadata(bucket, objectName)` - Get metadata
- `listFiles(bucket, prefix?)` - List files

### Management Operations
- `copyFile(sourceBucket, sourceObject, destBucket, destObject)` - Copy files
- `isAvailable()` - Check provider availability
- `initialize()` - Initialize provider (create buckets, etc.)

## Migration Guide

The abstraction is **backward compatible**. Existing code continues to work without changes.

However, if you have direct references to `minioClient`, update them:

### Before
```typescript
import { minioClient, MINIO_BUCKETS } from '@/infrastructure/config/minio.config'

await minioClient.putObject(MINIO_BUCKETS.ASSETS, 'file.png', buffer)
```

### After
```typescript
import { getStorageProvider, STORAGE_BUCKETS } from '@/infrastructure/storage/storage.factory'

const provider = getStorageProvider()
await provider.uploadFile({
  buffer,
  filename: 'file.png',
  bucket: STORAGE_BUCKETS.ASSETS,
  contentType: 'image/png'
})
```

## Benefits

1. **Vendor Independence** - Switch providers without code changes
2. **Testability** - Easy to mock for unit tests
3. **Consistency** - Uniform interface for all storage operations
4. **Extensibility** - Add new providers easily
5. **Type Safety** - Full TypeScript support

## Future Enhancements

Potential providers to add:
- AWS S3 (`s3-storage.provider.ts`)
- Google Cloud Storage (`gcs-storage.provider.ts`)
- Azure Blob Storage (`azure-storage.provider.ts`)
- Cloudinary (`cloudinary-storage.provider.ts`)
- Local Filesystem (`local-storage.provider.ts`)

## Support

For questions or issues, please refer to:
- Domain interface: `src/domain/interfaces/storage.interface.ts`
- MinIO implementation: `src/infrastructure/storage/minio-storage.provider.ts`
- Factory: `src/infrastructure/storage/storage.factory.ts`
