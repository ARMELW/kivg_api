# Next Phase Implementation - Redis, MinIO, and Repository Layer

This document describes the implementation of caching, storage, rate limiting, image processing, and the complete repository layer with Drizzle ORM.

## Table of Contents

- [Overview](#overview)
- [Repository Layer](#repository-layer)
- [Caching with Redis](#caching-with-redis)
- [Storage with MinIO](#storage-with-minio)
- [Image Processing with Sharp](#image-processing-with-sharp)
- [Rate Limiting](#rate-limiting)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)

## Overview

This implementation adds the following critical features to the Doodlio API:

1. **Repository Layer**: Complete Drizzle ORM implementations for all entities
2. **Redis Caching**: Performance optimization with intelligent caching
3. **MinIO Storage**: S3-compatible object storage for files
4. **Image Processing**: Sharp-based image optimization and manipulation
5. **Rate Limiting**: Redis-backed request throttling

## Repository Layer

All repository implementations follow the repository pattern with full Drizzle ORM integration.

### Implemented Repositories

#### AssetRepository
Full CRUD operations with advanced features:
- Filtering by category, tags, and search text
- Pagination support
- Usage statistics and tracking
- Automatic usage count incrementing

```typescript
import { AssetRepository } from '@/infrastructure/repositories/asset.repository'

const assetRepo = new AssetRepository()

// Create asset
const asset = await assetRepo.create({
  userId: 'user-123',
  name: 'Hero Image',
  url: '/uploads/assets/hero.jpg',
  type: 'image/jpeg',
  size: 1024000,
  category: 'illustration',
  tags: ['hero', 'banner']
})

// Find with filters
const { assets, total } = await assetRepo.findAll({
  userId: 'user-123',
  category: 'illustration',
  tags: ['hero'],
  skip: 0,
  limit: 20
})

// Get statistics
const stats = await assetRepo.getStats('user-123')
// Returns: { totalAssets, totalSize, assetsByCategory }
```

#### AudioRepository
Audio file management with metadata:
- Category-based organization
- Favorites system
- Trim and fade configuration
- Statistics tracking

#### ChannelRepository
Channel management with branding:
- Brand kit configuration
- Project count tracking
- Video export counting
- Archive functionality
- Channel statistics

#### ProjectRepository
Project lifecycle management:
- Soft delete support
- Project duplication
- Search and filtering
- Status tracking (draft, in_progress, completed)
- Duration calculation

#### SceneRepository
Scene composition and ordering:
- Scene reordering support
- Scene duplication
- Layer and camera management
- Duration tracking
- Project-based filtering

#### ExportRepository
Export job tracking:
- Progress monitoring
- Status updates
- Video URL management
- Export statistics
- User export history

#### TemplateRepository
Template management system:
- Popularity tracking
- Rating system
- Advanced filtering (type, style, tags)
- Template versioning

## Caching with Redis

### CacheService

A comprehensive caching service with multiple strategies:

```typescript
import { CacheService, CacheKeys, CACHE_TTL } from '@/application/services/cache.service'

const cache = new CacheService()

// Simple get/set
await cache.set('key', { data: 'value' }, CACHE_TTL.MEDIUM)
const value = await cache.get('key')

// Get or set with factory
const data = await cache.getOrSet(
  CacheKeys.asset('123'),
  async () => await assetRepo.findById('123'),
  CACHE_TTL.LONG
)

// Increment counter
await cache.increment(CacheKeys.rateLimit('user-123', '/api/upload'), 3600)

// Delete pattern
await cache.deletePattern('assets:user-123:*')
```

### Cache Keys

Predefined cache key generators for consistency:

```typescript
CacheKeys.asset(id)                    // 'asset:123'
CacheKeys.assets(userId, params)       // 'assets:user-123:category=icon'
CacheKeys.assetStats(userId)           // 'asset:stats:user-123'
CacheKeys.channel(id)                  // 'channel:456'
CacheKeys.project(id)                  // 'project:789'
CacheKeys.rateLimit(id, endpoint)      // 'ratelimit:user-123:/api/upload'
```

### Cache TTL Constants

```typescript
CACHE_TTL.SHORT      // 60 seconds
CACHE_TTL.MEDIUM     // 300 seconds (5 minutes)
CACHE_TTL.LONG       // 1800 seconds (30 minutes)
CACHE_TTL.VERY_LONG  // 3600 seconds (1 hour)
```

## Storage with MinIO

### StorageService

S3-compatible object storage for all file types:

```typescript
import { StorageService } from '@/application/services/storage.service'
import { MINIO_BUCKETS } from '@/infrastructure/config/minio.config'

const storage = new StorageService()

// Upload file
const result = await storage.uploadFile(
  buffer,
  'image.jpg',
  {
    bucket: 'ASSETS',
    contentType: 'image/jpeg',
    metadata: { userId: 'user-123' }
  }
)
// Returns: { id, url, bucket, size }

// Download file
const buffer = await storage.downloadFile('assets', 'abc123.jpg')

// Get presigned URL
const url = await storage.getFileUrl('assets', 'abc123.jpg', 3600)

// Delete file
await storage.deleteFile('assets', 'abc123.jpg')
```

### MinIO Buckets

Organized storage with predefined buckets:

```typescript
MINIO_BUCKETS.ASSETS      // Image assets
MINIO_BUCKETS.AUDIO       // Audio files
MINIO_BUCKETS.EXPORTS     // Video exports (public)
MINIO_BUCKETS.THUMBNAILS  // Thumbnails
```

### Bucket Initialization

Buckets are automatically created on startup:

```typescript
import { initializeMinIOBuckets } from '@/infrastructure/config/minio.config'

// In your server startup
await initializeMinIOBuckets()
```

## Image Processing with Sharp

### ImageProcessingService

Advanced image manipulation and optimization:

```typescript
import { ImageProcessingService } from '@/application/services/image-processing.service'

const imageService = new ImageProcessingService()

// Process and optimize
const processed = await imageService.processImage(buffer, {
  width: 1920,
  height: 1080,
  fit: 'cover',
  format: 'webp',
  quality: 80
})

// Generate thumbnail
const thumbnail = await imageService.generateThumbnail(buffer, {
  width: 300,
  height: 200,
  format: 'webp',
  quality: 70
})

// Extract metadata
const metadata = await imageService.getMetadata(buffer)
// Returns: { width, height, format, size, hasAlpha, colorSpace }

// Compress to target size
const compressed = await imageService.compressImage(buffer, 100, 2048)
// Compress to ~100KB

// Create responsive sizes
const sizes = await imageService.createResponsiveSizes(buffer, [320, 640, 1024, 1920])
// Returns Map<number, Buffer>
```

### Features

- **Format Conversion**: JPEG, PNG, WebP, AVIF
- **Optimization**: MozJPEG, PNG compression level 9
- **Responsive Images**: Multiple sizes generation
- **Validation**: Image buffer validation
- **Metadata**: Complete image information extraction
- **Thumbnails**: Smart cropping and resizing

## Rate Limiting

### Rate Limiting Middleware

Redis-backed rate limiting for API protection:

```typescript
import { rateLimitMiddleware, RateLimits } from '@/infrastructure/middlewares/rate-limit.middleware'

// Apply to routes
app.use('/api/upload/*', rateLimitMiddleware(RateLimits.UPLOAD))
app.use('/api/export/*', rateLimitMiddleware(RateLimits.EXPORT))
app.use('/api/auth/*', rateLimitMiddleware(RateLimits.AUTH))

// Custom rate limit
app.use('/api/custom', rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 50,
  message: 'Custom rate limit exceeded'
}))
```

### Predefined Rate Limits

```typescript
RateLimits.STRICT     // 5 requests per 15 minutes
RateLimits.MODERATE   // 100 requests per 15 minutes
RateLimits.LENIENT    // 1000 requests per 15 minutes
RateLimits.UPLOAD     // 50 per hour
RateLimits.EXPORT     // 20 per hour
RateLimits.AUTH       // 5 per 15 minutes (skip successful)
```

### Features

- **Redis-backed**: Distributed rate limiting
- **User tracking**: By user ID or IP address
- **Flexible windows**: Configurable time windows
- **Skip options**: Skip successful or failed requests
- **Retry headers**: Returns retry-after information

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

### Setup

1. **Install Redis**:
```bash
docker run -d -p 6379:6379 redis:alpine
```

2. **Install MinIO**:
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

3. **Initialize**:
```typescript
import { redis } from '@/infrastructure/config/redis.config'
import { initializeMinIOBuckets } from '@/infrastructure/config/minio.config'

// Connect Redis
await redis.connect()

// Initialize MinIO buckets
await initializeMinIOBuckets()
```

## Usage Examples

### Complete Asset Upload Flow

```typescript
import { AssetRepository } from '@/infrastructure/repositories/asset.repository'
import { StorageService } from '@/application/services/storage.service'
import { ImageProcessingService } from '@/application/services/image-processing.service'
import { CacheService, CacheKeys, CACHE_TTL } from '@/application/services/cache.service'

const assetRepo = new AssetRepository()
const storage = new StorageService()
const imageService = new ImageProcessingService()
const cache = new CacheService()

// Upload and process
async function uploadAsset(file: File, userId: string) {
  // Validate
  const buffer = await file.arrayBuffer()
  const isValid = await imageService.validateImage(Buffer.from(buffer))
  if (!isValid) throw new Error('Invalid image')
  
  // Get metadata
  const metadata = await imageService.getMetadata(Buffer.from(buffer))
  
  // Process and optimize
  const processed = await imageService.processImage(Buffer.from(buffer), {
    width: 2048,
    format: 'webp',
    quality: 85
  })
  
  // Generate thumbnail
  const thumbnail = await imageService.generateThumbnail(Buffer.from(buffer), {
    width: 300,
    height: 300,
    format: 'webp'
  })
  
  // Upload to MinIO
  const [mainUpload, thumbUpload] = await Promise.all([
    storage.uploadFile(processed, file.name, {
      bucket: 'ASSETS',
      contentType: 'image/webp'
    }),
    storage.uploadFile(thumbnail, `thumb-${file.name}`, {
      bucket: 'THUMBNAILS',
      contentType: 'image/webp'
    })
  ])
  
  // Save to database
  const asset = await assetRepo.create({
    userId,
    name: file.name,
    url: mainUpload.url,
    thumbnailUrl: thumbUpload.url,
    type: 'image/webp',
    size: mainUpload.size,
    width: metadata.width,
    height: metadata.height,
    category: 'illustration',
    tags: [],
    metadata: {
      format: metadata.format,
      hasAlpha: metadata.hasAlpha
    }
  })
  
  // Cache the result
  await cache.set(CacheKeys.asset(asset.id), asset, CACHE_TTL.LONG)
  
  // Invalidate list cache
  await cache.deletePattern(`assets:${userId}:*`)
  
  return asset
}
```

### Cached Data Retrieval

```typescript
async function getAssetWithCache(id: string) {
  return await cache.getOrSet(
    CacheKeys.asset(id),
    async () => {
      const asset = await assetRepo.findById(id)
      if (!asset) throw new Error('Asset not found')
      return asset
    },
    CACHE_TTL.LONG
  )
}

async function getAssetsWithCache(userId: string, params: any) {
  const cacheKey = CacheKeys.assets(userId, JSON.stringify(params))
  
  return await cache.getOrSet(
    cacheKey,
    async () => await assetRepo.findAll({ userId, ...params }),
    CACHE_TTL.MEDIUM
  )
}
```

## Testing

Run the tests:

```bash
npm test
```

Test files included:
- `cache.service.spec.ts` - Cache service tests
- `image-processing.service.spec.ts` - Image processing tests
- `asset.repository.spec.ts` - Repository structure tests

## Performance Considerations

1. **Caching Strategy**:
   - Short TTL for frequently changing data
   - Long TTL for static content
   - Invalidate on updates

2. **Image Processing**:
   - Process images asynchronously when possible
   - Use responsive sizes for different devices
   - Cache processed images

3. **Rate Limiting**:
   - Adjust limits based on user tiers
   - Use stricter limits for expensive operations
   - Monitor rate limit hits

4. **Storage**:
   - Use appropriate bucket for content type
   - Set lifecycle policies for temporary files
   - Consider CDN for public assets

## Next Steps

1. Update controllers to use repositories
2. Add caching to frequently accessed endpoints
3. Integrate image processing in upload flows
4. Apply rate limiting to all public endpoints
5. Add monitoring and metrics
6. Implement cleanup jobs for old exports
7. Add tests for integration scenarios

## License

MIT
