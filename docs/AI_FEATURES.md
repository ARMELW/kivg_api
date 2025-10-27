# AI Features Documentation

## Overview

Doodlio API now includes comprehensive AI-powered features to automate video creation workflows. The implementation uses an abstraction layer that supports multiple AI providers for redundancy, cost optimization, and quality.

## Architecture

### Abstraction Layer

All AI services implement standard interfaces defined in `src/domain/interfaces/ai-service.interface.ts`. This allows:
- Easy provider switching (e.g., from Gemini to OpenAI, ElevenLabs to MiniMax)
- Consistent API across different AI services
- Simplified testing and mocking
- Cost optimization through provider selection
- Failover support for high availability

### Current Implementation

#### Image Generation
- **DALL-E 3** (Primary): Direct high-quality image generation
- **Gemini** (Fallback): Enhanced prompt generation for external services

#### Script Generation
- **Gemini Pro**: AI-powered script writing with scene breakdowns

#### Voice Synthesis
- **ElevenLabs** (Primary): Premium quality, 40+ voices, multilingual
- **MiniMax** (Alternative): Cost-effective alternative, 32% cheaper

#### Music Generation
- **Mubert**: AI-generated background music with mood and genre control

## Features

### 1. AI Image Generation (DALL-E 3)

Generate production-ready images directly with OpenAI's DALL-E 3.

**Endpoint**: `POST /api/v1/ai/generate-image`

**Request**:
```json
{
  "prompt": "A futuristic city at sunset",
  "style": "realistic",
  "size": "1024x1024",
  "quality": "hd"
}
```

**Parameters**:
- `prompt` (required): Description of the image to generate
- `style` (optional): `realistic` | `cartoon` | `anime` | `artistic` | `minimal`
- `size` (optional): `1024x1024` | `1024x1792` | `1792x1024` (default: `1024x1024`)
- `quality` (optional): `standard` | `hd` (default: `standard`)

**Response**:
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/..."
  }
}
```

**Features**:
- Photorealistic image generation
- Multiple aspect ratios for different use cases
- HD quality option for premium results
- Style-based prompt enhancement
- Direct download URLs

**Status**: ✅ Fully implemented with DALL-E 3 integration

**Cost**: 
- Standard quality: $0.04 per image
- HD quality: $0.08 per image

### 2. AI Image Prompt Enhancement

Legacy endpoint that works with both DALL-E and Gemini.

**Endpoint**: `POST /api/v1/ai/generate-image-prompt`

**Behavior**:
- With DALL-E configured: Returns actual generated image URL
- With Gemini configured: Returns enhanced prompt for external use

**Response**:
```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "Enhanced prompt text or original prompt",
    "imageUrl": "https://... (only if DALL-E is used)",
    "provider": "dalle" | "gemini"
  }
}
```

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
- Automatic failover to MiniMax if ElevenLabs unavailable

**Error Responses**:
```json
{
  "success": false,
  "error": "Voice synthesis service not configured. Please set ELEVENLABS_API_KEY or MINIMAX_API_KEY in environment variables."
}
```

**Status**: ✅ Fully implemented with ElevenLabs (primary) and MiniMax (alternative) integration.

**Providers**:
- **ElevenLabs**: Premium quality, 40+ voices
  - Free Tier: 10,000 characters/month
  - Starter: 30,000 characters/month ($5/month)
  - Creator: 100,000 characters/month ($22/month)
  - Pro: 500,000 characters/month ($99/month)
- **MiniMax**: Cost-effective alternative, ~32% cheaper
  - Pay-as-you-go pricing
  - 10+ voices per language
  - Good quality multilingual support

### 5. AI Music Generation (Mubert)

Generate AI-powered background music for videos with customizable mood, genre, and tempo.

**Endpoint**: `POST /api/v1/ai/generate-music`

**Request**:
```json
{
  "duration": 60,
  "mood": "inspiring",
  "genre": "cinematic",
  "tempo": "medium"
}
```

**Parameters**:
- `duration` (required): Music length in seconds (10-300)
- `mood` (optional): Music mood
  - `happy` - Upbeat, cheerful, positive
  - `sad` - Melancholic, emotional
  - `energetic` - Dynamic, powerful
  - `calm` - Peaceful, relaxing
  - `dramatic` - Epic, suspenseful
  - `inspiring` - Motivational, uplifting
  - `mysterious` - Enigmatic, atmospheric
  - `romantic` - Tender, intimate
- `genre` (optional): Music style
  - `electronic` - Synthesizers, digital sounds
  - `acoustic` - Organic instruments
  - `classical` - Orchestral arrangements
  - `ambient` - Atmospheric, background
  - `cinematic` - Film soundtrack style
  - `corporate` - Professional, background music
  - `pop` - Contemporary, mainstream
  - `rock` - Guitar-driven
- `tempo` (optional): `slow` | `medium` | `fast`

**Response**:
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://res.cloudinary.com/your-cloud/audio/upload/music/xyz789.mp3",
    "duration": 60
  }
}
```

**Features**:
- AI-generated royalty-free music
- Customizable mood, genre, and tempo
- Perfect sync with video duration
- High-quality audio output
- Automatic cloud storage upload
- No copyright issues

**Use Cases**:
- Background music for videos
- Intro/outro music
- Transition music between scenes
- Brand-consistent audio identity

**Status**: ✅ Fully implemented with Mubert API integration.

**Cost**: ~$0.25 per track generated

**Available in**: Pro Plus and Enterprise plans only

### 6. AI Services Status

Check availability of AI services and configured providers.

**Endpoint**: `GET /api/v1/ai/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "imageGenerator": true,
    "scriptGenerator": true,
    "voiceSynthesis": true,
    "musicGenerator": true,
    "providers": {
      "imageGenerators": ["dalle", "gemini"],
      "voiceProviders": ["elevenlabs", "minimax"],
      "scriptProviders": ["gemini"],
      "musicProviders": ["mubert"]
    }
  }
}
```

**Features**:
- Shows which AI services are available
- Lists all configured providers per service
- Useful for frontend to enable/disable features
- Helps with error handling and user messaging

## Configuration

### Environment Variables

Add to `.env`:

```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
MINIMAX_API_KEY=your_minimax_api_key_here
MUBERT_API_KEY=your_mubert_api_key_here
```

### Getting API Keys

**Gemini API Key** (Script generation):
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`
4. **Free tier**: 60 requests/minute

**ElevenLabs API Key** (Voice synthesis - primary):
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account (includes 10,000 characters/month)
3. Go to your [Profile Settings](https://elevenlabs.io/speech-synthesis)
4. Copy your API key
5. Add to `.env` as `ELEVENLABS_API_KEY`

**OpenAI API Key** (DALL-E image generation):
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env` as `OPENAI_API_KEY`
4. **Cost**: $0.04-$0.08 per image

**MiniMax API Key** (Voice synthesis - alternative):
1. Visit [MiniMax](https://api.minimax.chat/)
2. Sign up for an account
3. Get your API key from dashboard
4. Add to `.env` as `MINIMAX_API_KEY`
5. **Cost**: ~32% cheaper than ElevenLabs

**Mubert API Key** (Music generation):
1. Contact [Mubert](https://mubert.com/) for enterprise API access
2. Get your API key
3. Add to `.env` as `MUBERT_API_KEY`
4. **Cost**: ~$0.25 per track

**Note**: All services have trial options for development and testing.

## Subscription Plan Integration

AI features are gated by subscription plans with usage limits:

### Free Plan - €0/month
- ❌ No AI features available
- Manual workflow only

### Starter Plan - €9/month
- ❌ No AI features available
- Manual workflow with cloud storage

### Pro Plan - €39/month
- ✅ **30 AI videos/month included**
- ✅ AI Script Generator (unlimited)
- ✅ AI Voice Synthesis (ElevenLabs or MiniMax)
- ✅ Direct Image Generation (DALL-E 3)
- ✅ Image prompt enhancement (Gemini)
- ✅ Access to 40+ premium voices
- ✅ 10+ languages supported
- ❌ No music generation
- 💰 Additional videos: €1.50 each

### Pro Plus Plan - €59/month (NEW)
- ✅ **100 AI videos/month included**
- ✅ All Pro features
- ✅ **AI Music Generation** (Mubert)
- ✅ Priority AI processing
- ✅ Multiple provider options
- ✅ 5 team collaborators
- 💰 Additional videos: €1.00 each

### Enterprise Plan - €149/month
- ✅ **250 AI videos/month included**
- ✅ All Pro Plus features
- ✅ Priority AI processing (fastest)
- ✅ Multiple provider redundancy
- ✅ API access for automation
- ✅ Custom voice cloning (contact sales)
- ✅ Dedicated support
- ✅ SLA guarantee
- 💰 Additional videos: €0.75 each

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

// Synthesize voice with error handling
try {
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

  if (!voiceSynthesisResponse.ok) {
    throw new Error(`HTTP error! status: ${voiceSynthesisResponse.status}`)
  }

  const voiceData = await voiceSynthesisResponse.json()
  
  if (voiceData.success) {
    console.log(`Audio URL: ${voiceData.data.audioUrl}`)
    console.log(`Duration: ${voiceData.data.duration} seconds`)
  } else {
    console.error(`Voice synthesis failed: ${voiceData.error}`)
  }
} catch (error) {
  console.error(`Failed to synthesize voice: ${error.message}`)
}
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

# Handle response with error checking
if voice_response.status_code == 200:
    voice_data = voice_response.json()
    if voice_data['success']:
        print(f"Audio URL: {voice_data['data']['audioUrl']}")
        print(f"Duration: {voice_data['data']['duration']} seconds")
    else:
        print(f"Voice synthesis failed: {voice_data['error']}")
else:
    print(f"HTTP error: {voice_response.status_code}")
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
    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate voice'
      }
    }
  }
  
  async listVoices(language) {
    try {
      const response = await this.client.voices.getAll()
      return this.mapVoices(response.voices, language)
    } catch (error: any) {
      console.error('Failed to fetch ElevenLabs voices:', error)
      return []
    }
  }
}
```

To integrate a different TTS provider, follow the same pattern and implement the `AIVoiceSynthesis` interface with proper error handling.

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
- **"Voice synthesis service not configured"**: Set `ELEVENLABS_API_KEY` or `MINIMAX_API_KEY` in environment
- **"Invalid voice ID"**: Fetch current voices from `/v1/ai/voices` endpoint
- **"Text too long"**: Split text into chunks of 5000 characters or less
- **"Rate limit exceeded"**: You've exceeded your provider quota, upgrade or switch provider

### Music Generation Errors

Common music generation issues:
- **"Music generation service not configured"**: Set `MUBERT_API_KEY` in environment
- **"Duration too long"**: Maximum duration is 300 seconds (5 minutes)
- **"Generation failed"**: Check Mubert service status and API quota

### Image Generation Errors

Common image generation issues:
- **"Image generator not configured"**: Set `OPENAI_API_KEY` or `GEMINI_API_KEY` in environment
- **"Invalid size"**: Use supported sizes (1024x1024, 1024x1792, 1792x1024)
- **"Content policy violation"**: Modify prompt to comply with OpenAI content policy

## Support

For AI features support:
- API Documentation: https://api.doodlio.com/docs
- Email: support@doodlio.com
- GitHub Issues: https://github.com/doodlio/doodlio-api/issues

## Changelog

### v2.0.0 (2025-10-26) - Major AI Provider Update
- ✨ **NEW**: DALL-E 3 integration for direct image generation
- ✨ **NEW**: MiniMax voice synthesis as cost-effective alternative
- ✨ **NEW**: Mubert AI music generation
- ✨ **NEW**: Multi-provider support for redundancy and cost optimization
- ✨ **NEW**: Direct image generation endpoint `/v1/ai/generate-image`
- ✨ **NEW**: Music generation endpoint `/v1/ai/generate-music`
- 🎯 **NEW**: Pro Plus plan (€59/month) with 100 AI videos + music
- 💰 Updated pricing: Pro (€39), Pro Plus (€59), Enterprise (€149)
- 🔧 Enhanced status endpoint with provider information
- 🔧 Automatic failover between voice providers
- 📚 Comprehensive pricing strategy documentation
- 📚 Updated API documentation for all new features

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
