# Animation API Quick Start Guide

## Introduction

This guide will help you get started with the Doodlio Animation API in 5 minutes.

## Step 1: Get Your API Token

First, authenticate to get your Bearer token:

```bash
# Login or register to get authentication token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

## Step 2: Check Available Animation Types

See what animation types are available:

```bash
curl http://localhost:3000/api/v1/animations/types
```

Response:
```json
{
  "success": true,
  "data": {
    "entranceAnimations": ["fade_in", "slide_in_left", "zoom_in", ...],
    "transitions": ["fade", "push_left", "zoom_out_in", ...],
    "layerModes": ["draw", "static", "erase", ...]
  }
}
```

## Step 3: Validate Your Configuration

Before generating a video, validate your configuration:

```bash
curl -X POST http://localhost:3000/api/v1/animations/validate \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

Expected response:
```json
{
  "success": true,
  "valid": true
}
```

## Step 4: Generate Your First Video

Now generate the video:

```bash
curl -X POST http://localhost:3000/api/v1/animations/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
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
      "quality": "preview",
      "aspectRatio": "16:9",
      "skipAudio": true
    }
  }'
```

Response:
```json
{
  "success": true,
  "videoUrl": "https://storage.example.com/videos/whiteboard_abc123.mp4"
}
```

## Step 5: Download Your Video

Use the returned URL to download or stream your generated video.

## Example Configurations

### Simple Text Animation

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
            "text": "Welcome!",
            "font": "Arial",
            "size": 80,
            "color": [0, 0, 0]
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "zoom_in",
            "duration": 1.0
          }
        }
      ]
    }
  ]
}
```

### Two Slides with Transition

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
            "text": "First Slide",
            "size": 70
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "slide_in_left",
            "duration": 0.8
          }
        }
      ]
    },
    {
      "index": 1,
      "duration": 3,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Second Slide",
            "size": 70
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 0.8
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

### Multiple Elements with Shapes

```json
{
  "scene_width": 1920,
  "scene_height": 1080,
  "background": "#F5F5F5",
  "frame_rate": 30,
  "slides": [
    {
      "index": 0,
      "duration": 5,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "Our Services",
            "size": 80,
            "color": [0, 0, 0]
          },
          "position": { "x": 960, "y": 200 },
          "z_index": 2,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 1.0
          }
        },
        {
          "type": "shape",
          "shape_config": {
            "shape": "circle",
            "radius": 80,
            "fill_color": [66, 135, 245]
          },
          "position": { "x": 400, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "circleopen",
            "duration": 0.8
          }
        },
        {
          "type": "text",
          "text_config": {
            "text": "Design",
            "size": 40,
            "color": [255, 255, 255]
          },
          "position": { "x": 400, "y": 540 },
          "z_index": 3,
          "entrance_animation": {
            "type": "pop",
            "duration": 0.1
          }
        },
        {
          "type": "shape",
          "shape_config": {
            "shape": "circle",
            "radius": 80,
            "fill_color": [52, 168, 83]
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "circleopen",
            "duration": 0.8
          }
        },
        {
          "type": "text",
          "text_config": {
            "text": "Develop",
            "size": 40,
            "color": [255, 255, 255]
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 3,
          "entrance_animation": {
            "type": "pop",
            "duration": 0.1
          }
        },
        {
          "type": "shape",
          "shape_config": {
            "shape": "circle",
            "radius": 80,
            "fill_color": [251, 188, 4]
          },
          "position": { "x": 1520, "y": 540 },
          "z_index": 1,
          "entrance_animation": {
            "type": "circleopen",
            "duration": 0.8
          }
        },
        {
          "type": "text",
          "text_config": {
            "text": "Deploy",
            "size": 40,
            "color": [255, 255, 255]
          },
          "position": { "x": 1520, "y": 540 },
          "z_index": 3,
          "entrance_animation": {
            "type": "pop",
            "duration": 0.1
          }
        }
      ]
    }
  ]
}
```

## Tips for Best Results

1. **Start Simple**: Begin with a single slide and one text layer
2. **Use Preview Mode**: Set `quality: "preview"` for fast testing
3. **Validate First**: Always validate before generating
4. **Check Examples**: Use `GET /v1/animations/examples` for inspiration
5. **Experiment**: Try different animation types to find what works best

## Quality vs Speed

| Quality | Speed | Resolution | Use Case |
|---------|-------|------------|----------|
| preview | 3x faster | 480p | Quick tests, iterations |
| draft | 1.5x faster | 720p | Review versions |
| standard | Baseline | 720p | Final production |
| high | 1.5x slower | 1080p | High-quality output |

## Common Issues

### "Configuration must have at least one slide"
- Make sure your `slides` array is not empty

### "Text layer must have text_config"
- Add `text_config` object with at least `text` field

### "Invalid animation type"
- Check spelling of animation type
- Use `GET /v1/animations/types` to see valid types

### "Unauthorized"
- Include `Authorization: Bearer TOKEN` header
- Check that your token is valid

## Next Steps

- Read the [Full API Documentation](./ANIMATION_API.md)
- Explore all [Animation Types](./ANIMATION_API.md#entrance-animation-types)
- Learn about [Layer Modes](./ANIMATION_API.md#layer-configuration)
- See more [Examples](./ANIMATION_API.md#complete-examples)

## Support

- API Documentation: http://localhost:3000/docs
- Swagger UI: http://localhost:3000/swagger

Happy animating! 🎬
