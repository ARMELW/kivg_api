# Bring Your Own Keys (BYOK) Guide

## Overview

Doodlio allows users to bring their own API keys for external AI services instead of using the platform's credits. This gives you complete control over your AI usage and costs.

## Benefits of BYOK

1. **Cost Control**: Pay directly to AI providers based on your actual usage
2. **No Limits**: Use AI features without monthly limits
3. **Flexibility**: Choose which providers to use
4. **Affordable**: No expensive AI add-ons required

## Supported Providers

### 1. OpenAI (Image Generation)
- **Service**: DALL-E 3 for image generation
- **Cost**: ~$0.04 per image (standard) or $0.08 (HD)
- **Get API Key**: https://platform.openai.com/api-keys
- **Documentation**: https://platform.openai.com/docs/guides/images

### 2. ElevenLabs (Voice Synthesis)
- **Service**: High-quality AI voice synthesis
- **Cost**: ~$0.165 per minute of audio
- **Get API Key**: https://elevenlabs.io/
- **Documentation**: https://docs.elevenlabs.io/

### 3. Google Gemini (Script & Image Generation)
- **Service**: AI script writing and image generation
- **Cost**: Very affordable, mostly free for reasonable usage
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Documentation**: https://ai.google.dev/docs

### 4. MiniMax (Alternative Voice Synthesis)
- **Service**: AI voice synthesis (cheaper alternative to ElevenLabs)
- **Cost**: ~$0.1125 per minute (32% cheaper than ElevenLabs)
- **Get API Key**: Contact MiniMax directly
- **Documentation**: Check MiniMax documentation

### 5. Mubert (Music Generation)
- **Service**: AI-generated background music
- **Cost**: ~$0.25 per track
- **Get API Key**: https://mubert.com/
- **Documentation**: Check Mubert API documentation

## How to Configure Your API Keys

### Step 1: Obtain API Keys

Visit the provider's website and create an account:
1. Sign up for the service
2. Navigate to API settings
3. Generate a new API key
4. Copy the API key securely

### Step 2: Add Keys to Doodlio

#### Via Web Interface

1. Go to **Settings** > **API Keys**
2. Click **Add API Key**
3. Select the provider
4. Paste your API key
5. (Optional) Give it a friendly name
6. Click **Save**
7. Test the key by clicking **Validate**

#### Via API

```bash
# Save API key
curl -X POST https://api.doodlio.com/v1/user/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-...",
    "keyName": "My OpenAI Key"
  }'

# List your API keys (masked for security)
curl -X GET https://api.doodlio.com/v1/user/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN"

# Validate an API key
curl -X POST https://api.doodlio.com/v1/user/api-keys/openai/validate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete an API key
curl -X DELETE https://api.doodlio.com/v1/user/api-keys/openai \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Enable BYOK Mode

1. Go to **Settings** > **Subscription**
2. Toggle **Use My Own API Keys**
3. Your API keys will now be used instead of platform credits

## Security

### How We Protect Your API Keys

1. **Encryption**: All API keys are encrypted using AES-256-GCM before storage
2. **No Plain Text**: Keys are never stored or logged in plain text
3. **Access Control**: Only you can access your encrypted keys
4. **Secure Transmission**: All API requests use HTTPS/TLS
5. **Automatic Deletion**: Keys are permanently deleted when you remove them

### Best Practices

1. **Use Separate Keys**: Create dedicated API keys for Doodlio (don't reuse keys)
2. **Set Spending Limits**: Configure spending limits on provider platforms
3. **Monitor Usage**: Regularly check your usage on provider dashboards
4. **Rotate Keys**: Periodically regenerate and update your API keys
5. **Delete Unused Keys**: Remove keys you're no longer using

## Cost Comparison

### Traditional Subscription (Platform Credits)

| Plan | Price | AI Videos Included |
|------|-------|-------------------|
| Pro | €39/month | 30 videos |
| Pro Plus | €59/month | 100 videos |
| Enterprise | €149/month | 250 videos |

**Additional videos**: €0.75 - €1.50 each

### BYOK (Bring Your Own Keys)

| Plan | Price | AI Videos |
|------|-------|-----------|
| Free | €0 | Unlimited* |
| Starter | €5 | Unlimited* |
| Pro | €9 | Unlimited* |
| Enterprise | €49 | Unlimited* |

***Pay only for actual API usage to providers**

### Example Cost Calculation (BYOK)

For 100 AI videos per month:
- Script generation (Gemini): 100 × $0.001 = $0.10
- Voice synthesis (ElevenLabs): 100 × $0.248 = $24.80
- Image generation (OpenAI): 300 images × $0.04 = $12.00
- Music (optional, Mubert): 100 × $0.25 = $25.00

**Total**: ~$62/month (vs €59 Pro Plus subscription)

**Savings**: When you need fewer videos or use cheaper alternatives!

## Pricing Strategy

### When to Use Platform Credits
- You want predictable monthly costs
- You generate 30-100 videos regularly
- You prefer all-inclusive pricing
- You don't want to manage multiple API accounts

### When to Use BYOK
- You generate fewer than 30 videos/month
- You generate more than 100 videos/month
- You want to control costs directly
- You prefer pay-as-you-go pricing
- You already have API accounts with providers

## Troubleshooting

### API Key Validation Fails

**Problem**: Key validation returns "invalid"

**Solutions**:
1. Verify the key is copied correctly (no extra spaces)
2. Check the key hasn't been revoked on provider's platform
3. Ensure you have credits/billing set up with the provider
4. Confirm the key has the necessary permissions

### AI Features Not Working

**Problem**: Can't use AI features despite having keys configured

**Solutions**:
1. Ensure "Use My Own API Keys" is enabled in settings
2. Validate your API keys (green checkmark should appear)
3. Check your subscription plan allows API usage
4. Verify you have credits with the AI provider

### Rate Limiting

**Problem**: Getting rate limit errors

**Solutions**:
1. Check your provider's rate limits
2. Upgrade your plan with the provider
3. Wait a few minutes and try again
4. Contact provider support for limit increases

### Key Rotation

**Problem**: Need to update an API key

**Solutions**:
1. Generate new key on provider's platform
2. Save new key in Doodlio (overwrites old one)
3. Validate the new key
4. Revoke old key on provider's platform

## API Endpoints

### Authentication

All endpoints require authentication via Bearer token:
```
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Endpoints

#### Save/Update API Key
```
POST /v1/user/api-keys
Content-Type: application/json

{
  "provider": "openai|elevenlabs|gemini|minimax|mubert",
  "apiKey": "your-api-key",
  "keyName": "optional-friendly-name"
}
```

#### List API Keys
```
GET /v1/user/api-keys
```

Returns masked keys for security.

#### Validate API Key
```
POST /v1/user/api-keys/{provider}/validate
```

Tests if the API key works with the provider.

#### Delete API Key
```
DELETE /v1/user/api-keys/{provider}
```

Permanently removes the API key.

## FAQ

### Q: Are my API keys safe?
**A**: Yes. We use AES-256-GCM encryption and never store keys in plain text.

### Q: Can I use some providers from Doodlio and some with my own keys?
**A**: Yes! Configure only the keys you want to use. Missing keys will fall back to platform credits (if available).

### Q: What happens if my key runs out of credits?
**A**: API calls will fail. You'll need to add credits to your provider account.

### Q: Can I switch between BYOK and platform credits?
**A**: Yes! Toggle "Use My Own API Keys" in settings anytime.

### Q: Do I need all 5 API keys?
**A**: No. Configure only the services you want to use. For example, just OpenAI for images.

### Q: How much does BYOK cost?
**A**: BYOK itself is free. You only pay for your subscription plan and usage to AI providers.

### Q: Can I share API keys between team members?
**A**: No. Each user must configure their own keys. For teams, consider the Enterprise plan.

### Q: What if I exceed provider rate limits?
**A**: Requests will fail until limits reset. Upgrade your provider plan or wait for limit reset.

## Support

For issues with:
- **Doodlio BYOK**: Contact support@doodlio.com
- **API keys/providers**: Contact the respective provider's support
- **Billing**: Check with the provider for API usage charges

## Updates

This guide was last updated: 2025-10-27

For the latest information, visit our documentation at https://docs.doodlio.com
