# Migration Guide: v1.x to v2.0

## Overview

Version 2.0 introduces major enhancements to AI features and subscription pricing. This guide will help you migrate existing implementations to take advantage of new providers and features.

## Breaking Changes

### 1. Pricing Updates

**Before (v1.x):**
- Pro: €29/month (unlimited AI)
- Enterprise: €99/month (unlimited AI)

**After (v2.0):**
- Pro: €39/month (30 AI videos/month)
- Pro Plus: €59/month (100 AI videos/month + music) - NEW
- Enterprise: €149/month (250 AI videos/month)

**Action Required:**
1. Update Stripe price IDs in your environment variables
2. Communicate pricing changes to existing customers
3. Provide grandfather period (recommended: 3 months)

### 2. Environment Variables

**New Required Variables:**
```env
# New Stripe Price IDs
STRIPE_PRO_PLUS_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_PLUS_YEARLY_PRICE_ID=price_xxx

# Optional AI Provider Keys (add as needed)
OPENAI_API_KEY=your_openai_key        # For DALL-E image generation
MINIMAX_API_KEY=your_minimax_key      # For alternative voice synthesis
MUBERT_API_KEY=your_mubert_key        # For music generation
```

### 3. API Response Changes

#### Status Endpoint Enhanced

**Before:**
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

**After:**
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

**Action Required:**
- Update frontend to handle new `musicGenerator` field
- Optionally display available providers to users
- Add error handling for new music generation feature

#### Image Generation Endpoint Enhanced

**Before:**
```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "Detailed prompt text..."
  }
}
```

**After (with DALL-E configured):**
```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "Original prompt",
    "imageUrl": "https://oaidalleapiprodscus...",
    "provider": "dalle"
  }
}
```

**Action Required:**
- Check for `imageUrl` field to determine if direct image was generated
- Use `provider` field to display which service was used
- Update UI to display generated images directly

## New Features

### 1. Direct Image Generation

**New Endpoint:**
```typescript
POST /v1/ai/generate-image

// Request
{
  "prompt": "A futuristic city at sunset",
  "style": "realistic",
  "size": "1024x1024",
  "quality": "hd"
}

// Response
{
  "success": true,
  "data": {
    "imageUrl": "https://..."
  }
}
```

**Integration Example:**
```typescript
async function generateImage(prompt: string) {
  const response = await fetch('/api/v1/ai/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt,
      style: 'realistic',
      quality: 'hd'
    })
  })
  
  const data = await response.json()
  
  if (data.success) {
    return data.data.imageUrl
  }
  
  throw new Error(data.error)
}
```

### 2. Music Generation

**New Endpoint:**
```typescript
POST /v1/ai/generate-music

// Request
{
  "duration": 60,
  "mood": "inspiring",
  "genre": "cinematic",
  "tempo": "medium"
}

// Response
{
  "success": true,
  "data": {
    "audioUrl": "https://...",
    "duration": 60
  }
}
```

**Integration Example:**
```typescript
async function generateMusic(duration: number, mood: string) {
  const response = await fetch('/api/v1/ai/generate-music', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      duration,
      mood,
      genre: 'cinematic'
    })
  })
  
  const data = await response.json()
  
  if (data.success) {
    return data.data.audioUrl
  }
  
  throw new Error(data.error)
}
```

### 3. Multiple Voice Providers

The voice synthesis system now supports failover between providers.

**Updated Usage:**
```typescript
// Automatic provider selection (uses best available)
const voices = await fetch('/api/v1/ai/voices?language=en')

// Specific provider (optional)
const elevenlabsVoices = await fetch('/api/v1/ai/voices?language=en&provider=elevenlabs')
const minimaxVoices = await fetch('/api/v1/ai/voices?language=en&provider=minimax')
```

## Migration Steps

### Step 1: Update Dependencies

```bash
# Install new OpenAI SDK
npm install openai@^4.80.0
```

### Step 2: Update Environment

1. Copy new variables from `.env.example`
2. Add API keys for new providers (optional, but recommended)
3. Update Stripe price IDs

### Step 3: Database Migration

The subscription plans have been updated. No database schema changes required, but you need to:

1. Update existing Pro users to new pricing
2. Offer Pro Plus upgrade to power users
3. Communicate changes via email

**Recommended Communication:**

```
Subject: Important Update: New AI Features & Pricing

Hi [Name],

We're excited to announce major improvements to our AI features:

✨ NEW: Direct AI image generation (no more manual steps!)
✨ NEW: AI background music generation
✨ NEW: Faster, more reliable voice synthesis

To continue delivering high-quality AI features, we're updating our pricing:

Your Current Plan: Pro (€29/month)
New Pricing: Pro (€39/month) - 30 AI videos/month included

For the next 3 months, you'll keep your current price of €29/month.
After that, your plan will automatically update to €39/month.

Want more AI videos? Check out our new Pro Plus plan:
- €59/month
- 100 AI videos/month
- Includes AI music generation

Need Help? Reply to this email or visit our help center.

Thanks for being a valued customer!
```

### Step 4: Update Frontend

1. **Check Plan Features:**
```typescript
// Before
if (user.plan === 'pro') {
  // Enable AI features
}

// After
if (user.plan === 'pro' || user.plan === 'pro_plus' || user.plan === 'enterprise') {
  // Enable AI features
  
  // Check specific features
  if (user.plan === 'pro_plus' || user.plan === 'enterprise') {
    // Enable music generation
  }
}
```

2. **Handle Usage Limits:**
```typescript
// New: Track AI video usage
const usageResponse = await fetch('/api/v1/user/ai-usage')
const { videosUsed, videosLimit } = usageResponse.data

if (videosUsed >= videosLimit) {
  // Show upgrade prompt
  showUpgradeModal({
    message: `You've used ${videosUsed}/${videosLimit} AI videos this month.`,
    action: 'Upgrade to Pro Plus for 100 videos/month'
  })
}
```

3. **Update Pricing Page:**
```tsx
// Add Pro Plus plan
<PricingCard
  name="Pro Plus"
  price={59}
  features={[
    '100 AI videos/month',
    'AI music generation',
    'All Pro features',
    'Priority processing',
    '5 team members'
  ]}
  popular={true}
/>
```

### Step 5: Test New Features

1. Test image generation with DALL-E
2. Test music generation
3. Test voice synthesis failover
4. Test usage limit enforcement
5. Test upgrade flow

### Step 6: Monitor & Optimize

**Week 1:**
- Monitor API costs
- Track user feedback
- Check error rates

**Week 2-4:**
- Adjust limits based on actual usage
- Optimize provider selection
- Fine-tune pricing if needed

## Rollback Plan

If issues arise, you can rollback:

1. **Revert pricing config:**
```typescript
// src/infrastructure/config/subscription.config.ts
// Comment out Pro Plus plan
// Revert Pro and Enterprise prices to old values
```

2. **Disable new features:**
```env
# Remove new API keys
OPENAI_API_KEY=
MINIMAX_API_KEY=
MUBERT_API_KEY=
```

3. **Revert frontend changes**

4. **Communicate with users**

## Support

Need help with migration?
- Email: support@doodlio.com
- Slack: #migration-support
- Documentation: /docs/migration

## Timeline Recommendation

- **Week 1**: Internal testing
- **Week 2**: Beta testing with selected users
- **Week 3**: Gradual rollout (25% of users)
- **Week 4**: Full rollout
- **Month 2-3**: Grandfather period for existing users
- **Month 4**: Full transition complete

## FAQ

**Q: Will my existing Pro subscription continue to work?**
A: Yes, for 3 months you'll keep your current price. After that, the new pricing applies.

**Q: Do I need all the new API keys?**
A: No. OPENAI_API_KEY, MINIMAX_API_KEY, and MUBERT_API_KEY are optional. The system will work with just the original keys (GEMINI_API_KEY, ELEVENLABS_API_KEY).

**Q: What if I don't want to pay more?**
A: You can downgrade to Starter (€9/month) for manual workflow, or keep Pro at the new price with 30 AI videos/month included.

**Q: Can I mix providers?**
A: Yes! The system automatically selects the best available provider. You can also specify providers via API parameters.

**Q: What about API rate limits?**
A: Each provider has its own limits. The system automatically fails over to alternatives when limits are reached.
