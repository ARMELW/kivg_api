# AI Features Documentation

## Overview

Doodlio API now includes AI-powered features to enhance video creation workflows. The implementation uses an abstraction layer that allows easy switching between AI providers.

## Architecture

### Abstraction Layer

All AI services implement standard interfaces defined in `src/domain/interfaces/ai-service.interface.ts`. This allows:
- Easy provider switching (e.g., from Gemini to OpenAI)
- Consistent API across different AI services
- Simplified testing and mocking

### Current Implementation

- **Image Generation**: Gemini (prompt enhancement)
- **Script Generation**: Gemini
- **Voice Synthesis**: ElevenLabs (text-to-speech)

## Features

### 1. AI Image Prompt Generator

Generate enhanced prompts for image generation services using Gemini AI.

**Endpoint**: `POST /api/v1/ai/generate-image-prompt`

**Request**:
```json
{
  "prompt": "A futuristic city at sunset",
  "style": "realistic"
}
```

**Styles**:
- `realistic` - Photorealistic, high detail
- `cartoon` - Vibrant colors, playful
- `anime` - Anime/manga style
- `artistic` - Painterly, expressive
- `minimal` - Minimalist, clean lines

**Response**:
```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "Photorealistic futuristic cityscape at golden hour sunset, towering glass skyscrapers reflecting warm orange and pink hues, flying vehicles in sky, detailed urban architecture, professional photography, 8k resolution, cinematic lighting"
  }
}
```

**Use Case**: Use the enhanced prompt with image generation services like DALL-E, Midjourney, or Stable Diffusion.

### 2. AI Script Generator

Generate complete video scripts with scene breakdowns using Gemini AI.

**Endpoint**: `POST /api/v1/ai/generate-script`

**Request**:
```json
{
  "topic": "Introduction to Machine Learning",
  "tone": "educational",
  "length": "medium",
  "style": "instructional",
  "targetAudience": "Beginners in tech"
}
```

**Parameters**:
- `topic` (required): Main subject of the script
- `tone`: `professional` | `casual` | `educational` | `entertaining` | `inspiring`
- `length`: 
  - `short` - 30 seconds (75-90 words)
  - `medium` - 1-2 minutes (150-300 words)
  - `long` - 3-5 minutes (450-750 words)
- `style`: `narrative` | `conversational` | `instructional`
- `targetAudience`: Optional description of target viewers

**Response**:
```json
{
  "success": true,
  "data": {
    "script": "Full script text...",
    "scenes": [
      {
        "id": "scene-1",
        "text": "Welcome to this introduction to Machine Learning...",
        "duration": 15,
        "imagePrompt": "Modern computer screen showing ML algorithms",
        "notes": "Use animated graphics"
      },
      {
        "id": "scene-2",
        "text": "Machine Learning is a subset of artificial intelligence...",
        "duration": 20,
        "imagePrompt": "Venn diagram showing AI, ML, and Deep Learning",
        "notes": "Show relationship between concepts"
      }
    ]
  }
}
```

### 3. Voice Library

Access to ElevenLabs voices across multiple languages for voice synthesis.

**Endpoint**: `GET /api/v1/ai/voices?language=en`

**Features**:
- Real-time voice fetching from ElevenLabs API
- 1-hour cache to optimize performance
- Automatic gender and language detection
- Fallback to 50+ static voices if ElevenLabs not configured

**Supported Languages**:
- English (`en`)
- Spanish (`es`)
- French (`fr`)
- German (`de`)
- Italian (`it`)
- Portuguese (`pt`)
- Russian (`ru`)
- Japanese (`ja`)
- Korean (`ko`)
- Chinese (`zh`)

**Response**:
```json
{
  "success": true,
  "data": {
    "voices": [
      {
        "id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Rachel",
        "language": "en",
        "gender": "female",
        "style": "general"
      },
      {
        "id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Domi",
        "language": "en",
        "gender": "female",
        "style": "general"
      }
    ],
    "total": 45
  }
}
```

**Voice Styles**:
Voice styles vary by ElevenLabs voice and may include:
- `professional` - Business, formal presentations
- `casual` - Friendly, relaxed conversations
- `narrative` - Storytelling, documentaries
- `educational` - Teaching, tutorials
- `dramatic` - Emotional, theatrical
- `friendly` - Warm, approachable
- `general` - Versatile, multi-purpose

### 4. Voice Synthesis with ElevenLabs

Generate high-quality audio from text with customizable voice parameters using ElevenLabs API.

**Endpoint**: `POST /api/v1/ai/synthesize-voice`

**Request**:
```json
{
  "text": "Welcome to our video. Today we'll explore the fascinating world of artificial intelligence.",
  "voice": "21m00Tcm4TlvDq8ikWAM",
  "language": "en",
  "speed": 1.0,
  "pitch": 0
}
```

**Parameters**:
- `text` (required): Text to convert to speech (1-5000 characters)
- `voice` (required): Voice ID from the voices endpoint
- `language` (required): Language code (en, es, fr, de, it, pt, ru, ja, ko, zh)
- `speed` (optional): Playback speed (0.5 to 2.0, default: 1.0)
- `pitch` (optional): Pitch adjustment (-20 to 20, default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/audio/abc123.mp3",
    "duration": 12
  }
}
```

**Features**:
- High-quality multilingual voice synthesis
- Automatic audio upload to cloud storage
- Duration estimation
- Configurable speed and pitch
- Support for 10+ languages

**Error Responses**:
```json
{
  "success": false,
  "error": "Voice synthesis service not configured. Please set ELEVENLABS_API_KEY in environment variables."
}
```

**Status**: ✅ Fully implemented and production-ready with ElevenLabs integration.

### 5. AI Services Status

Check availability of AI services.

**Endpoint**: `GET /api/v1/ai/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "imageGenerator": true,
    "scriptGenerator": true,
    "voiceSynthesis": true
  }
}
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Getting API Keys

**Gemini API Key**:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`

**ElevenLabs API Key**:
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account (includes 10,000 characters/month)
3. Go to your [Profile Settings](https://elevenlabs.io/speech-synthesis)
4. Copy your API key
5. Add to `.env` as `ELEVENLABS_API_KEY`

**Note**: Both services have generous free tiers suitable for development and testing.

## Subscription Plan Integration

AI features are gated by subscription plans:

### Free Plan
- No AI features available

### Starter Plan
- No AI features available

### Pro Plan
- ✅ AI Script Generator
- ✅ AI Voice Synthesis (ElevenLabs integration)
- ✅ Image prompt enhancement
- ✅ 10,000 voice synthesis characters/month
- ✅ Access to 40+ premium voices

### Enterprise Plan
- ✅ All Pro features
- ✅ Priority AI processing
- ✅ Unlimited voice synthesis
- ✅ Custom voice cloning (contact sales)
- ✅ Dedicated support

## Error Handling

All AI endpoints follow standard error format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common errors:
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Subscription plan doesn't include AI features
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - AI service error
- `503 Service Unavailable` - AI service not configured (missing API key)

## Rate Limiting

AI endpoints are rate-limited to prevent abuse:
- Free/Starter: N/A (no access)
- Pro: 100 requests/hour
- Enterprise: 1000 requests/hour

## Code Examples

### TypeScript/JavaScript

```typescript
// Generate image prompt
const response = await fetch('https://api.doodlio.com/api/v1/ai/generate-image-prompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    prompt: 'A serene mountain landscape',
    style: 'realistic'
  })
})

const data = await response.json()
console.log(data.data.enhancedPrompt)

// Generate script
const scriptResponse = await fetch('https://api.doodlio.com/api/v1/ai/generate-script', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    topic: 'Healthy Eating Tips',
    tone: 'casual',
    length: 'medium',
    style: 'conversational'
  })
})

const scriptData = await scriptResponse.json()
console.log(scriptData.data.script)
console.log(scriptData.data.scenes)

// List voices
const voicesResponse = await fetch('https://api.doodlio.com/api/v1/ai/voices?language=en', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

const voicesData = await voicesResponse.json()
console.log(voicesData.data.voices)

// Synthesize voice
const voiceSynthesisResponse = await fetch('https://api.doodlio.com/api/v1/ai/synthesize-voice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    text: 'Welcome to our video. Today we will explore the fascinating world of artificial intelligence.',
    voice: '21m00Tcm4TlvDq8ikWAM',
    language: 'en',
    speed: 1.0,
    pitch: 0
  })
})

const voiceData = await voiceSynthesisResponse.json()
console.log(`Audio URL: ${voiceData.data.audioUrl}`)
console.log(`Duration: ${voiceData.data.duration} seconds`)
```

### Python

```python
import requests

# Generate image prompt
response = requests.post(
    'https://api.doodlio.com/api/v1/ai/generate-image-prompt',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    json={
        'prompt': 'A serene mountain landscape',
        'style': 'realistic'
    }
)

data = response.json()
print(data['data']['enhancedPrompt'])

# Generate script
script_response = requests.post(
    'https://api.doodlio.com/api/v1/ai/generate-script',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    json={
        'topic': 'Healthy Eating Tips',
        'tone': 'casual',
        'length': 'medium',
        'style': 'conversational'
    }
)

script_data = script_response.json()
print(script_data['data']['script'])
print(script_data['data']['scenes'])

# Synthesize voice
voice_response = requests.post(
    'https://api.doodlio.com/api/v1/ai/synthesize-voice',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    json={
        'text': 'Welcome to our video. Today we will explore the fascinating world of artificial intelligence.',
        'voice': '21m00Tcm4TlvDq8ikWAM',
        'language': 'en',
        'speed': 1.0,
        'pitch': 0
    }
)

voice_data = voice_response.json()
print(f"Audio URL: {voice_data['data']['audioUrl']}")
print(f"Duration: {voice_data['data']['duration']} seconds")
```

## Advanced Usage

### Custom AI Providers

To add a new AI provider:

1. Create a new service implementing the appropriate interface:

```typescript
// src/infrastructure/services/ai/openai-script-generator.service.ts
import type { AIScriptGenerator } from '@/domain/interfaces/ai-service.interface'

export class OpenAIScriptGenerator implements AIScriptGenerator {
  name = 'openai'
  
  isAvailable(): boolean {
    // Check if configured
  }
  
  async generateScript(params) {
    // Implementation
  }
}
```

2. Update `ai.config.ts` to use the new provider:

```typescript
import { OpenAIScriptGenerator } from '../services/ai/openai-script-generator.service'

export const scriptGenerator = new OpenAIScriptGenerator(OPENAI_API_KEY)
```

The abstraction layer ensures all consumers of the script generator work without changes.

### Voice Synthesis Implementation

The API now includes ElevenLabs integration for high-quality voice synthesis. The implementation demonstrates best practices:

**Key Features**:
- ✅ Stream handling for efficient audio generation
- ✅ Automatic cloud upload integration
- ✅ Voice caching with 1-hour expiry
- ✅ Intelligent gender and language inference
- ✅ Configurable speed and pitch parameters

**Example Implementation** (already integrated):

```typescript
// src/infrastructure/services/ai/elevenlabs-voice-synthesis.service.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export class ElevenLabsVoiceSynthesis implements AIVoiceSynthesis {
  name = 'elevenlabs'
  private client: ElevenLabsClient
  
  async generateVoice(params) {
    const audioStream = await this.client.textToSpeech.convert(params.voice, {
      text: params.text,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75
      }
    })
    
    // Convert stream to buffer and upload
    const audioBuffer = await this.streamToBuffer(audioStream)
    const uploadResult = await uploadFile(audioBuffer, 'audio')
    
    return {
      success: true,
      audioUrl: uploadResult.url,
      duration: this.estimateDuration(params.text)
    }
  }
  
  async listVoices(language) {
    const response = await this.client.voices.getAll()
    return this.mapVoices(response.voices, language)
  }
}
```

To integrate a different TTS provider, follow the same pattern and implement the `AIVoiceSynthesis` interface.

## Best Practices

1. **Cache AI Responses**: Generated scripts and prompts can be cached to reduce API costs
2. **Cache Voice List**: The voice library is cached for 1 hour to optimize performance
3. **Validate Input**: Always validate user input before sending to AI services
4. **Handle Timeouts**: AI requests can take several seconds; implement proper timeout handling
5. **Monitor Usage**: Track AI service usage to stay within rate limits and budget
6. **Fallback Options**: Always provide manual alternatives if AI services are unavailable
7. **User Feedback**: Collect feedback on AI-generated content quality
8. **Text Optimization**: For voice synthesis, split long texts into smaller chunks for better performance
9. **Voice Selection**: Test different voices to find the best match for your content type

## Troubleshooting

### AI Services Unavailable

Check the status endpoint:
```bash
curl https://api.doodlio.com/api/v1/ai/status
```

If services are unavailable:
1. Verify `GEMINI_API_KEY` is set in environment
2. Check API key is valid and not expired
3. Verify internet connectivity
4. Check Gemini service status

### Poor Quality Results

For script generation:
- Provide more detailed `topic` descriptions
- Specify `targetAudience` for better personalization
- Try different `tone` and `style` combinations
- Experiment with `length` options

For image prompts:
- Use descriptive language in initial prompts
- Specify desired `style` explicitly
- Include details about mood, lighting, composition

For voice synthesis:
- Choose appropriate voice for content type (narrative, professional, etc.)
- Adjust speed for better comprehension (0.9-1.1 for most content)
- Keep text chunks under 5000 characters for optimal results
- Test pitch adjustments to match desired tone

### Rate Limit Exceeded

If you hit rate limits:
1. Upgrade subscription plan
2. Implement client-side caching
3. Batch requests where possible
4. Contact support for enterprise quotas

### Voice Synthesis Errors

Common voice synthesis issues:
- **"Voice synthesis service not configured"**: Set `ELEVENLABS_API_KEY` in environment
- **"Invalid voice ID"**: Fetch current voices from `/v1/ai/voices` endpoint
- **"Text too long"**: Split text into chunks of 5000 characters or less
- **"Rate limit exceeded"**: You've exceeded your ElevenLabs quota, upgrade or wait for reset

## Support

For AI features support:
- API Documentation: https://api.doodlio.com/docs
- Email: support@doodlio.com
- GitHub Issues: https://github.com/doodlio/doodlio-api/issues

## Changelog

### v1.1.0 (2025-10-26)
- ✨ **NEW**: ElevenLabs integration for voice synthesis
- ✨ **NEW**: Real-time voice fetching from ElevenLabs API
- ✨ **NEW**: High-quality multilingual text-to-speech
- ✨ Voice caching with 1-hour expiry
- ✨ Automatic gender and language inference
- ✨ Configurable speed and pitch parameters
- 🔧 Updated voice library endpoint to use ElevenLabs
- 📚 Enhanced documentation with voice synthesis examples

### v1.0.0 (2025-10-26)
- ✨ Added AI script generator with Gemini
- ✨ Added AI image prompt enhancement
- ✨ Added static voice library (50 voices, 10 languages)
- 🏗️ Implemented AI service abstraction layer
- 📚 Added comprehensive documentation
