# Preview Strategy Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Preview Options](#preview-options)
5. [Queue Management](#queue-management)
6. [Caching Strategy](#caching-strategy)
7. [Whiteboard CLI Integration](#whiteboard-cli-integration)
8. [Cleanup & Resource Management](#cleanup--resource-management)
9. [Rate Limiting](#rate-limiting)
10. [Usage Examples](#usage-examples)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Doodlio preview system enables users to generate video previews of their whiteboard scenes at any time during the editing process. The system is designed to handle multiple concurrent requests efficiently while maintaining resource constraints.

### Key Features

✅ **On-demand generation** - Generate previews at any time  
✅ **Quality options** - Draft (fast), Standard, and High quality  
✅ **Queue management** - Intelligent job queue with priorities  
✅ **Caching** - Reuse existing previews when possible  
✅ **Real-time progress** - Track generation progress via polling  
✅ **Automatic cleanup** - Remove old/expired previews automatically  
✅ **Rate limiting** - Prevent abuse with per-user limits  

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│              Preview Controller                      │
│  - Handles HTTP requests                            │
│  - Validates user permissions                       │
│  - Orchestrates use cases                          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Use Cases Layer                         │
│  - CreatePreviewUseCase                             │
│  - GetPreviewStatusUseCase                          │
│  - CancelPreviewUseCase                             │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Services Layer                          │
│  - PreviewQueueService (queue management)           │
│  - PreviewCacheService (cache detection)            │
│  - PreviewGenerationService (video generation)      │
│  - WhiteboardCliService (CLI integration)           │
│  - PreviewCleanupService (cleanup)                  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Repository Layer                        │
│  - PreviewRepository (database operations)          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Database & Storage                      │
│  - PostgreSQL (preview metadata)                    │
│  - MinIO/S3 (video files)                          │
└─────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Create Preview

```http
POST /api/v1/preview/scene
Authorization: Bearer <token>
Content-Type: application/json

{
  "sceneId": "uuid",
  "options": {
    "quality": "draft" | "standard" | "high",
    "aspectRatio": "16:9" | "1:1" | "9:16",
    "skipAudio": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previewId": "uuid",
    "sceneId": "uuid",
    "status": "queued",
    "progress": 0,
    "queuePosition": 2,
    "cached": false,
    "createdAt": "2025-01-28T10:00:00Z"
  }
}
```

### 2. Get Preview Status

```http
GET /api/v1/preview/status/:previewId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previewId": "uuid",
    "sceneId": "uuid",
    "status": "processing",
    "progress": 45,
    "currentStep": "Rendering video: 45%",
    "previewUrl": null,
    "error": null,
    "createdAt": "2025-01-28T10:00:00Z",
    "completedAt": null
  }
}
```

### 3. Cancel Preview

```http
POST /api/v1/preview/cancel/:previewId
Authorization: Bearer <token>
```

### 4. List Previews

```http
GET /api/v1/preview/list?status=completed&page=1&limit=20
Authorization: Bearer <token>
```

### 5. Delete Preview

```http
DELETE /api/v1/preview/:previewId
Authorization: Bearer <token>
```

---

## Preview Options

### Quality Levels

| Quality | Resolution | CRF | Generation Time | File Size | Use Case |
|---------|-----------|-----|-----------------|-----------|----------|
| **draft** | 480p | 28 | ~5-10s | Small | Quick iterations |
| **standard** | 720p | 23 | ~30-60s | Medium | Regular previews |
| **high** | 1080p | 18 | ~2-5min | Large | Final review |

### Aspect Ratios

- **16:9** - Standard widescreen (YouTube, presentations)
- **1:1** - Square (Instagram posts)
- **9:16** - Vertical (Instagram Stories, TikTok)

---

## Queue Management

### Queue Limits

```typescript
const PREVIEW_LIMITS = {
  maxConcurrentPreviews: 3,    // Max active per user
  maxQueuedPreviews: 10,       // Max queued per user
  maxGlobalConcurrent: 50,     // Global limit
  maxPreviewsPerHour: 20,      // Per user/hour
  maxPreviewsPerDay: 100       // Per user/day
}
```

---

## Caching Strategy

### Scene Hash

Each scene's content is hashed using SHA-256 to detect duplicate preview requests.

---

## Whiteboard CLI Integration

### Prerequisites

Install [whiteboard-it](https://github.com/armelgeek/whiteboard-it):

```bash
pip install whiteboard-it
```

### Configuration

Set environment variables:

```env
PYTHON_PATH=/usr/bin/python3
WHITEBOARD_CLI_PATH=/opt/whiteboard-it/whiteboard_animator.py
BASE_URL=http://localhost:3000
```

### Temporary Preview URLs

To improve preview availability speed, the system now uses temporary URLs:

1. **Video Generation**: When the whiteboard CLI completes rendering, the video file is stored locally in `/tmp`
2. **Immediate Access**: A temporary URL (`/api/v1/preview/temp/:filename`) is returned immediately for instant preview access
3. **Background Upload**: The video is queued for background upload to MinIO storage
4. **Permanent URL**: Once uploaded to MinIO, the preview URL is automatically updated to the permanent storage URL

This approach provides:
- ⚡ **Faster preview availability** - No waiting for MinIO upload
- 🔄 **Seamless transition** - Automatic switch to permanent URL
- 💾 **Reliable storage** - Files eventually moved to MinIO for persistence

---

## Cleanup & Resource Management

The `PreviewCleanupScheduler` runs hourly to delete:

1. Draft previews > 1 day old
2. Standard previews > 7 days old
3. High previews > 30 days old
4. Failed previews > 3 days old
5. Cancelled previews > 1 day old

---

## Rate Limiting

- **Concurrent previews:** 3 active at once per user
- **Queued previews:** 10 in queue per user
- **Hourly limit:** 20 previews/hour per user
- **Daily limit:** 100 previews/day per user
- **Global limit:** 50 concurrent across all users

---

## Usage Examples

### Frontend Integration

```typescript
// React Hook Example
function usePreview(sceneId: string) {
  const [state, setState] = useState({
    previewUrl: null,
    progress: 0,
    status: 'idle',
    isGenerating: false
  })

  const generatePreview = async (options = {}) => {
    setState(s => ({ ...s, isGenerating: true }))

    const response = await fetch('/api/v1/preview/scene', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sceneId, options })
    })

    const { data } = await response.json()

    // Start polling for status updates
    await pollStatus(data.previewId)
  }

  return { ...state, generatePreview }
}
```

---

## Troubleshooting

### Common Issues

1. **"Whiteboard CLI is not available"**
   - Install whiteboard-it: `pip install whiteboard-it`
   - Verify path in environment variables

2. **Preview stuck in "processing"**
   - Check if whiteboard CLI is running
   - Verify server logs for errors

3. **Rate limit exceeded**
   - Wait for rate limit window to reset
   - Cancel unnecessary previews

---

## Best Practices

✅ Use **draft** quality for quick iterations  
✅ Use **standard** for regular previews  
✅ Use **high** only for final review  
✅ Cancel previews you no longer need  
✅ Implement proper error handling in frontend  

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-28  
**Author:** Doodlio Team
