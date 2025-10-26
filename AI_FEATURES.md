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
- **Voice Synthesis**: Configuration ready (requires TTS service integration)

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

Access to 50+ voices across 10 languages for voice synthesis.

**Endpoint**: `GET /api/v1/ai/voices?language=en`

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
        "id": "en-male-1",
        "name": "James",
        "language": "en",
        "gender": "male",
        "style": "professional"
      },
      {
        "id": "en-female-1",
        "name": "Emma",
        "language": "en",
        "gender": "female",
        "style": "professional"
      }
    ],
    "total": 50
  }
}
```

**Voice Styles**:
- `professional` - Business, formal presentations
- `casual` - Friendly, relaxed conversations
- `narrative` - Storytelling, documentaries
- `educational` - Teaching, tutorials
- `dramatic` - Emotional, theatrical
- `friendly` - Warm, approachable

### 4. Voice Synthesis (Coming Soon)

Generate audio from text with customizable voice parameters.

**Endpoint**: `POST /api/v1/ai/synthesize-voice`

**Request** (planned):
```json
{
  "text": "Welcome to our video",
  "voice": "en-female-1",
  "language": "en",
  "speed": 1.0,
  "pitch": 0
}
```

**Status**: This endpoint returns 501 (Not Implemented). Integration with a TTS service (Google Cloud TTS, Azure TTS, or ElevenLabs) is required.

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
    "voiceSynthesis": false
  }
}
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting API Keys

**Gemini API Key**:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`

**Note**: Gemini has a generous free tier suitable for development and testing.

## Subscription Plan Integration

AI features are gated by subscription plans:

### Free Plan
- No AI features available

### Starter Plan
- No AI features available

### Pro Plan
- ✅ AI Script Generator
- ✅ AI Voice Synthesis (50 voices, 10 languages)
- ✅ Image prompt enhancement

### Enterprise Plan
- ✅ All Pro features
- ✅ Priority AI processing
- ✅ Custom voice training (contact sales)

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
- `501 Not Implemented` - Feature requires additional setup

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

### Integrating Voice Synthesis

To enable voice synthesis:

1. Choose a TTS provider (Google Cloud TTS, Azure TTS, ElevenLabs, etc.)
2. Implement the `AIVoiceSynthesis` interface
3. Update `ai.config.ts` with the implementation
4. Remove the 501 response from the synthesize-voice endpoint

Example with Google Cloud TTS:

```typescript
import textToSpeech from '@google-cloud/text-to-speech'

export class GoogleTTSVoiceSynthesis implements AIVoiceSynthesis {
  name = 'google-tts'
  private client: textToSpeech.TextToSpeechClient
  
  async generateVoice(params) {
    const request = {
      input: { text: params.text },
      voice: {
        languageCode: params.language,
        name: params.voice
      },
      audioConfig: { audioEncoding: 'MP3' }
    }
    
    const [response] = await this.client.synthesizeSpeech(request)
    // Save audio and return URL
  }
  
  async listVoices(language) {
    const [response] = await this.client.listVoices({ languageCode: language })
    return response.voices
  }
}
```

## Best Practices

1. **Cache AI Responses**: Generated scripts and prompts can be cached to reduce API costs
2. **Validate Input**: Always validate user input before sending to AI services
3. **Handle Timeouts**: AI requests can take several seconds; implement proper timeout handling
4. **Monitor Usage**: Track AI service usage to stay within rate limits and budget
5. **Fallback Options**: Always provide manual alternatives if AI services are unavailable
6. **User Feedback**: Collect feedback on AI-generated content quality

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

### Rate Limit Exceeded

If you hit rate limits:
1. Upgrade subscription plan
2. Implement client-side caching
3. Batch requests where possible
4. Contact support for enterprise quotas

## Support

For AI features support:
- API Documentation: https://api.doodlio.com/docs
- Email: support@doodlio.com
- GitHub Issues: https://github.com/doodlio/doodlio-api/issues

## Changelog

### v1.0.0 (2025-10-26)
- ✨ Added AI script generator with Gemini
- ✨ Added AI image prompt enhancement
- ✨ Added voice library (50 voices, 10 languages)
- 🏗️ Implemented AI service abstraction layer
- 📚 Added comprehensive documentation
