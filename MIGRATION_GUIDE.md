# Backend Integration Migration Guide

## Overview

This migration adds missing backend fields to synchronize with frontend evolution, as documented in `/docs/integration`.

## Migration Steps

### 1. Schema Migration (SQL)

Apply the database schema migration:

```bash
# Generate migration (if needed)
npm run db:generate

# Apply migration
npm run db:migrate
```

The migration adds these new columns to the `scenes` table:
- `scene_width` (integer, default: 1920)
- `scene_height` (integer, default: 1080)
- `background_color` (text)
- `background` (jsonb)
- `transition` (jsonb)
- `wait_duration_before_next_scene` (real, default: 2.0)
- `eraser_config` (jsonb)
- `occlusion_culling` (boolean, default: false)
- `occlusion_culling_config` (jsonb)

### 2. Data Migration (TypeScript)

Run the data migration to ensure all layers have `camera_position`:

```bash
npx tsx drizzle/migrate-layer-camera-position.ts
```

This script:
- Scans all existing scenes
- For each layer that has `position` but no `camera_position`
- Copies `position` to `camera_position`
- Updates the scene with the migrated layers

### 3. Verification

After migration, verify the changes:

```sql
-- Check that new columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'scenes' 
AND column_name IN (
  'scene_width', 'scene_height', 'background', 'background_color',
  'transition', 'wait_duration_before_next_scene', 'eraser_config',
  'occlusion_culling', 'occlusion_culling_config'
);

-- Check that all layers have camera_position
SELECT id, title, 
  (SELECT COUNT(*) FROM jsonb_array_elements(layers) AS layer 
   WHERE NOT (layer ? 'camera_position')) as layers_without_camera_pos
FROM scenes
WHERE jsonb_array_length(layers) > 0
HAVING COUNT(*) > 0;
-- Should return 0 rows
```

## New Features

### Scene-Level Features

1. **Custom Scene Dimensions**
   ```json
   {
     "sceneWidth": 1920,
     "sceneHeight": 1080
   }
   ```

2. **Advanced Background Configuration**
   ```json
   {
     "background": {
       "color": "#ffffff",
       "grid": {
         "type": "dots",
         "size": 20,
         "color": "#cccccc",
         "opacity": 0.5
       }
     }
   }
   ```

3. **New Transition System**
   ```json
   {
     "transition": {
       "type": "fade",
       "duration": 0.5,
       "after_slide": 2.0,
       "easing": "ease-in-out"
     },
     "waitDurationBeforeNextScene": 2.0
   }
   ```

4. **Eraser Configuration**
   ```json
   {
     "eraserConfig": {
       "enabled": true,
       "pattern": "diagonal",
       "duration": 2.0,
       "radius": 40
     }
   }
   ```

5. **Occlusion Culling**
   ```json
   {
     "occlusionCulling": true,
     "occlusionCullingConfig": {
       "autoOnly": true
     }
   }
   ```

### Layer-Level Features

All layers now support:

1. **Transform Properties**: `rotation`, `flipX`, `flipY`, `scaleX`, `scaleY`
2. **Visibility**: `visible` boolean
3. **Animations**: `entrance_animation`, `exit_animation`
4. **Audio**: `audio_config` with narration, sound effects, typewriter, drawing sounds
5. **Text Enhancements**: `text_config`, `text_animation_mode`
6. **Shape Enhancements**: `shape_config`, `shape_drawing_config`
7. **Drawing Animation**: `drawing_animation_config`, `hand_overlay_config`
8. **Advanced Features**: `morphing_config`, `occlusionMode`, `occlusionErase`
9. **Timing**: `timingConfig` for transition, pause, and draw times
10. **Caching**: `cachedImage` for performance optimization

## API Changes

### Backward Compatibility

All old fields continue to work:
- `transitionType` → replaced by `transition.type` but still accepted
- `slideDuration` → replaced by `transition.duration` but still accepted
- `syncSlideWithVoice` → still supported

### New Endpoints Behavior

**POST /v1/scenes** and **PUT /v1/scenes/:id** now accept all new fields.

Example request:
```json
{
  "title": "My Scene",
  "sceneWidth": 1920,
  "sceneHeight": 1080,
  "background": {
    "color": "#ffffff",
    "grid": {
      "type": "dots",
      "size": 20
    }
  },
  "transition": {
    "type": "fade",
    "duration": 0.5,
    "after_slide": 2.0
  },
  "layers": [
    {
      "id": "layer-1",
      "name": "Text Layer",
      "type": "text",
      "mode": "draw",
      "position": { "x": 960, "y": 540 },
      "camera_position": { "x": 960, "y": 540 },
      "width": 300,
      "height": 80,
      "rotation": 0,
      "entrance_animation": {
        "type": "fade",
        "duration": 0.8
      }
    }
  ]
}
```

## Automatic Features

### camera_position Auto-Sync

The repository automatically ensures all layers have `camera_position`:
- In **create**: Adds `camera_position` if missing
- In **update**: Adds `camera_position` if missing
- In **duplicate**: Preserves all fields including `camera_position`

This happens transparently - no special handling needed in the API layer.

## Testing

Run existing tests to verify backward compatibility:

```bash
npm run test
```

All existing scenes should continue to work without modification.

## Rollback

If needed, rollback the schema migration:

```sql
ALTER TABLE scenes DROP COLUMN IF EXISTS scene_width;
ALTER TABLE scenes DROP COLUMN IF EXISTS scene_height;
ALTER TABLE scenes DROP COLUMN IF EXISTS background_color;
ALTER TABLE scenes DROP COLUMN IF EXISTS background;
ALTER TABLE scenes DROP COLUMN IF EXISTS transition;
ALTER TABLE scenes DROP COLUMN IF EXISTS wait_duration_before_next_scene;
ALTER TABLE scenes DROP COLUMN IF EXISTS eraser_config;
ALTER TABLE scenes DROP COLUMN IF EXISTS occlusion_culling;
ALTER TABLE scenes DROP COLUMN IF EXISTS occlusion_culling_config;
```

Note: This will not remove `camera_position` from layers as it's stored in the JSONB `layers` column.

## Documentation

See `/docs/integration` for complete frontend integration documentation:
- `BACKEND_INTEGRATION_SCENE_UPDATES.md` - Complete guide
- `BACKEND_LAYER_CAMERA_POSITION.md` - Camera position details
- `BACKEND_LAYER_DIMENSIONS_CORRECTION.md` - Width/height details
- `BACKEND_PROJECTION_INTEGRATION.md` - Projection system
- `BACKEND_QUICKSTART.md` - Quick start guide
