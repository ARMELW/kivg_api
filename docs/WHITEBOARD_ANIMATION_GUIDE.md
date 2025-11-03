# Whiteboard Animation Types - Integration Guide

## Overview

This document describes all supported animation types for the WhiteboardCliService. These types are used to create professional whiteboard-style animations through the integration with the Python whiteboard-cli engine.

## Usage

The animation types are used through the `WhiteboardConfig` interface in `WhiteboardCliService`:

```typescript
import { WhiteboardCliService, type WhiteboardConfig, type EntranceAnimationType, type TransitionType } from '@/application/services/whiteboard-cli.service'

const config: WhiteboardConfig = {
  scene_width: 1920,
  scene_height: 1080,
  background: '#FFFFFF',
  frame_rate: 30,
  slides: [{
    index: 0,
    duration: 4,
    layers: [{
      type: 'text',
      text_config: {
        text: 'Hello World',
        size: 80
      },
      position: { x: 960, y: 540 },
      z_index: 1,
      entrance_animation: {
        type: 'fade_in',  // EntranceAnimationType
        duration: 1
      }
    }]
  }],
  transitions: [{
    after_slide: 0,
    type: 'push_left',  // TransitionType
    duration: 0.5
  }]
}

const service = new WhiteboardCliService()
const videoUrl = await service.execute(config, {
  quality: 'standard',
  aspectRatio: '16:9'
})
```

## Entrance Animation Types

### Basic Animations

| Type | Description | Use Case |
|------|-------------|----------|
| `fade_in` | Fade in from transparent | General purpose, subtle entry |
| `fadewhite` | Fade in from white | Light backgrounds, smooth reveal |
| `fadeblack` | Fade in from black | Dark backgrounds, dramatic entry |
| `pop` | Instant appearance | Quick reveals, surprise elements |
| `appear` | Alias for pop | Same as pop |

### Slide Animations

| Type | Description | Use Case |
|------|-------------|----------|
| `slide_in_left` | Slides from left edge | Text from left, sequential content |
| `slide_in_right` | Slides from right edge | Text from right, opposing views |
| `slide_in_top` | Slides from top edge | Titles, headers, descending content |
| `slide_in_bottom` | Slides from bottom edge | Footer content, building up |
| `slideleft` | Alias for slide_in_right | |
| `slideright` | Alias for slide_in_left | |
| `slideup` | Alias for slide_in_bottom | |
| `slidedown` | Alias for slide_in_top | |

### Smooth Animations (with easing)

| Type | Description | Use Case |
|------|-------------|----------|
| `smoothleft` | Smooth slide from right | Professional presentations |
| `smoothright` | Smooth slide from left | Elegant transitions |
| `smoothup` | Smooth slide from bottom | Polished reveals |
| `smoothdown` | Smooth slide from top | Refined animations |

### Zoom Animations

| Type | Description | Use Case |
|------|-------------|----------|
| `zoom_in` | Zoom from small to normal | Focus attention, emphasis |
| `distance` | Zoom from very far | Dramatic reveals, big picture to detail |

### Reveal Animations

| Type | Description | Use Case |
|------|-------------|----------|
| `reveal` | Progressive reveal top to bottom | Unveiling content, step-by-step |
| `wipeleft` | Wipe from right to left | Replacing content, clearing |
| `wiperight` | Wipe from left to right | Progressive disclosure |
| `wipeup` | Wipe from bottom to top | Building up, revealing base-up |
| `wipedown` | Wipe from top to bottom | Descending reveal, top-down |

### Circular Animations

| Type | Description | Use Case |
|------|-------------|----------|
| `circleopen` | Circle opens from center | Spotlight effect, focus point |
| `circlecrop` | Alias for circleopen | |
| `circleclose` | Circle closes to center | Zoom out, closing focus |
| `rectcrop` | Rectangle reveal | Frame-based reveals, windows |

### Hand Push Animations

| Type | Description | Use Case |
|------|-------------|----------|
| `push_from_left` | Hand pushes from left | Interactive feel, manual placement |
| `push_from_right` | Hand pushes from right | Guided placement |
| `push_from_top` | Hand pushes from top | Dropping elements |
| `push_from_bottom` | Hand pushes from bottom | Lifting elements |

## Transition Types

### Fade Transitions

| Type | Description | Use Case |
|------|-------------|----------|
| `fade` | Cross fade between scenes | Smooth scene changes |
| `fade_to_black` | Fade to black, then next scene | Chapter breaks, dramatic pauses |
| `fade_to_white` | Fade to white, then next scene | Clean breaks, bright transitions |
| `fadeblack` | Alias for fade_to_black | |
| `fadewhite` | Alias for fade_to_white | |

### Push Transitions

| Type | Description | Use Case |
|------|-------------|----------|
| `push_left` | Push scene to the left | Sequential content, forward flow |
| `push_right` | Push scene to the right | Backward navigation feel |
| `push_up` | Push scene upward | Ascending content |
| `push_down` | Push scene downward | Descending hierarchy |
| `push_top` | Alias for push_up | |
| `push_bottom` | Alias for push_down | |

### Wipe Transitions

| Type | Description | Use Case |
|------|-------------|----------|
| `wipe` | Wipe left to right | Replacing content |
| `wipe_left` | Wipe right to left | Clearing, resetting |
| `wipe_right` | Wipe left to right | Progressive replacement |
| `wipe_up` | Wipe bottom to top | Building transitions |
| `wipe_down` | Wipe top to bottom | Descending transitions |
| `wipeleft` | Alias for wipe_left | |
| `wiperight` | Alias for wipe_right | |
| `wipeup` | Alias for wipe_up | |
| `wipedown` | Alias for wipe_down | |

### Special Transitions

| Type | Description | Use Case |
|------|-------------|----------|
| `iris` | Circular iris effect | Focus transitions, spotlight |
| `zoom_out_in` | Zoom out then zoom into next | Big picture then detail |
| `zoom` | Alias for zoom_out_in | |
| `reveal` | Progressive reveal | Step-by-step disclosure |
| `slide` | Slide scene change | Simple lateral movement |
| `scene_slide` | Alias for slide | |
| `pan` | Camera pan (smooth fade) | Cinematic feel |
| `camera_move` | Alias for pan | |

## Layer Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `draw` | Draw tile by tile | Detailed drawings, sketch feel |
| `erase` | Progressive erase | Reveal by removal |
| `flood_fill` | Fill by regions | Logos, solid shapes |
| `coloriage` | Progressive coloring | Art, illustrations |
| `path_follow` | Point by point animation | Signatures, calligraphy, lines |
| `path_follow_then_color` | Outline then fill | SVG drawings, structured graphics |
| `static` | Instant display | Watermarks, non-animated elements |

## Configuration Schema

### Complete WhiteboardConfig

```typescript
interface WhiteboardConfig {
  scene_width?: number        // Default: 1920
  scene_height?: number       // Default: 1080
  background?: string         // Hex color, default: '#FFFFFF'
  frame_rate?: number         // FPS, default: 30
  slides: Slide[]
  transitions?: Transition[]
}

interface Slide {
  index: number               // 0-based slide index
  duration: number            // Slide duration in seconds
  skip_rate?: number          // Animation speed (lower = slower)
  layers?: Layer[]
}

interface Layer {
  type: 'text' | 'image' | 'shape' | 'svg' | 'arrow' | 'video'
  position?: { x: number; y: number }
  z_index: number
  mode?: LayerMode
  scale?: number
  opacity?: number
  skip_rate?: number
  entrance_animation?: {
    type: EntranceAnimationType
    duration: number
  }
  // Type-specific configs
  text_config?: TextConfig
  image_path?: string
  svg_path?: string
  shape_config?: ShapeConfig
  arrow_config?: ArrowConfig
}

interface Transition {
  after_slide: number         // Apply after this slide index
  type: TransitionType
  duration: number            // Transition duration in seconds
  pause_before?: number       // Pause before transition
}
```

## Examples

### Simple Text Animation

```typescript
const config: WhiteboardConfig = {
  slides: [{
    index: 0,
    duration: 4,
    layers: [{
      type: 'text',
      text_config: {
        text: 'Welcome!',
        font: 'Arial',
        size: 80,
        color: [0, 0, 0]
      },
      position: { x: 960, y: 540 },
      z_index: 1,
      entrance_animation: {
        type: 'zoom_in',
        duration: 1
      }
    }]
  }]
}
```

### Multi-Slide with Transitions

```typescript
const config: WhiteboardConfig = {
  slides: [
    {
      index: 0,
      duration: 3,
      layers: [{
        type: 'text',
        text_config: { text: 'Slide 1', size: 70 },
        position: { x: 960, y: 540 },
        z_index: 1,
        entrance_animation: { type: 'slide_in_left', duration: 0.8 }
      }]
    },
    {
      index: 1,
      duration: 3,
      layers: [{
        type: 'text',
        text_config: { text: 'Slide 2', size: 70 },
        position: { x: 960, y: 540 },
        z_index: 1,
        entrance_animation: { type: 'fade_in', duration: 0.8 }
      }]
    }
  ],
  transitions: [{
    after_slide: 0,
    type: 'push_left',
    duration: 0.5
  }]
}
```

### Shapes with Hand Animation

```typescript
const config: WhiteboardConfig = {
  slides: [{
    index: 0,
    duration: 5,
    layers: [
      {
        type: 'text',
        text_config: { text: 'Services', size: 80 },
        position: { x: 960, y: 200 },
        z_index: 2,
        entrance_animation: { type: 'fade_in', duration: 1 }
      },
      {
        type: 'shape',
        shape_config: {
          shape: 'circle',
          radius: 80,
          fill_color: [66, 135, 245]
        },
        position: { x: 400, y: 540 },
        z_index: 1,
        entrance_animation: { type: 'push_from_left', duration: 0.8 }
      },
      {
        type: 'shape',
        shape_config: {
          shape: 'circle',
          radius: 80,
          fill_color: [52, 168, 83]
        },
        position: { x: 960, y: 540 },
        z_index: 1,
        entrance_animation: { type: 'push_from_top', duration: 0.8 }
      }
    ]
  }]
}
```

## Best Practices

### Performance
- Use `skip_rate` to control animation speed (higher = faster)
- Keep entrance animations between 0.5-1.5 seconds
- Keep transitions between 0.3-1.0 seconds
- Use `mode: 'static'` for non-animated elements

### Visual Consistency
- Use consistent animation types for similar elements
- Mix transition types to avoid monotony
- Use `smooth*` animations for professional look
- Reserve `distance` and dramatic effects for key moments

### Timing
- Allow 0.5s pause before/after important animations
- Match slide duration to content complexity
- Typical slide: 3-10 seconds
- Quick reveal: 2-4 seconds
- Detailed explanation: 5-15 seconds

## Integration with Other Services

The WhiteboardCliService is used by:
- Preview generation service
- Export service
- Scene rendering

These services internally create WhiteboardConfig objects and pass them to WhiteboardCliService for video generation.

## Quality Presets

```typescript
const options = {
  quality: 'preview' | 'draft' | 'standard' | 'high',
  aspectRatio: '1:1' | '16:9' | '9:16',
  skipAudio: boolean
}
```

- **preview**: Fast (480p, 3x faster)
- **draft**: Standard (720p, 1.5x faster)
- **standard**: Production (720p)
- **high**: Best quality (1080p)

## See Also

- `animation.model.ts` - Zod schemas for validation
- `animation-validation.service.ts` - Config validation
- `whiteboard-cli.service.ts` - Main service implementation
