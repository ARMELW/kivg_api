# Whiteboard CLI - RTL Text Support & Audio Management

This document describes the new RTL text support and comprehensive audio management features added to the Whiteboard CLI service.

## RTL Text Support

The Whiteboard CLI now supports Right-to-Left (RTL) text rendering and animation for languages like Arabic, Hebrew, and Persian.

### Configuration

Add the following properties to your text_config:

```typescript
{
  text_config: {
    text: "مرحبا بالعالم",      // The text to display
    direction: "rtl",            // Text rendering direction: "ltr" | "rtl"
    draw_mode: "rtl",            // Animation direction: "ltr" | "rtl"
    align: "right",              // Text alignment: "left" | "center" | "right"
    font: "Arial",
    size: 24,
    color: "#000000",
    style: "normal"
  }
}
```

### Properties

- **`direction`** (`'ltr' | 'rtl'`): Controls bidirectional text rendering
  - `ltr`: Left-to-right (default) - for English, French, etc.
  - `rtl`: Right-to-left - for Arabic, Hebrew, etc.

- **`draw_mode`** (`'ltr' | 'rtl'`): Controls animation direction
  - `ltr`: Animate text from left to right (default)
  - `rtl`: Animate text from right to left

- **`align`** (`'left' | 'center' | 'right'`): Text alignment
  - Typically set to `"right"` for RTL text
  - Typically set to `"left"` for LTR text

### Example: Arabic Text with RTL Support

```json
{
  "slides": [
    {
      "index": 0,
      "duration": 5,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "مرحبا بالعالم",
            "direction": "rtl",
            "draw_mode": "rtl",
            "align": "right",
            "font": "Arial",
            "size": 32,
            "color": "#000000"
          },
          "position": { "x": 960, "y": 540 },
          "z_index": 1
        }
      ]
    }
  ]
}
```

## Audio Management

The Whiteboard CLI now supports comprehensive audio management at both the scene level and layer level.

### Scene-Level Audio

Add background audio to the entire scene:

```typescript
{
  audio: {
    file_path: "https://example.com/background-music.mp3",
    volume: 0.5,              // Volume level (0.0 to 1.0)
    start_time: 2,            // Start time in seconds (trim from beginning)
    end_time: 30,             // End time in seconds (trim from end)
    fade_in: 1.5,             // Fade-in duration in seconds
    fade_out: 2.0,            // Fade-out duration in seconds
    loop: false               // Whether to loop the audio
  }
}
```

### Audio Layer

Add audio as a layer for more control:

```typescript
{
  "slides": [
    {
      "index": 0,
      "duration": 10,
      "layers": [
        {
          "type": "audio",
          "audio_config": {
            "file_path": "https://example.com/voiceover.mp3",
            "volume": 0.8,
            "start_time": 0,
            "end_time": 10,
            "fade_in": 0.5,
            "fade_out": 1.0,
            "loop": false
          },
          "z_index": 0
        }
      ]
    }
  ]
}
```

### Audio Properties

- **`file_path`** (required): URL or path to the audio file
- **`volume`** (optional): Volume level from 0.0 (silent) to 1.0 (full volume). Default: 1.0
- **`start_time`** (optional): Trim audio from this time in seconds
- **`end_time`** (optional): Trim audio to this time in seconds
- **`fade_in`** (optional): Fade-in duration in seconds
- **`fade_out`** (optional): Fade-out duration in seconds
- **`loop`** (optional): Whether to loop the audio. Default: false

### Multiple Audio Layers

You can add multiple audio layers for complex audio compositions:

```json
{
  "slides": [
    {
      "index": 0,
      "duration": 15,
      "layers": [
        {
          "type": "audio",
          "audio_config": {
            "file_path": "https://example.com/background-music.mp3",
            "volume": 0.3,
            "loop": true
          },
          "z_index": 0
        },
        {
          "type": "audio",
          "audio_config": {
            "file_path": "https://example.com/voiceover.mp3",
            "volume": 0.9,
            "fade_in": 0.5,
            "fade_out": 1.0
          },
          "z_index": 1
        }
      ]
    }
  ]
}
```

## Backward Compatibility

The implementation maintains backward compatibility with existing audio formats:

### Legacy Audio Format (scene.audio)

```typescript
{
  audio: {
    file_path: "https://example.com/audio.mp3",
    volume: 0.8,
    start_time: 5,
    fade_in: 1.0
  }
}
```

### New Audio Format (scene.sceneAudio)

```typescript
{
  sceneAudio: {
    fileUrl: "https://example.com/audio.mp3",
    volume: 0.8,
    trimConfig: {
      startTime: 5,
      endTime: 15
    },
    fadeConfig: {
      fadeIn: 1.0,
      fadeOut: 2.0
    },
    loop: false
  }
}
```

Both formats are automatically converted to the unified audio configuration.

## Complete Example: RTL Text with Audio

```json
{
  "slides": [
    {
      "index": 0,
      "duration": 10,
      "layers": [
        {
          "type": "text",
          "text_config": {
            "text": "مرحبا بالعالم",
            "direction": "rtl",
            "draw_mode": "rtl",
            "align": "right",
            "font": "Arial",
            "size": 48,
            "color": "#2C3E50",
            "style": "bold"
          },
          "position": { "x": 960, "y": 400 },
          "z_index": 2,
          "entrance_animation": {
            "type": "fade_in",
            "duration": 1.0
          }
        },
        {
          "type": "audio",
          "audio_config": {
            "file_path": "https://example.com/arabic-voiceover.mp3",
            "volume": 0.9,
            "fade_in": 0.5,
            "fade_out": 1.0
          },
          "z_index": 0
        }
      ]
    }
  ],
  "audio": {
    "file_path": "https://example.com/background-music.mp3",
    "volume": 0.3,
    "loop": true,
    "fade_in": 2.0
  }
}
```

## Usage in Scene Model

When creating a Scene, you can now include RTL text and audio:

```typescript
const scene: Scene = {
  id: 'scene-1',
  projectId: 'project-1',
  title: 'Arabic Introduction',
  duration: 10,
  layers: [
    {
      id: 'text-layer-1',
      name: 'Arabic Title',
      type: 'text',
      mode: 'draw',
      position: { x: 960, y: 540 },
      camera_position: { x: 960, y: 540 },
      width: 800,
      height: 100,
      zIndex: 1,
      scale: 1,
      opacity: 1,
      text_config: {
        text: 'مرحبا بالعالم',
        font: 'Arial',
        size: 48,
        color: '#000000',
        align: 'right',
        style: 'bold',
        direction: 'rtl',
        draw_mode: 'rtl'
      }
    }
  ],
  sceneAudio: {
    fileUrl: 'https://example.com/background.mp3',
    volume: 0.5,
    trimConfig: {
      startTime: 0,
      endTime: 10
    },
    fadeConfig: {
      fadeIn: 1.0,
      fadeOut: 2.0
    }
  },
  cameras: [],
  sceneCameras: [],
  multiTimeline: {},
  audio: {},
  transitionType: 'fade',
  draggingSpeed: 1,
  slideDuration: 0,
  syncSlideWithVoice: false,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## Testing

Comprehensive tests are included in `whiteboard-cli.service.spec.ts`:

- RTL text direction and draw_mode
- Default LTR behavior
- Scene-level audio configuration
- Legacy audio format support
- Audio layers with all properties
- Combined RTL text and audio in the same scene

Run tests with:
```bash
bun test whiteboard-cli.service.spec.ts
```

## Notes

1. **RTL Text**: Ensure your font supports the characters you're using (e.g., Arabic, Hebrew fonts)
2. **Audio Files**: Supported formats depend on the whiteboard CLI implementation (typically MP3, WAV, OGG)
3. **Performance**: Multiple audio layers may impact rendering performance
4. **Volume Mixing**: When using both scene audio and audio layers, volumes are mixed together
