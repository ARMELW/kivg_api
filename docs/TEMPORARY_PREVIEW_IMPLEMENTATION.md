# Temporary Preview Links Implementation

## Overview

This document describes the implementation of temporary preview links to solve the issue of slow preview availability when waiting for MinIO uploads.

## Problem Statement

Previously, when a user requested a scene preview, the system would:
1. Generate the video using whiteboard-cli
2. Upload the video to MinIO storage
3. Return the MinIO URL to the user

The MinIO upload step could take significant time (several seconds to minutes depending on file size and network conditions), causing users to wait unnecessarily before being able to view their preview.

## Solution

The new implementation provides immediate preview access by:
1. Generating the video using whiteboard-cli (as before)
2. **Immediately returning a temporary local URL** for instant preview access
3. Uploading to MinIO storage **in the background** without blocking
4. Automatically updating the preview URL to the permanent MinIO URL once upload completes

## Implementation Details

### 1. Temporary URL Generation

**File:** `src/application/services/whiteboard-cli.service.ts`

Added method to generate temporary URLs:
```typescript
generateTemporaryUrl(videoPath: string): string {
  const filename = videoPath.split('/').pop() || videoPath
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/api/v1/preview/temp/${filename}`
}
```

Modified the `execute()` method to return temporary URL instead of waiting for MinIO upload:
```typescript
// Generate temporary URL immediately for fast preview access
const tempUrl = this.generateTemporaryUrl(outputPath)

// Return temporary URL immediately
// Note: The PreviewUploadService will handle background upload to MinIO
resolve(tempUrl)
```

### 2. Temporary File Serving Endpoint

**File:** `src/infrastructure/controllers/preview.controller.ts`

Added new endpoint to serve temporary preview files:
```typescript
// GET /v1/preview/temp/:filename - Serve temporary preview file
this.controller.get('/v1/preview/temp/:filename', async (c: any) => {
  const { filename } = c.req.param()
  
  // Security: Only allow video files
  if (!filename.endsWith('.mp4')) {
    return c.json({ success: false, error: 'Invalid file type' }, 400)
  }

  // Construct the file path (videos are in /tmp directory)
  const filePath = `/tmp/${filename}`
  
  // Check if file exists
  const file = Bun.file(filePath)
  const exists = await file.exists()
  
  if (!exists) {
    return c.json({ success: false, error: 'Preview file not found' }, 404)
  }

  // Stream the video file
  return new Response(file, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600'
    }
  })
})
```

### 3. Background Upload Service

**File:** `src/application/services/preview-upload.service.ts`

Created a dedicated service to handle background uploads to MinIO:

**Key Features:**
- Queue-based upload processing
- Runs independently without blocking preview availability
- Automatic cleanup of local files after successful upload
- Updates preview URL to permanent MinIO URL after upload

**Main Methods:**
- `start()`: Starts the background upload processor
- `stop()`: Stops the background upload processor
- `queueUpload(previewId, localPath)`: Queues a preview file for background upload
- `processNextUpload()`: Processes the next upload in the queue

### 4. Integration with Preview Processor

**File:** `src/application/services/preview-processor.service.ts`

Modified to use the new upload service:

```typescript
// Initialize upload service in constructor
this.uploadService = new PreviewUploadService(previewRepository)

// Start upload service when processor starts
start(): void {
  this.uploadService.start()
  // ... rest of start logic
}

// Queue file for background upload after preview is completed
await this.previewRepository.updateStatus(previewId, 'completed', outputPath)
this.uploadService.queueUpload(previewId, outputPath)
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  1. User requests preview                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  2. Generate video with whiteboard-cli                       │
│     (stores in /tmp/video_xxx.mp4)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  3. Generate temporary URL                                   │
│     http://localhost:3000/api/v1/preview/temp/video_xxx.mp4│
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──────────────────────────────────────────────┐
                 │                                              │
┌────────────────▼──────────────────┐    ┌────────────────────▼────────┐
│  4a. Return temporary URL         │    │  4b. Queue background upload│
│      immediately to user          │    │      to PreviewUploadService│
└────────────────┬──────────────────┘    └────────────────────┬────────┘
                 │                                              │
┌────────────────▼──────────────────┐    ┌────────────────────▼────────┐
│  5. User can view preview         │    │  6. Upload to MinIO         │
│     instantly via temp URL        │    │     (non-blocking)          │
└───────────────────────────────────┘    └────────────────────┬────────┘
                                                               │
                                          ┌────────────────────▼────────┐
                                          │  7. Update preview URL      │
                                          │     to permanent MinIO URL  │
                                          └─────────────────────────────┘
```

## Benefits

1. **⚡ Immediate Preview Access**: Users can start watching their preview immediately without waiting for upload
2. **🔄 Seamless Transition**: The system automatically switches to the permanent URL once upload completes
3. **💾 Reliable Storage**: Files are eventually moved to MinIO for long-term persistence
4. **🎯 Better User Experience**: No more waiting for uploads - preview is available within seconds of generation
5. **🔒 Security**: Temporary endpoint validates file types and only serves .mp4 files

## Configuration

Required environment variable:
```env
BASE_URL=http://localhost:3000
```

This is used to construct temporary URLs. In production, set it to your actual API URL.

## Testing

Unit tests added in `src/application/services/preview-upload.service.spec.ts`:
- Queue management
- URL parsing from temporary URLs
- Service lifecycle (start/stop)

## API Changes

### Preview Status Response

The preview status endpoint now returns temporary URLs initially:

```json
{
  "success": true,
  "data": {
    "previewId": "uuid",
    "sceneId": "uuid",
    "status": "completed",
    "progress": 100,
    "previewUrl": "http://localhost:3000/api/v1/preview/temp/video_123.mp4",
    "createdAt": "2025-01-28T10:00:00Z",
    "completedAt": "2025-01-28T10:01:00Z"
  }
}
```

After background upload completes, the URL is automatically updated:

```json
{
  "success": true,
  "data": {
    "previewId": "uuid",
    "sceneId": "uuid",
    "status": "completed",
    "progress": 100,
    "previewUrl": "http://minio:9000/exports/whiteboard_456.mp4",
    "createdAt": "2025-01-28T10:00:00Z",
    "completedAt": "2025-01-28T10:01:00Z"
  }
}
```

## Monitoring

The upload service logs provide visibility into the background upload process:

```
[PREVIEW UPLOAD] 🚀 Starting background upload processor...
[PREVIEW UPLOAD] 📥 Queued upload for preview abc-123: /tmp/video_xxx.mp4
[PREVIEW UPLOAD] ⬆️ Uploading preview abc-123 from /tmp/video_xxx.mp4...
[PREVIEW UPLOAD] ✅ Successfully uploaded preview abc-123 to MinIO: http://minio:9000/exports/whiteboard_456.mp4
[PREVIEW UPLOAD] 🗑️ Cleaned up local file: /tmp/video_xxx.mp4
```

## Future Improvements

1. **Configurable retention**: Make temporary file retention period configurable
2. **Progress tracking**: Add upload progress tracking for the background upload
3. **Retry mechanism**: Implement retry logic for failed uploads
4. **Cleanup scheduler**: Add automatic cleanup of orphaned temporary files
5. **CDN integration**: Consider using CDN for even faster preview delivery

## Related Files

- `src/application/services/whiteboard-cli.service.ts`
- `src/application/services/preview-processor.service.ts`
- `src/application/services/preview-upload.service.ts`
- `src/application/services/preview-upload.service.spec.ts`
- `src/infrastructure/controllers/preview.controller.ts`
- `docs/PREVIEW_STRATEGY.md`

## Author

**Implementation Date:** 2025-11-02  
**Issue:** lien temporairey - pour la previsualisation de scene
