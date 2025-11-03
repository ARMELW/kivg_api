# Animation API Documentation

## Overview

The Animation API provides a comprehensive whiteboard animation system that allows you to create professional animated videos using a simple JSON configuration. This API integrates with the whiteboard-cli Python engine to generate high-quality animations with various effects, transitions, and layer types.

## Architecture

```
Client (JSON Config) → Animation API → Whiteboard CLI → MinIO Storage → Video URL
```

## Base URL

- Development: `http://localhost:3000/api/v1/animations`
- Production: `https://your-domain.com/api/v1/animations`

## Authentication

Most endpoints require authentication using Bearer token:

```
Authorization: Bearer <your-token>
```

## API Endpoints

### 1. Get Supported Animation Types

Get all supported entrance animations, transitions, and layer modes.

**Endpoint:** `GET /v1/animations/types`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "entranceAnimations": [
      "fade_in", "fadewhite", "fadeblack", "pop", "appear",
      "slide_in_left", "slide_in_right", "slide_in_top", "slide_in_bottom",
      "smoothleft", "smoothright", "smoothup", "smoothdown",
      "zoom_in", "distance", "reveal",
      "wipeleft", "wiperight", "wipeup", "wipedown",
      "circleopen", "circlecrop", "circleclose", "rectcrop",
      "push_from_left", "push_from_right", "push_from_top", "push_from_bottom"
    ],
    "transitions": [
      "fade", "fade_to_black", "fade_to_white",
      "push_left", "push_right", "push_up", "push_down",
      "wipe", "wipe_left", "wipe_right", "wipe_up", "wipe_down",
      "iris", "zoom_out_in", "zoom", "reveal", "slide", "pan"
    ],
    "layerModes": [
      "draw", "erase", "flood_fill", "coloriage", 
      "path_follow", "path_follow_then_color", "static"
    ]
  }
}
```

### 2. Validate Animation Configuration

Validate an animation configuration without generating video.

**Endpoint:** `POST /v1/animations/validate`

**Authentication:** Not required

**Request Body:**
```json
{
  "scene_width": 1920,
  "scene_height": 1080,
  "background": "#FFFFFF",
  "frame_rate": 30,
  "slides": [
    {
      "index": 0,
      "duration": 4,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Hello World",
            "font": "Arial",
            "size": 60,
            "color": [0, 0, 0],
            "style": "bold",
            "align": "center"
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 1.0
          }
        }
      ]
    }
  ]
}
```

**Response (Valid):**
```json
{
  "success": true,
  "valid": true
}
```

**Response (Invalid):**
```json
{
  "success": true,
  "valid": false,
  "errors": [
    "Slide 0: must have at least one layer",
    "Configuration must have at least one slide"
  ]
}
```

### 3. Generate Video

Generate a whiteboard animation video from configuration.

**Endpoint:** `POST /v1/animations/generate`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "config": {
    "scene_width": 1920,
    "scene_height": 1080,
    "background": "#FFFFFF",
    "frame_rate": 30,
    "slides": [
      {
        "index": 0,
        "duration": 4,
        "layers": [
          {
            "type": "text",
            "text_config": {
              "text": "Hello World",
              "font": "Arial",
              "size": 80,
              "color": [0, 0, 0],
              "style": "bold",
              "align": "center"
            },
            "position": { "x": 960, "y": 540 },
            "z_index": 1,
            "entrance_animation": {
              "type": "fade_in",
              "duration": 1.0
            }
          }
        ]
      }
    ]
  },
  "options": {
    "quality": "standard",
    "aspectRatio": "16:9",
    "skipAudio": false
  }
}
```

**Options:**
- `quality`: `"preview"` | `"draft"` | `"standard"` | `"high"` (default: `"standard"`)
- `aspectRatio`: `"1:1"` | `"16:9"` | `"9:16"` (default: `"16:9"`)
- `skipAudio`: `boolean` (default: `false`)

**Response (Success):**
```json
{
  "success": true,
  "videoUrl": "https://storage.example.com/videos/whiteboard_abc123.mp4"
}
```

**Response (Error):**
```json
{
  "success": false,
  "errors": [
    "Slide 0, Layer 0: text layer must have text_config"
  ]
}
```

### 4. Get Example Configurations

Get pre-built example configurations for common use cases.

**Endpoint:** `GET /v1/animations/examples`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "simple": { /* Simple single-slide example */ },
    "dynamic": { /* Multi-slide with shapes and transitions */ },
    "textFocused": { /* Text-heavy presentation style */ }
  }
}
```

## Configuration Schema

### Animation Configuration

```typescript
{
  scene_width: number;      // 640-7680 pixels
  scene_height: number;     // 480-4320 pixels
  background: string;       // Hex color (#FFFFFF)
  frame_rate: number;       // 24-60 fps
  slides: Slide[];          // Array of slides
  transitions?: Transition[]; // Optional scene transitions
}
```

### Slide Configuration

```typescript
{
  index: number;           // Slide index (0-based)
  duration: number;        // Slide duration in seconds (1-60)
  layers: Layer[];         // Array of layers
}
```

### Layer Configuration

```typescript
{
  type: "text" | "image" | "shape" | "svg";
  position: { x: number; y: number };
  z_index: number;         // Layer stacking order
  mode?: "draw" | "erase" | "flood_fill" | "coloriage" | 
         "path_follow" | "path_follow_then_color" | "static";
  skip_rate?: number;      // Drawing speed (1-20)
  scale?: number;          // Scale factor (0.1-10)
  opacity?: number;        // Opacity (0-1)
  entrance_animation?: EntranceAnimation;
  
  // Type-specific configs
  text_config?: TextConfig;
  shape_config?: ShapeConfig;
  image_path?: string;
  svg_path?: string;
}
```

### Text Configuration

```typescript
{
  text: string;
  font?: string;           // Default: "Arial"
  size?: number;           // 1-500, Default: 60
  color?: [number, number, number] | string; // RGB or hex
  style?: "normal" | "bold" | "italic" | "bold_italic";
  align?: "left" | "center" | "right";
}
```

### Shape Configuration

```typescript
{
  shape: "rectangle" | "circle" | "triangle" | "polygon";
  color?: [number, number, number] | string;
  fill_color?: [number, number, number] | string;
  stroke_width?: number;   // Default: 2
  width?: number;          // Default: 100
  height?: number;         // Default: 100
  radius?: number;         // For circles
}
```

### Entrance Animation

```typescript
{
  type: EntranceAnimationType; // See supported types
  duration: number;            // 0.1-5 seconds
}
```

### Transition

```typescript
{
  after_slide: number;     // Slide index after which to apply
  type: TransitionType;    // See supported types
  duration: number;        // 0.1-3 seconds
}
```

## Entrance Animation Types

### Basic Animations
- `fade_in` - Fade in from transparent
- `fadewhite` - Fade in from white
- `fadeblack` - Fade in from black
- `pop` / `appear` - Instant appearance

### Slide Animations
- `slide_in_left` / `slideright` - Slide from left
- `slide_in_right` / `slideleft` - Slide from right
- `slide_in_top` / `slidedown` - Slide from top
- `slide_in_bottom` / `slideup` - Slide from bottom

### Smooth Animations (with easing)
- `smoothleft` - Smooth slide from right
- `smoothright` - Smooth slide from left
- `smoothup` - Smooth slide from bottom
- `smoothdown` - Smooth slide from top

### Zoom Animations
- `zoom_in` - Zoom from small
- `distance` - Zoom from far distance

### Reveal Animations
- `reveal` - Progressive reveal top to bottom
- `wipeleft` - Wipe right to left
- `wiperight` - Wipe left to right
- `wipeup` - Wipe bottom to top
- `wipedown` - Wipe top to bottom

### Circular Animations
- `circleopen` / `circlecrop` - Circle opens from center
- `circleclose` - Circle closes to center
- `rectcrop` - Rectangle reveal

### Hand Push Animations
- `push_from_left` - Hand pushes from left
- `push_from_right` - Hand pushes from right
- `push_from_top` - Hand pushes from top
- `push_from_bottom` - Hand pushes from bottom

## Transition Types

### Fade Transitions
- `fade` - Cross fade
- `fade_to_black` / `fadeblack` - Fade through black
- `fade_to_white` / `fadewhite` - Fade through white

### Push Transitions
- `push_left` - Push scene left
- `push_right` - Push scene right
- `push_up` / `push_top` - Push scene up
- `push_down` / `push_bottom` - Push scene down

### Wipe Transitions
- `wipe` - Wipe left to right
- `wipe_left` / `wipeleft` - Wipe right to left
- `wipe_right` / `wiperight` - Wipe left to right
- `wipe_up` / `wipeup` - Wipe bottom to top
- `wipe_down` / `wipedown` - Wipe top to bottom

### Special Transitions
- `iris` - Circular iris effect
- `zoom_out_in` / `zoom` - Zoom out then in
- `reveal` - Progressive reveal
- `slide` / `scene_slide` - Scene slide
- `pan` / `camera_move` - Camera pan (smooth fade)

## Complete Examples

### Example 1: Simple Text Animation

```json
{
  "scene_width": 1920,
  "scene_height": 1080,
  "background": "#FFFFFF",
  "frame_rate": 30,
  "slides": [
    {
      "index": 0,
      "duration": 4,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Hello World",
            "font": "Arial",
            "size": 80,
            "color": [0, 0, 0],
            "style": "bold",
            "align": "center"
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 1.0
          }
        }
      ]
    }
  ]
}
```

### Example 2: Multi-Slide Presentation

```json
{
  "scene_width": 1920,
  "scene_height": 1080,
  "background": "#FFFFFF",
  "frame_rate": 30,
  "slides": [
    {
      "index": 0,
      "duration": 4,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Introduction",
            "font": "Arial",
            "size": 80,
            "color": [0, 0, 0],
            "style": "bold"
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 1.0
          }
        }
      ]
    },
    {
      "index": 1,
      "duration": 5,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Key Point #1",
            "font": "Arial",
            "size": 60,
            "color": [0, 0, 0]
          },
          "position": { "x": 960, "y": 400 },
          "z_index": 1,
          "entrance_animation": {
            "type": "slide_in_left",
            "duration": 0.8
          }
        },
        {
          "type": "text",
          "text_config": {
            "text": "Supporting detail for point 1",
            "font": "Arial",
            "size": 40,
            "color": [100, 100, 100]
          },
          "position": { "x": 960, "y": 600 },
          "z_index": 1,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 0.5
          }
        }
      ]
    }
  ],
  "transitions": [
    {
      "after_slide": 0,
      "type": "push_left",
      "duration": 0.5
    }
  ]
}
```

### Example 3: Dynamic Animation with Shapes

```json
{
  "scene_width": 1920,
  "scene_height": 1080,
  "background": "#FFFFFF",
  "frame_rate": 30,
  "slides": [
    {
      "index": 0,
      "duration": 3,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Main Title",
            "font": "Arial",
            "size": 70,
            "color": [0, 0, 0]
          },
          "position": { "x": 960, "y": 300 },
          "z_index": 2,
          "entrance_animation": {
            "type": "zoom_in",
            "duration": 1.0
          }
        },
        {
          "type": "shape",
          "shape_config": {
            "shape": "circle",
            "radius": 100,
            "fill_color": [255, 0, 0]
          },
          "position": { "x": 400, "y": 600 },
          "z_index": 1,
          "entrance_animation": {
            "type": "circleopen",
            "duration": 0.8
          }
        },
        {
          "type": "shape",
          "shape_config": {
            "shape": "circle",
            "radius": 100,
            "fill_color": [0, 255, 0]
          },
          "position": { "x": 960, "y": 600 },
          "z_index": 1,
          "entrance_animation": {
            "type": "circleopen",
            "duration": 0.8
          }
        },
        {
          "type": "shape",
          "shape_config": {
            "shape": "circle",
            "radius": 100,
            "fill_color": [0, 0, 255]
          },
          "position": { "x": 1520, "y": 600 },
          "z_index": 1,
          "entrance_animation": {
            "type": "circleopen",
            "duration": 0.8
          }
        }
      ]
    },
    {
      "index": 1,
      "duration": 4,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Thank You!",
            "font": "Arial",
            "size": 100,
            "color": [255, 0, 0]
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "distance",
            "duration": 1.5
          }
        }
      ]
    }
  ],
  "transitions": [
    {
      "after_slide": 0,
      "type": "zoom_out_in",
      "duration": 1.0
    }
  ]
}
```

## Best Practices

### Performance
1. **Recommended Durations:**
   - Entrance animations: 0.5 - 1.5 seconds
   - Transitions: 0.3 - 1.0 seconds
   - Slide duration: 3 - 10 seconds

2. **Optimization:**
   - Use `mode: "static"` for elements without animation
   - Limit layers per slide to < 10
   - Avoid animations longer than 2 seconds

### Visual Consistency
1. **Animation Style:**
   - Use consistent animation types for similar elements
   - Mix transitions to avoid monotony
   - Use `smooth*` animations for professional look

2. **Timing:**
   - Leave 0.5s pause before/after important animations
   - Sync transitions with content flow

### Quality Settings
- `preview`: Fast preview (2-3x faster, 480p)
- `draft`: Standard quality (1.5x faster, 720p)
- `standard`: High quality (baseline, 720p)
- `high`: Very high quality (1.5x slower, 1080p)

## Error Handling

### Common Errors

1. **Invalid animation type**
   - Check spelling of animation type
   - Refer to supported types list

2. **Duration too short**
   - Minimum duration: 0.1 seconds
   - Increase animation duration

3. **Layer position out of bounds**
   - Ensure position.x < scene_width
   - Ensure position.y < scene_height

4. **Missing required fields**
   - Text layers need `text_config`
   - Image layers need `image_path`
   - Shape layers need `shape_config`

## Rate Limits

- Authentication required for video generation
- Concurrent generation limits apply per user
- Large configurations may take longer to process

## Support

For issues or questions:
- GitHub Issues: [Repository URL]
- Documentation: `/docs`
- API Reference: `/swagger`

## Version

Current API Version: 1.0.0
Last Updated: 2025-11-03
