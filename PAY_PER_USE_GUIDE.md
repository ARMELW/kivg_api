# Pay-Per-Use Implementation Guide

## Overview

This document describes the pay-per-use billing system implemented for AI features in the Doodlio API. The system allows users to exceed their monthly AI video generation limits and pay for additional usage.

## Architecture

### Components

1. **AI Usage Tracking**: Tracks user's AI generation usage per month
2. **Stripe Integration**: Handles usage-based billing through Stripe
3. **Usage Limits**: Enforces plan-based limits with overage pricing
4. **API Endpoints**: Provides usage statistics and pricing information

## Database Schema

### `ai_usage` Table

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR NOT NULL,  -- Format: YYYY-MM
  video_generation_count INTEGER NOT NULL DEFAULT 0,
  script_generation_count INTEGER NOT NULL DEFAULT 0,
  image_generation_count INTEGER NOT NULL DEFAULT 0,
  voice_generation_count INTEGER NOT NULL DEFAULT 0,
  music_generation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Usage Limits by Plan

| Plan | AI Videos/Month | Overage Price |
|------|----------------|---------------|
| Free | 0 | N/A |
| Starter | 0 | N/A |
| Pro | 30 | €1.50/video |
| Pro Plus | 100 | €1.00/video |
| Enterprise | 250 | €0.75/video |

## API Endpoints

### Get Current Month Usage

```
GET /v1/ai-usage/current
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "month": "2025-10",
    "videoGenerationCount": 35,
    "scriptGenerationCount": 45,
    "imageGenerationCount": 120,
    "voiceGenerationCount": 50,
    "musicGenerationCount": 10,
    "planLimit": 30,
    "exceeded": true,
    "overage": 5,
    "overageCost": 7.50
  }
}
```

### Get Usage History

```
GET /v1/ai-usage/history?limit=12
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-10",
      "videoGenerationCount": 35,
      "scriptGenerationCount": 45,
      "imageGenerationCount": 120,
      "voiceGenerationCount": 50,
      "musicGenerationCount": 10
    },
    // ... more months
  ]
}
```

### Get Overage Pricing

```
GET /v1/ai-usage/pricing
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "pro",
    "pricePerVideo": 1.50,
    "currency": "EUR"
  }
}
```

## Usage Tracking

AI generation endpoints automatically track usage when the user is authenticated:

- `POST /v1/ai/generate-script` - Tracks script generation
- `POST /v1/ai/generate-image-prompt` - Tracks image generation
- `POST /v1/ai/generate-image` - Tracks image generation
- `POST /v1/ai/synthesize-voice` - Tracks voice generation
- `POST /v1/ai/generate-music` - Tracks music generation

## Stripe Integration

### Setup

1. Create metered prices for each plan:
```typescript
const stripeUsageBillingService = new StripeUsageBillingService(aiUsageRepository)
await stripeUsageBillingService.createMeteredPrice('pro')
await stripeUsageBillingService.createMeteredPrice('pro_plus')
await stripeUsageBillingService.createMeteredPrice('enterprise')
```

2. Add metered subscription items to user subscriptions

3. Report usage at the end of each billing period:
```typescript
await stripeUsageBillingService.reportUsageToStripe(
  userId,
  subscriptionItemId,
  subscriptionPlan
)
```

### Monthly Billing Cycle

1. Users generate AI content throughout the month
2. Usage is tracked in the `ai_usage` table
3. At the end of the billing period:
   - Calculate overage (usage - plan limit)
   - Report overage to Stripe
   - Stripe invoices the user for overages
4. Next month starts with fresh counters

## Implementation Details

### Usage Repository

The `AIUsageRepository` provides methods for tracking usage:

```typescript
// Increment counters
await aiUsageRepository.incrementVideoGeneration(userId, month)
await aiUsageRepository.incrementScriptGeneration(userId, month)
await aiUsageRepository.incrementImageGeneration(userId, month)
await aiUsageRepository.incrementVoiceGeneration(userId, month)
await aiUsageRepository.incrementMusicGeneration(userId, month)

// Get current usage
const usage = await aiUsageRepository.getCurrentMonthUsage(userId)

// Get history
const history = await aiUsageRepository.getUsageHistory(userId, 12)
```

### Billing Service

The `StripeUsageBillingService` handles billing logic:

```typescript
// Check if user exceeded limit
const { exceeded, overage } = await service.checkUsageLimit(userId, plan)

// Calculate overage cost
const cost = await service.calculateOverageCost(userId, plan)

// Report to Stripe
await service.reportUsageToStripe(userId, subscriptionItemId, plan)
```

## Cost Analysis

### Per-Video Cost Breakdown

**Basic AI Video** (script + voice + images):
- Script: ~€0.001
- Voice: ~€0.165/minute
- Images (3): ~€0.12
- **Total: ~€0.35**

**Full AI Video** (script + voice + images + music):
- Script: ~€0.001
- Voice: ~€0.165/minute
- Images (3): ~€0.12
- Music: ~€0.25
- **Total: ~€0.58**

### Margin Analysis

#### Pro Plan (€39/month, 30 videos, €1.50 overage)
- Base cost: 30 × €0.35 = €10.50
- Margin: €28.50 (73%)
- Overage margin: €1.15 per video (76%)

#### Pro Plus (€59/month, 100 videos, €1.00 overage)
- Base cost: 100 × €0.58 = €58
- Margin: €1 (2%)
- Overage margin: €0.42 per video (42%)

#### Enterprise (€149/month, 250 videos, €0.75 overage)
- Base cost: 250 × €0.58 = €145
- Margin: €4 (3%)
- Overage margin: €0.17 per video (23%)

## Testing

### Manual Testing

1. Create test user with Pro plan
2. Generate 31 AI videos (1 over limit)
3. Check usage endpoint shows overage of 1
4. Verify overage cost is €1.50
5. Simulate end-of-month billing
6. Verify Stripe receives usage record

### Unit Tests

```typescript
describe('StripeUsageBillingService', () => {
  it('should calculate overage correctly', async () => {
    // Test implementation
  })

  it('should report usage to Stripe', async () => {
    // Test implementation
  })
})
```

## Migration Guide

### Database Migration

```bash
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

### Environment Variables

Add to `.env`:
```
AUTOCONTENT_API_KEY=your_autocontent_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Deployment Steps

1. Deploy code changes
2. Run database migration
3. Create Stripe metered prices
4. Update existing subscriptions with metered items
5. Set up monthly billing job to report usage
6. Monitor usage and billing for first month

## Monitoring

### Key Metrics

- Total AI usage per user per month
- Overage rate (% users exceeding limits)
- Average overage per user
- Revenue from overages
- Cost vs revenue per plan

### Alerts

Set up alerts for:
- Users approaching their limits (90%)
- High overage rates (>50% of users)
- Stripe API failures
- Usage tracking failures

## Future Enhancements

1. **Usage Warnings**: Email users when approaching limits
2. **Prepaid Packs**: Allow users to purchase AI credits in advance
3. **Usage Dashboard**: Visual analytics for users
4. **Custom Limits**: Allow enterprise customers to set custom limits
5. **Bulk Discounts**: Tiered pricing for high-volume usage
6. **Usage Caps**: Allow users to set spending limits

## Support

For questions or issues with the pay-per-use system:
- Technical documentation: This file
- API documentation: `/docs` endpoint
- Support: Create an issue in the repository
