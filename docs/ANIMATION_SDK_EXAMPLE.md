# Animation API - Frontend Integration Examples

## JavaScript/TypeScript SDK

This document provides ready-to-use code examples for integrating the Animation API into your frontend application.

## Installation

No external dependencies required - uses native `fetch` API.

## TypeScript Types

```typescript
// Animation Types
export type EntranceAnimationType =
  | 'fade_in' | 'fadewhite' | 'fadeblack' | 'pop' | 'appear'
  | 'slide_in_left' | 'slide_in_right' | 'slide_in_top' | 'slide_in_bottom'
  | 'slideleft' | 'slideright' | 'slideup' | 'slidedown'
  | 'smoothleft' | 'smoothright' | 'smoothup' | 'smoothdown'
  | 'zoom_in' | 'distance'
  | 'reveal' | 'wipeleft' | 'wiperight' | 'wipeup' | 'wipedown'
  | 'circleopen' | 'circlecrop' | 'circleclose' | 'rectcrop'
  | 'push_from_left' | 'push_from_right' | 'push_from_top' | 'push_from_bottom';

export type TransitionType =
  | 'fade' | 'fade_to_black' | 'fade_to_white' | 'fadeblack' | 'fadewhite'
  | 'push_left' | 'push_right' | 'push_up' | 'push_down' | 'push_top' | 'push_bottom'
  | 'wipe' | 'wipe_left' | 'wipe_right' | 'wipe_up' | 'wipe_down'
  | 'wipeleft' | 'wiperight' | 'wipeup' | 'wipedown'
  | 'iris' | 'zoom_out_in' | 'zoom' | 'reveal' | 'slide' | 'scene_slide' | 'pan' | 'camera_move';

export type LayerMode = 'draw' | 'erase' | 'flood_fill' | 'coloriage' | 'path_follow' | 'path_follow_then_color' | 'static';

export interface EntranceAnimation {
  type: EntranceAnimationType;
  duration: number;
}

export interface Transition {
  after_slide: number;
  type: TransitionType;
  duration: number;
}

export interface TextConfig {
  text: string;
  font?: string;
  size?: number;
  color?: [number, number, number] | string;
  style?: 'normal' | 'bold' | 'italic' | 'bold_italic';
  align?: 'left' | 'center' | 'right';
}

export interface ShapeConfig {
  shape: 'rectangle' | 'circle' | 'triangle' | 'polygon';
  color?: [number, number, number] | string;
  fill_color?: [number, number, number] | string;
  stroke_width?: number;
  width?: number;
  height?: number;
  radius?: number;
}

export interface LayerConfig {
  type: 'text' | 'image' | 'shape' | 'svg';
  position: { x: number; y: number };
  z_index: number;
  mode?: LayerMode;
  skip_rate?: number;
  scale?: number;
  opacity?: number;
  entrance_animation?: EntranceAnimation;
  text_config?: TextConfig;
  shape_config?: ShapeConfig;
  image_path?: string;
  svg_path?: string;
}

export interface SlideConfig {
  index: number;
  duration: number;
  layers: LayerConfig[];
}

export interface AnimationConfig {
  scene_width: number;
  scene_height: number;
  background: string;
  frame_rate: number;
  slides: SlideConfig[];
  transitions?: Transition[];
}

export interface GenerationOptions {
  quality?: 'preview' | 'draft' | 'standard' | 'high';
  aspectRatio?: '1:1' | '16:9' | '9:16';
  skipAudio?: boolean;
}
```

## Animation API Client

```typescript
export class AnimationAPIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000/api/v1/animations') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  async getSupportedTypes() {
    const response = await fetch(`${this.baseUrl}/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch animation types');
    }
    return response.json();
  }

  async validate(config: AnimationConfig) {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error('Failed to validate configuration');
    }

    return response.json();
  }

  async generate(config: AnimationConfig, options?: GenerationOptions) {
    if (!this.token) {
      throw new Error('Authentication token required for video generation');
    }

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ config, options })
    });

    if (!response.ok) {
      throw new Error('Failed to generate video');
    }

    return response.json();
  }

  async getExamples() {
    const response = await fetch(`${this.baseUrl}/examples`);
    if (!response.ok) {
      throw new Error('Failed to fetch examples');
    }
    return response.json();
  }
}
```

## Configuration Builder

```typescript
export class AnimationConfigBuilder {
  private config: AnimationConfig;

  constructor(width = 1920, height = 1080) {
    this.config = {
      scene_width: width,
      scene_height: height,
      background: '#FFFFFF',
      frame_rate: 30,
      slides: []
    };
  }

  setBackground(color: string) {
    this.config.background = color;
    return this;
  }

  setFrameRate(fps: number) {
    this.config.frame_rate = fps;
    return this;
  }

  addSlide(duration: number, layers: LayerConfig[]) {
    this.config.slides.push({
      index: this.config.slides.length,
      duration,
      layers
    });
    return this;
  }

  addTransition(afterSlide: number, type: TransitionType, duration = 0.5) {
    if (!this.config.transitions) {
      this.config.transitions = [];
    }
    this.config.transitions.push({ after_slide: afterSlide, type, duration });
    return this;
  }

  createTextLayer(
    text: string,
    position: { x: number; y: number },
    options: {
      size?: number;
      color?: [number, number, number] | string;
      font?: string;
      style?: 'normal' | 'bold' | 'italic' | 'bold_italic';
      align?: 'left' | 'center' | 'right';
      animation?: EntranceAnimation;
      zIndex?: number;
    } = {}
  ): LayerConfig {
    return {
      type: 'text',
      position,
      z_index: options.zIndex ?? 1,
      text_config: {
        text,
        font: options.font,
        size: options.size,
        color: options.color,
        style: options.style,
        align: options.align
      },
      entrance_animation: options.animation
    };
  }

  createShapeLayer(
    shape: 'rectangle' | 'circle' | 'triangle' | 'polygon',
    position: { x: number; y: number },
    options: {
      fillColor?: [number, number, number] | string;
      color?: [number, number, number] | string;
      width?: number;
      height?: number;
      radius?: number;
      animation?: EntranceAnimation;
      zIndex?: number;
    } = {}
  ): LayerConfig {
    return {
      type: 'shape',
      position,
      z_index: options.zIndex ?? 1,
      shape_config: {
        shape,
        fill_color: options.fillColor,
        color: options.color,
        width: options.width,
        height: options.height,
        radius: options.radius
      },
      entrance_animation: options.animation
    };
  }

  createImageLayer(
    imagePath: string,
    position: { x: number; y: number },
    options: {
      animation?: EntranceAnimation;
      zIndex?: number;
      scale?: number;
      opacity?: number;
    } = {}
  ): LayerConfig {
    return {
      type: 'image',
      image_path: imagePath,
      position,
      z_index: options.zIndex ?? 1,
      scale: options.scale,
      opacity: options.opacity,
      entrance_animation: options.animation
    };
  }

  build(): AnimationConfig {
    return this.config;
  }
}
```

## Usage Examples

### Example 1: Simple Text Animation

```typescript
const client = new AnimationAPIClient();
client.setToken('your-auth-token');

const builder = new AnimationConfigBuilder();

const config = builder
  .addSlide(4, [
    builder.createTextLayer(
      'Hello World!',
      { x: 960, y: 540 },
      {
        size: 80,
        color: [0, 0, 0],
        style: 'bold',
        align: 'center',
        animation: { type: 'fade_in', duration: 1.0 }
      }
    )
  ])
  .build();

// Validate
const validation = await client.validate(config);
console.log('Valid:', validation.valid);

// Generate
const result = await client.generate(config, { quality: 'preview' });
console.log('Video URL:', result.videoUrl);
```

### Example 2: Multi-Slide Presentation

```typescript
const builder = new AnimationConfigBuilder();

builder
  // Slide 1: Title
  .addSlide(3, [
    builder.createTextLayer(
      'My Presentation',
      { x: 960, y: 540 },
      {
        size: 90,
        style: 'bold',
        animation: { type: 'zoom_in', duration: 1.2 }
      }
    )
  ])
  .addTransition(0, 'push_left', 0.5)
  
  // Slide 2: Content
  .addSlide(5, [
    builder.createTextLayer(
      'Point 1',
      { x: 960, y: 400 },
      {
        size: 60,
        animation: { type: 'slide_in_left', duration: 0.8 }
      }
    ),
    builder.createTextLayer(
      'Supporting details here',
      { x: 960, y: 600 },
      {
        size: 40,
        color: [100, 100, 100],
        animation: { type: 'fade_in', duration: 0.5 }
      }
    )
  ])
  .addTransition(1, 'fade', 0.5)
  
  // Slide 3: Thank you
  .addSlide(3, [
    builder.createTextLayer(
      'Thank You!',
      { x: 960, y: 540 },
      {
        size: 100,
        color: [255, 0, 0],
        animation: { type: 'distance', duration: 1.5 }
      }
    )
  ]);

const config = builder.build();
const result = await client.generate(config, { quality: 'standard' });
```

### Example 3: Shapes and Icons

```typescript
const builder = new AnimationConfigBuilder();

builder.addSlide(5, [
  // Title
  builder.createTextLayer(
    'Our Services',
    { x: 960, y: 200 },
    {
      size: 80,
      animation: { type: 'fade_in', duration: 1.0 }
    }
  ),
  
  // Service 1
  builder.createShapeLayer(
    'circle',
    { x: 400, y: 540 },
    {
      radius: 80,
      fillColor: [66, 135, 245],
      animation: { type: 'circleopen', duration: 0.8 }
    }
  ),
  builder.createTextLayer(
    'Design',
    { x: 400, y: 540 },
    {
      size: 40,
      color: [255, 255, 255],
      zIndex: 2,
      animation: { type: 'pop', duration: 0.1 }
    }
  ),
  
  // Service 2
  builder.createShapeLayer(
    'circle',
    { x: 960, y: 540 },
    {
      radius: 80,
      fillColor: [52, 168, 83],
      animation: { type: 'circleopen', duration: 0.8 }
    }
  ),
  builder.createTextLayer(
    'Develop',
    { x: 960, y: 540 },
    {
      size: 40,
      color: [255, 255, 255],
      zIndex: 2,
      animation: { type: 'pop', duration: 0.1 }
    }
  ),
  
  // Service 3
  builder.createShapeLayer(
    'circle',
    { x: 1520, y: 540 },
    {
      radius: 80,
      fillColor: [251, 188, 4],
      animation: { type: 'circleopen', duration: 0.8 }
    }
  ),
  builder.createTextLayer(
    'Deploy',
    { x: 1520, y: 540 },
    {
      size: 40,
      color: [255, 255, 255],
      zIndex: 2,
      animation: { type: 'pop', duration: 0.1 }
    }
  )
]);

const config = builder.build();
```

## React Component Example

```tsx
import React, { useState } from 'react';
import { AnimationAPIClient, AnimationConfigBuilder } from './animation-sdk';

const AnimationGenerator: React.FC = () => {
  const [client] = useState(() => new AnimationAPIClient());
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create configuration
      const builder = new AnimationConfigBuilder();
      const config = builder
        .addSlide(4, [
          builder.createTextLayer(
            'Hello from React!',
            { x: 960, y: 540 },
            {
              size: 80,
              style: 'bold',
              animation: { type: 'fade_in', duration: 1.0 }
            }
          )
        ])
        .build();
      
      // Validate
      const validation = await client.validate(config);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      // Generate
      const result = await client.generate(config, { quality: 'preview' });
      setVideoUrl(result.videoUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generateVideo} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Video'}
      </button>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {videoUrl && (
        <div>
          <p>Video generated successfully!</p>
          <video src={videoUrl} controls style={{ width: '100%' }} />
          <a href={videoUrl} download>Download Video</a>
        </div>
      )}
    </div>
  );
};

export default AnimationGenerator;
```

## Vue Component Example

```vue
<template>
  <div class="animation-generator">
    <button @click="generateVideo" :disabled="loading">
      {{ loading ? 'Generating...' : 'Generate Video' }}
    </button>
    
    <div v-if="error" class="error">{{ error }}</div>
    
    <div v-if="videoUrl" class="result">
      <p>Video generated successfully!</p>
      <video :src="videoUrl" controls style="width: 100%"></video>
      <a :href="videoUrl" download>Download Video</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AnimationAPIClient, AnimationConfigBuilder } from './animation-sdk';

const client = new AnimationAPIClient();
const loading = ref(false);
const videoUrl = ref<string | null>(null);
const error = ref<string | null>(null);

const generateVideo = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const builder = new AnimationConfigBuilder();
    const config = builder
      .addSlide(4, [
        builder.createTextLayer(
          'Hello from Vue!',
          { x: 960, y: 540 },
          {
            size: 80,
            style: 'bold',
            animation: { type: 'fade_in', duration: 1.0 }
          }
        )
      ])
      .build();
    
    const validation = await client.validate(config);
    if (!validation.valid) {
      error.value = validation.errors.join(', ');
      return;
    }
    
    const result = await client.generate(config, { quality: 'preview' });
    videoUrl.value = result.videoUrl;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.error {
  color: red;
  margin: 10px 0;
}
.result {
  margin-top: 20px;
}
</style>
```

## Error Handling

```typescript
try {
  const result = await client.generate(config);
  console.log('Success:', result.videoUrl);
} catch (error) {
  if (error.response) {
    // API returned an error
    const data = await error.response.json();
    if (data.errors) {
      console.error('Validation errors:', data.errors);
    } else {
      console.error('API error:', data.error);
    }
  } else {
    // Network or other error
    console.error('Error:', error.message);
  }
}
```

## Best Practices

1. **Always validate before generating** - Save time and API calls
2. **Use preview mode for testing** - Faster iterations during development
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Cache animation types** - Fetch once and reuse
5. **Provide progress feedback** - Show loading states to users

## Next Steps

- Explore the [Full API Documentation](./ANIMATION_API.md)
- Check out the [Quick Start Guide](./ANIMATION_QUICK_START.md)
- Review more [Animation Examples](./ANIMATION_API.md#complete-examples)
