# AutoContentAPI Integration Guide

## Overview

This document describes the integration of AutoContentAPI as the primary script generation provider for Doodlio API, replacing NotebookLM (which doesn't have a public API for script generation).

## Why AutoContentAPI?

**NotebookLM** is a great tool from Google, but:
- No public API for direct script generation
- Primarily focused on document management
- API limited to notebook/document operations

**AutoContentAPI** provides:
- Dedicated API for content generation
- Video script generation capabilities
- Podcast and audio content generation
- Multi-language support
- Multi-voice capabilities
- RESTful API integration

## Architecture

### Provider Hierarchy

1. **Primary**: AutoContentAPI (if `AUTOCONTENT_API_KEY` is set)
2. **Fallback**: Gemini (if `GEMINI_API_KEY` is set)

This ensures backward compatibility while allowing users to choose their preferred provider.

## Setup

### Environment Variables

Add to `.env`:
```env
AUTOCONTENT_API_KEY=your_autocontent_api_key
```

### Configuration

The AI config automatically selects the provider:

```typescript
// src/infrastructure/config/ai.config.ts
export const autoContentScriptGenerator = AUTOCONTENT_API_KEY
  ? new AutoContentScriptGenerator(AUTOCONTENT_API_KEY)
  : null

export const geminiScriptGenerator = GEMINI_API_KEY 
  ? new GeminiScriptGenerator(GEMINI_API_KEY)
  : null

// Primary script generator (prefer AutoContentAPI, fallback to Gemini)
export const scriptGenerator = autoContentScriptGenerator || geminiScriptGenerator
```

## API Integration

### AutoContentScriptGenerator Service

The service implements the `AIScriptGenerator` interface:

```typescript
export class AutoContentScriptGenerator implements AIScriptGenerator {
  name = 'autocontent'
  private apiKey: string
  private baseUrl = 'https://api.autocontentapi.com/v1'

  async generateScript(params: AIScriptGeneratorParams): Promise<AIScriptGeneratorResponse> {
    // Implementation
  }
}
```

### Request Format

```typescript
const requestPayload = {
  content: params.topic,
  instructions: `Generate a ${params.length} video script...`,
  format: 'script',
  voice_settings: {
    tone: params.tone,
    style: params.style
  }
}
```

### Response Processing

The service:
1. Calls AutoContentAPI endpoint
2. Parses the JSON response
3. Breaks script into scenes
4. Estimates duration for each scene
5. Generates image prompts for visuals

## Features

### Script Generation Parameters

```typescript
{
  topic: string                    // Main topic/subject
  tone?: 'professional' | 'casual' | 'educational' | 'entertaining' | 'inspiring'
  length?: 'short' | 'medium' | 'long'  // 30s, 1-2min, 3-5min
  style?: 'narrative' | 'conversational' | 'instructional'
  targetAudience?: string          // Optional audience specification
}
```

### Scene Structure

Each generated scene includes:

```typescript
{
  id: string           // scene-1, scene-2, etc.
  text: string         // Scene narration text
  duration: number     // Estimated duration in seconds
  imagePrompt?: string // Visual description for the scene
  notes?: string       // Additional notes (opening, closing, etc.)
}
```

### Duration Estimation

Based on average speaking pace:
- **Words per minute**: 150
- **Words per second**: 2.5
- Duration calculated from word count in scene text

### Length Guidelines

| Length | Duration | Approximate Words |
|--------|----------|------------------|
| Short | 30 seconds | 75-90 words |
| Medium | 1-2 minutes | 150-300 words |
| Long | 3-5 minutes | 450-750 words |

## Usage Example

### Generate a Script

```typescript
POST /v1/ai/generate-script
Authorization: Bearer <token>

{
  "topic": "Introduction to Solar Energy",
  "tone": "educational",
  "length": "medium",
  "style": "instructional",
  "targetAudience": "high school students"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "script": "Full script text here...",
    "scenes": [
      {
        "id": "scene-1",
        "text": "Solar energy is one of the most...",
        "duration": 15,
        "imagePrompt": "Visual representation for: Solar energy is one of the most...",
        "notes": "Opening scene"
      },
      {
        "id": "scene-2",
        "text": "The sun produces an enormous...",
        "duration": 20,
        "imagePrompt": "Visual representation for: The sun produces an enormous..."
      },
      {
        "id": "scene-3",
        "text": "In conclusion, solar energy...",
        "duration": 12,
        "imagePrompt": "Visual representation for: In conclusion, solar energy...",
        "notes": "Closing scene"
      }
    ]
  }
}
```

## Provider Status

Check which provider is active:

```
GET /v1/ai/status
```

Response shows available providers:
```json
{
  "success": true,
  "data": {
    "scriptGenerator": true,
    "providers": {
      "scriptProviders": ["autocontent", "gemini"]
    }
  }
}
```

## Error Handling

### Common Errors

1. **Missing API Key**
   ```json
   {
     "success": false,
     "error": "Script generator not configured"
   }
   ```

2. **API Request Failed**
   ```json
   {
     "success": false,
     "error": "AutoContentAPI request failed with status 429"
   }
   ```

3. **Invalid Response**
   ```json
   {
     "success": false,
     "error": "Failed to parse script response"
   }
   ```

### Fallback Behavior

If AutoContentAPI fails and Gemini is available:
1. Request fails with AutoContentAPI error
2. User can manually retry (system doesn't auto-fallback to preserve explicit provider choice)
3. Admin can switch provider by updating environment variables

## Cost Comparison

### AutoContentAPI Pricing
- Pay-per-use model
- Varies by content length and features
- Typically $0.01-0.05 per script generation

### Gemini Pricing
- Free tier: 60 requests/minute
- After free tier: ~$0.001 per request
- More limited in script structure

## Migration from Gemini

### Before (Gemini Only)
```env
GEMINI_API_KEY=your_gemini_key
```

### After (AutoContentAPI Primary)
```env
GEMINI_API_KEY=your_gemini_key     # Fallback
AUTOCONTENT_API_KEY=your_autocontent_key  # Primary
```

### No Code Changes Required
The system automatically uses AutoContentAPI when the key is present, maintaining backward compatibility with existing code.

## Testing

### Test AutoContentAPI Integration

```bash
# Set environment variable
export AUTOCONTENT_API_KEY=your_test_key

# Start server
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/v1/ai/generate-script \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test Script",
    "length": "short",
    "tone": "casual"
  }'
```

### Verify Provider

```bash
curl http://localhost:3000/v1/ai/status
```

Should show `"autocontent"` in `scriptProviders`.

## Best Practices

1. **Always set both keys**: Configure both AutoContentAPI and Gemini for redundancy
2. **Monitor usage**: Track API costs and usage patterns
3. **Cache results**: Consider caching generated scripts to reduce API calls
4. **Handle errors gracefully**: Always check `success` field in responses
5. **Test in staging**: Verify AutoContentAPI integration before production deployment

## Troubleshooting

### AutoContentAPI Not Being Used

**Check:**
1. `AUTOCONTENT_API_KEY` is set in environment
2. Server was restarted after setting the variable
3. Check `/v1/ai/status` shows `autocontent` in providers
4. Verify API key is valid

### Script Generation Failing

**Debug Steps:**
1. Check AutoContentAPI dashboard for API status
2. Verify API key permissions and quotas
3. Test with simple topic first
4. Check error messages in server logs
5. Test Gemini fallback by temporarily removing AutoContentAPI key

### Quality Issues

**If generated scripts aren't meeting quality expectations:**
1. Provide more detailed `targetAudience` information
2. Use more specific topic descriptions
3. Adjust `tone` and `style` parameters
4. Consider using Gemini for certain types of content
5. Provide feedback to AutoContentAPI support

## API Documentation

For detailed AutoContentAPI documentation, visit:
https://docs.autocontentapi.com

## Support

- AutoContentAPI Issues: https://autocontentapi.com/support
- Doodlio API Issues: Create an issue in the repository
- Integration Questions: Check this documentation or API docs

## Future Enhancements

1. **A/B Testing**: Compare AutoContentAPI vs Gemini quality
2. **Custom Templates**: Allow users to specify script templates
3. **Multi-language**: Expand support for non-English scripts
4. **Voice Matching**: Match script tone to available voice options
5. **Quality Scoring**: Rate generated scripts for continuous improvement
