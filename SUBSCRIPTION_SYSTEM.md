# Subscription System Documentation

## Overview

The Doodlio API implements a flexible subscription system with 4 tiers and optional Bring Your Own Keys (BYOK) support. The system follows a hexagonal architecture pattern with clear separation between domain, application, and infrastructure layers.

## New Pricing Model (2025)

### Core Philosophy
- **Base subscription**: Pay for video creation capabilities (duration, quality, storage)
- **AI features**: Optional - either buy platform credits OR bring your own API keys
- **BYOK**: Use your own API keys with any plan (even Free!) - no monthly AI limits
- **Flexibility**: Choose what works best for your budget and usage

## Subscription Plans

### 1. Free Plan (Gratuit)
**Price**: €0/month (Always free)

**Features**:
- Unlimited 1-minute videos
- Unlimited scenes per project
- 720p export quality
- Watermark on exports
- Local storage only
- 1 audio track
- 50+ basic assets
- 10 fonts
- Forum support
- **BYOK support**: Use your own API keys for unlimited AI features

**Ideal for**: Beginners, students, testing, hobbyists who want to explore AI with their own keys

### 2. Starter Plan
**Price**: €5/month or €50/year (save €10)

**Features**:
- Unlimited 5-minute videos
- Unlimited scenes per project
- 1080p HD export (no watermark)
- Cloud storage (10 projects)
- 3 audio tracks
- 500+ assets
- 50+ premium fonts
- Email support (48h response)
- YouTube thumbnail creator
- **BYOK support**: Use your own API keys for unlimited AI features

**Ideal for**: Content creators, YouTubers, solo entrepreneurs

### 3. Pro Plan
**Price**: €9/month or €90/year (save €18)

**Features**:
- Unlimited video duration
- Unlimited scenes
- 4K Ultra HD export
- Unlimited cloud storage
- Unlimited audio tracks
- 2000+ assets
- All fonts
- Collaboration (3 members)
- Priority support (24h response)
- Professional templates
- **BYOK support**: Use your own API keys for unlimited AI features

**AI Add-on Options**:
- Platform credits available for purchase (optional)
- Or use your own API keys (BYOK) for free

**Ideal for**: Professional content creators, established YouTubers, trainers

### 4. Enterprise Plan
**Price**: €49/month or €490/year (save €98)

**Features**:
- All Pro features
- Unlimited team members
- SSO (Single Sign-On)
- Custom branding
- Dedicated support
- API access
- SLA guarantee (99.9% uptime)
- On-site training
- Custom templates
- Unlimited assets
- Priority processing
- **BYOK support**: Use your own API keys or platform credits

**Ideal for**: Large companies, agencies, educational institutions

## Bring Your Own Keys (BYOK)

### What is BYOK?

BYOK allows you to use your own API keys from AI providers instead of purchasing platform credits. This gives you:

- **Cost Control**: Pay directly to providers based on actual usage
- **No Monthly Limits**: Use AI features as much as you need
- **Flexibility**: Choose which providers to use
- **Works with Any Plan**: Even Free plan users can use AI with their own keys!

### Supported Providers

1. **OpenAI** - Image generation (DALL-E 3)
2. **ElevenLabs** - Voice synthesis (high quality)
3. **Google Gemini** - Script generation & image generation
4. **MiniMax** - Voice synthesis (cheaper alternative)
5. **Mubert** - Music generation

### How to Use BYOK

1. Obtain API keys from the providers you want to use
2. Add them to your Doodlio account via Settings > API Keys
3. Enable "Use My Own API Keys" toggle
4. Start using AI features with no monthly limits!

See [BYOK_GUIDE.md](./BYOK_GUIDE.md) for detailed instructions.

## Cost Comparison

### Traditional Model (Old Pricing)
- Pro: €39/month for 30 AI videos
- Pro Plus: €59/month for 100 AI videos
- Enterprise: €149/month for 250 AI videos

### New Flexible Model

**Option 1: Base Subscription Only (No AI)**
- Free: €0/month
- Starter: €5/month
- Pro: €9/month
- Enterprise: €49/month

**Option 2: Base + BYOK**
- Any plan + your own API keys
- Pay providers directly for usage
- No monthly AI limits
- Example: Pro plan (€9) + ~€0.37 per AI video = Total control

**Option 3: Base + Platform Credits (Coming Soon)**
- Purchase AI credits as needed
- Pay-as-you-go pricing
- No commitment

## Environment Configuration

Add these variables to your `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/doodlio_db?search_path=public

# Encryption (for storing user API keys securely)
ENCRYPTION_KEY=your-secure-32-byte-encryption-key-change-in-production

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Stripe Price IDs (Updated for new pricing)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxx

# AI Services (Platform Keys - Optional if users use BYOK)
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENAI_API_KEY=your_openai_api_key
MINIMAX_API_KEY=your_minimax_api_key
MUBERT_API_KEY=your_mubert_api_key
```

**Important**: 
- `ENCRYPTION_KEY` must be exactly 32 bytes for AES-256 encryption
- AI service keys are optional if all users use BYOK
- Generate a secure random key for `ENCRYPTION_KEY` in production

## Database Setup

Run the migration to add subscription features:

```bash
# Apply the migration
bun run db:migrate

# Or if you prefer to use the SQL directly
psql -d your_database < drizzle/0002_add_subscription_plan_and_billing.sql
```

This adds:
- `subscription_plan` column to `users` table
- `billing_history` table for invoice tracking

## API Endpoints

### Pricing Endpoints

#### Get All Plans
```
GET /api/v1/pricing/plans
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "title": "Gratuit",
      "description": "Découverte - Démarrez sans risque",
      "prices": {
        "monthly": 0,
        "yearly": 0
      },
      "features": {
        "maxScenes": 3,
        "maxDuration": 60,
        "exportQuality": "720p",
        "hasWatermark": true,
        ...
      }
    },
    ...
  ]
}
```

#### Get Specific Plan
```
GET /api/v1/pricing/plans/{planId}
```

Parameters:
- `planId`: free, starter, pro, or enterprise

#### Get Billing History (Authenticated)
```
GET /api/v1/pricing/billing-history?page=1&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "amount": 900,
        "currency": "eur",
        "status": "paid",
        "plan": "starter",
        "interval": "monthly",
        "invoiceUrl": "https://...",
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Subscription Endpoints (Already Existing)

#### Create Subscription
```
POST /api/v1/subscription/create
```

**Request**:
```json
{
  "priceId": "price_xxx",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

#### Get Subscription Status
```
GET /api/v1/subscription/status
```

#### Change Subscription Plan
```
POST /api/v1/subscription/change
```

**Request**:
```json
{
  "newPriceId": "price_xxx"
}
```

#### Cancel Subscription
```
POST /api/v1/subscription/cancel
```

### User API Keys Endpoints (BYOK)

#### Save/Update API Key
```
POST /v1/user/api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "openai|elevenlabs|gemini|minimax|mubert",
  "apiKey": "your-api-key",
  "keyName": "Optional friendly name"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "openai",
    "maskedKey": "****abcd",
    "isActive": true
  }
}
```

#### Get All User API Keys
```
GET /v1/user/api-keys
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "openai",
      "maskedKey": "****abcd",
      "isActive": true,
      "lastValidated": "2025-10-27T10:00:00Z",
      "validationStatus": "valid",
      "keyName": "My OpenAI Key",
      "createdAt": "2025-10-20T10:00:00Z",
      "updatedAt": "2025-10-27T10:00:00Z"
    }
  ]
}
```

#### Validate API Key
```
POST /v1/user/api-keys/{provider}/validate
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "provider": "openai",
    "isValid": true,
    "message": "OpenAI API key is valid"
  }
}
```

#### Delete API Key
```
DELETE /v1/user/api-keys/{provider}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

## Feature Limit Enforcement

### Middleware Usage

Apply middlewares to routes that need limit enforcement:

```typescript
import {
  checkSceneLimit,
  checkDurationLimit,
  checkExportQuality,
  checkStorageLimit,
  checkAudioTracksLimit,
  checkAIFeatureAccess
} from '@/infrastructure/middlewares/plan-limits.middleware'

// Example: Protect scene creation
app.post('/api/v1/projects/:projectId/scenes', 
  authMiddleware,
  checkSceneLimit,
  sceneController.create
)

// Example: Protect video export
app.post('/api/v1/exports',
  authMiddleware,
  checkDurationLimit,
  checkExportQuality,
  exportController.create
)

// Example: Protect AI features
app.post('/api/v1/ai/generate-voice',
  authMiddleware,
  checkAIFeatureAccess,
  aiController.generateVoice
)
```

### Available Middlewares

1. **checkSceneLimit**: Validates scene count per project
2. **checkDurationLimit**: Validates video duration
3. **checkExportQuality**: Enforces export quality limits (720p/1080p/4K)
4. **checkStorageLimit**: Manages cloud storage access
5. **checkAudioTracksLimit**: Limits number of audio tracks
6. **checkAIFeatureAccess**: Controls access to AI features

### Use Cases

For business logic validation:

```typescript
import { ValidateSceneLimitUseCase } from '@/application/use-cases/subscription/validate-scene-limit.use-case'
import { ValidateDurationLimitUseCase } from '@/application/use-cases/subscription/validate-duration-limit.use-case'

// Validate scene limit
const validateSceneLimit = new ValidateSceneLimitUseCase()
const result = await validateSceneLimit.execute({
  userId: user.id,
  subscriptionPlan: user.subscriptionPlan || 'free',
  currentSceneCount: 5
})

if (!result.canAddScene) {
  return { error: result.error }
}

// Validate duration limit
const validateDuration = new ValidateDurationLimitUseCase()
const durationResult = await validateDuration.execute({
  userId: user.id,
  subscriptionPlan: user.subscriptionPlan || 'free',
  videoDuration: 300 // 5 minutes in seconds
})

if (!durationResult.isValid) {
  return { error: durationResult.error }
}
```

## Helper Functions

### Subscription Config Helpers

```typescript
import { 
  getPlanById, 
  hasFeature, 
  getFeatureLimit, 
  isFeatureUnlimited 
} from '@/infrastructure/config/subscription.config'

// Get plan details
const plan = getPlanById('pro')

// Check if plan has a feature
const hasAI = hasFeature('pro', 'hasAIVoice') // true

// Get feature limit
const maxScenes = getFeatureLimit('starter', 'maxScenes') // 10

// Check if feature is unlimited
const isUnlimited = isFeatureUnlimited('pro', 'maxScenes') // true
```

## OAuth Integration

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Add callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`
4. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`

### Frontend Integration

```typescript
// Sign in with Google
const signInWithGoogle = async () => {
  window.location.href = `${API_URL}/api/auth/signin/google`
}

// Sign in with GitHub
const signInWithGitHub = async () => {
  window.location.href = `${API_URL}/api/auth/signin/github`
}
```

## Stripe Integration

### Setup

1. Create products and prices in Stripe Dashboard
2. Copy price IDs to environment variables
3. Set up webhook endpoint: `{API_URL}/api/stripe/webhook`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Webhook Events (Already Handled)

The system handles these Stripe events:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Billing History

The `billing_history` table tracks all invoices and payments:

```typescript
interface BillingHistory {
  id: string
  userId: string
  stripeInvoiceId?: string
  stripePaymentIntentId?: string
  amount: number // in cents
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  plan: string
  interval?: 'monthly' | 'yearly'
  invoiceUrl?: string
  pdfUrl?: string
  metadata?: Record<string, any>
  createdAt: Date
}
```

## Upgrade Prompts

When a user exceeds their plan limits, the API returns structured error responses:

```json
{
  "success": false,
  "error": "Your starter plan only supports 1080p exports. Please upgrade to export in 4k.",
  "upgradeRequired": true,
  "currentPlan": "starter",
  "allowedQuality": "1080p"
}
```

Frontend should display upgrade modals based on `upgradeRequired` flag.

## Testing

### Test Subscription Flow

```bash
# Start the server
bun run dev

# Test pricing endpoint
curl http://localhost:3000/api/v1/pricing/plans

# Test authenticated endpoints (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/pricing/billing-history
```

### Stripe Test Mode

Use Stripe test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0027 6000 3184

## Architecture

```
src/
├── domain/
│   ├── models/
│   │   └── billing-history.model.ts
│   ├── repositories/
│   │   └── billing-history.repository.interface.ts
│   └── types/
│       └── subscription.type.ts
├── application/
│   └── use-cases/
│       ├── billing/
│       │   └── get-billing-history.use-case.ts
│       └── subscription/
│           ├── validate-scene-limit.use-case.ts
│           └── validate-duration-limit.use-case.ts
├── infrastructure/
│   ├── config/
│   │   ├── subscription.config.ts
│   │   └── auth.config.ts
│   ├── controllers/
│   │   ├── pricing.controller.ts
│   │   └── subscription.controller.ts
│   ├── middlewares/
│   │   └── plan-limits.middleware.ts
│   ├── repositories/
│   │   └── billing-history.repository.ts
│   └── database/
│       └── schema/
│           └── schema.ts
```

## Best Practices

1. **Always validate limits server-side** - Never trust client-side validation
2. **Show upgrade prompts gracefully** - Use the structured error responses
3. **Cache plan data** - Subscription config is static, cache it
4. **Log billing events** - Use the activity logging system
5. **Test webhook handlers** - Use Stripe CLI for local testing
6. **Handle failed payments** - Implement grace periods and retries

## Troubleshooting

### OAuth not working
- Verify callback URLs match exactly
- Check environment variables are loaded
- Ensure OAuth apps are not in development mode

### Limits not enforced
- Check user has `subscriptionPlan` field set
- Verify middleware is applied to routes
- Check database has latest migration

### Stripe webhooks failing
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Support

For issues or questions:
- Check API documentation: http://localhost:3000/docs
- Review Better Auth docs: https://www.better-auth.com
- Stripe docs: https://stripe.com/docs

## License

This subscription system is part of the Doodlio API project.
