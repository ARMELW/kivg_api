# Preview URL Generation Fix - Testing Guide

## Problem Summary
When creating a preview scene via `POST /v1/preview/scene`, the preview would get stuck at "enqueue" status and never progress to processing or completion stages, preventing the generation of the preview URL.

## Root Cause
The `PreviewController` and `PreviewProcessorService` were using different instances of `PreviewQueueService`. When a preview was created:
1. Controller would add the job to **its queue instance**
2. Processor would check **a different queue instance** (which was always empty)
3. The job would remain in the controller's queue forever, never being processed

## Solution
Converted `PreviewQueueService` to a **singleton pattern** ensuring both the controller and processor share the same queue instance.

## Changes Made

### Core Fix
1. **PreviewQueueService** - Added singleton pattern with `getInstance()` method
2. **App.ts** - Uses `PreviewQueueService.getInstance()` for processor
3. **PreviewController** - Uses `PreviewQueueService.getInstance()` for use cases

### Additional Fixes
1. Added missing `RateLimitCheck` interface
2. Fixed `findCachedPreview()` method signature
3. Added `CANCEL_PREVIEW` activity type
4. Fixed bucket name in `preview-generation.service.ts` (previews → EXPORTS)

### Tests Added
- `preview-queue.service.spec.ts` - 13 unit tests
- `preview-queue.service.integration.spec.ts` - 4 integration tests
- **All 17 tests passing** ✅

## How to Test

### Prerequisites
```bash
# Start the API server
bun run dev

# Ensure database is running and migrations are applied
bun run db:migrate
```

### Test Scenario 1: Create Preview
```bash
# Create a preview (replace {sceneId} and {token} with actual values)
curl -X POST http://localhost:3000/api/v1/preview/scene \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "{sceneId}",
    "options": {
      "quality": "standard",
      "aspectRatio": "16:9",
      "skipAudio": false
    }
  }'

# Expected response:
{
  "success": true,
  "data": {
    "previewId": "uuid",
    "sceneId": "uuid",
    "status": "queued",
    "progress": 0,
    "queuePosition": 0,
    "createdAt": "2024-..."
  }
}
```

### Test Scenario 2: Check Status Progression
```bash
# Poll the status endpoint to see progression
curl -X GET http://localhost:3000/api/v1/preview/status/{previewId} \
  -H "Authorization: Bearer {token}"

# Expected progression:
# 1. status: "queued", progress: 0
# 2. status: "processing", progress: 10-90, currentStep: "Loading scene..." / "Generating video..." etc.
# 3. status: "completed", progress: 100, previewUrl: "https://..."
```

### Test Scenario 3: Verify Shared Queue (Developer Only)
```typescript
// In browser console or test environment
// This verifies the singleton works correctly

// Get queue service in controller
const queueService1 = PreviewQueueService.getInstance()
const stats1 = queueService1.getQueueStats()

// Get queue service in processor (same instance)
const queueService2 = PreviewQueueService.getInstance()
const stats2 = queueService2.getQueueStats()

// Both should show the same queue state
console.log(stats1 === stats2) // Should be true
```

### Test Scenario 4: List Previews
```bash
# List all previews
curl -X GET http://localhost:3000/api/v1/preview/list \
  -H "Authorization: Bearer {token}"

# List only completed previews
curl -X GET "http://localhost:3000/api/v1/preview/list?status=completed" \
  -H "Authorization: Bearer {token}"
```

### Test Scenario 5: Cancel Preview
```bash
# Cancel a queued or processing preview
curl -X POST http://localhost:3000/api/v1/preview/cancel/{previewId} \
  -H "Authorization: Bearer {token}"

# Expected response:
{
  "success": true,
  "data": {
    "previewId": "uuid",
    "status": "cancelled"
  }
}
```

## Expected Behavior After Fix

### Status Flow
1. **queued** (0%) - Job is in queue waiting to be processed
2. **processing** (10%) - "Loading scene..."
3. **processing** (20%) - "Generating config..."
4. **processing** (30-90%) - "Rendering video..." (with percentage updates)
5. **completed** (100%) - Preview URL available

### Timing
- Preview processor checks queue every **2 seconds**
- A job should move from "queued" to "processing" within **2-4 seconds**
- Total processing time depends on:
  - Scene complexity
  - Quality setting (draft/standard/high)
  - Server resources

### Console Logs to Watch
```
[APP] ✅ Preview processor started
[PREVIEW QUEUE] 📥 Job enqueued: {previewId} (scene: {sceneId}, position: 0, total in queue: 1)
[PREVIEW PROCESSOR] 🔄 Checking queue for jobs...
[PREVIEW PROCESSOR] ▶️  Processing job: {previewId}
[PREVIEW PROCESSOR] 📝 Updating status to 'processing': {previewId}
[PREVIEW PROCESSOR] 📊 Progress: 30% - Rendering video...
[PREVIEW PROCESSOR] 🎉 Video rendering complete: /path/to/video.mp4
[PREVIEW PROCESSOR] ✅ Preview {previewId} generated successfully!
[PREVIEW QUEUE] ✅ Job marked as complete: {previewId}
```

## Troubleshooting

### Issue: Preview stays at "queued"
**Before Fix**: This was the bug - queue not shared
**After Fix**: Should not happen. If it does:
1. Check if PreviewProcessorService is running (look for "[APP] ✅ Preview processor started")
2. Check processor logs for errors
3. Verify WhiteboardCliService is available

### Issue: Preview fails with error
Check the error message in the preview status:
```bash
curl -X GET http://localhost:3000/api/v1/preview/status/{previewId} \
  -H "Authorization: Bearer {token}"
```

Common errors:
- "Scene not found" - Invalid sceneId
- "Whiteboard CLI is not available" - WhiteboardCliService not configured
- Rate limit errors - Too many concurrent previews

### Issue: Rate limited
Rate limits (per user):
- Max concurrent previews: 3
- Max queued previews: 10
- Max previews per hour: 20
- Max previews per day: 100

## Running Tests

```bash
# Run all preview tests
bun test preview

# Run specific test files
bun test preview-queue.service.spec.ts
bun test preview-queue.service.integration.spec.ts

# Expected output:
# ✓ PreviewQueueService > Singleton Pattern > ... (3 tests)
# ✓ PreviewQueueService > Queue Operations > ... (6 tests)
# ✓ PreviewQueueService > Processing State > ... (2 tests)
# ✓ PreviewQueueService > Rate Limiting > ... (2 tests)
# ✓ PreviewQueueService Integration > ... (4 tests)
# 17 pass, 0 fail
```

## Architecture Diagram

```
┌─────────────────────┐
│   User Request      │
│ POST /v1/preview/   │
│      scene          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PreviewController   │
│  • Validates input  │
│  • Creates preview  │
│  • Enqueues job     │
└──────────┬──────────┘
           │
           │ Adds job to
           ▼
┌─────────────────────┐◄──────────────┐
│ PreviewQueueService │               │
│    (SINGLETON)      │               │
│  • Manages queue    │               │
│  • Rate limiting    │               │
│  • Job tracking     │               │
└──────────┬──────────┘               │
           │                          │
           │ Gets next job            │
           ▼                          │
┌─────────────────────┐               │
│PreviewProcessor     │               │
│  Service            │               │
│  • Runs every 2s    │               │
│  • Processes jobs   │───────────────┘
│  • Updates status   │    Marks complete
└─────────────────────┘
```

## Files Changed

### Core Changes
- `src/application/services/preview-queue.service.ts` - Added singleton pattern
- `src/app.ts` - Use singleton instance
- `src/infrastructure/controllers/preview.controller.ts` - Use singleton instance

### Supporting Changes
- `src/application/services/preview-cache.service.ts` - Fixed method signature
- `src/application/use-cases/preview/cancel-preview.use-case.ts` - Fixed return type
- `src/infrastructure/config/activity.config.ts` - Added CANCEL_PREVIEW
- `src/application/services/preview-generation.service.ts` - Fixed bucket name

### New Test Files
- `src/application/services/preview-queue.service.spec.ts`
- `src/application/services/preview-queue.service.integration.spec.ts`

## Performance Considerations

### Queue Processing
- Processor runs every 2 seconds
- Can process up to 50 concurrent previews globally
- Each user can have max 3 concurrent previews

### Memory Usage
- Queue is in-memory (will be lost on restart)
- Consider implementing persistent queue (Redis) for production
- Preview files should be stored in object storage (MinIO/S3)

## Future Enhancements

1. **Persistent Queue**: Store queue in Redis to survive restarts
2. **Queue Priorities**: Higher priority for premium users
3. **Progress Websockets**: Real-time progress updates via WebSocket
4. **Distributed Processing**: Multiple processor instances for scalability
5. **Cache Implementation**: Complete the scene hash caching system

## Success Criteria

✅ Preview progresses from queued → processing → completed
✅ Preview URL is generated and accessible
✅ Multiple previews can be queued and processed
✅ Rate limiting works correctly
✅ All tests passing
✅ No errors in processor logs
