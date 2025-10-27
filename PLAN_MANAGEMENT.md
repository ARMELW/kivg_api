# Plan Management System

## Overview

The Plan Management System provides a complete CRUD API for managing subscription plans dynamically. It integrates seamlessly with Better Auth's Stripe plugin and allows administrators to create, update, and manage subscription plans with automatic Stripe synchronization.

## Architecture

### Domain Layer

**Models** (`src/domain/models/plan.model.ts`):
- `Plan`: Complete plan model with all fields
- `PlanFeatures`: Comprehensive feature set (limits, capabilities, AI features)
- `PlanPricing`: Monthly and yearly pricing structure
- `CreatePlanDTO`: Data transfer object for plan creation
- `UpdatePlanDTO`: Data transfer object for plan updates

**Repository Interface** (`src/domain/repositories/plan.repository.interface.ts`):
- `findById`: Get plan by ID
- `findBySlug`: Get plan by slug
- `findAll`: Get all plans with optional filters
- `create`: Create new plan
- `update`: Update existing plan
- `delete`: Soft delete plan
- `slugExists`: Check if slug is unique
- `findByStripePriceId`: Find plan by Stripe price ID (for webhook handling)

### Application Layer

**Use Cases** (`src/application/use-cases/plan/`):
- `CreatePlanUseCase`: Create plans with slug validation
- `GetAllPlansUseCase`: List plans with filtering
- `GetPlanByIdUseCase`: Get single plan details
- `UpdatePlanUseCase`: Update plans with conflict checking
- `DeletePlanUseCase`: Soft delete plans

**Services** (`src/application/services/`):
- `StripePlanSyncService`: Sync plans with Stripe (create/update products and prices)

### Infrastructure Layer

**Repository** (`src/infrastructure/repositories/plan.repository.ts`):
- Implements `PlanRepositoryInterface`
- Uses Drizzle ORM for database operations
- Handles JSONB features and metadata

**Controller** (`src/infrastructure/controllers/plan.controller.ts`):
- Public endpoints for listing plans
- Admin endpoints for CRUD operations
- Stripe sync endpoints

**Database Schema** (`src/infrastructure/database/schema/schema.ts`):
- `plans` table with all plan fields
- JSONB for flexible features storage
- Stripe integration fields

## API Endpoints

### Public Endpoints

#### GET /v1/plans
Get all active and public plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Pro",
      "slug": "pro",
      "description": "Professional plan",
      "pricing": {
        "monthly": 900,
        "yearly": 9000
      },
      "features": {
        "maxScenes": -1,
        "maxDuration": -1,
        "exportQuality": "4k",
        ...
      },
      "isActive": true,
      "isPublic": true,
      "sortOrder": 2
    }
  ]
}
```

#### GET /v1/plans/{id}
Get specific plan details.

**Parameters:**
- `id` (path): Plan UUID

**Response:** Same as above but single plan object

### Admin Endpoints

All admin endpoints require:
- Authentication (Bearer token)
- Admin or super_admin role

#### GET /v1/admin/plans
Get all plans including inactive ones.

**Query Parameters:**
- `isActive` (optional): Filter by active status ("true" or "false")
- `isPublic` (optional): Filter by public status ("true" or "false")

**Response:** Array of plans

#### POST /v1/admin/plans
Create a new plan.

**Request Body:**
```json
{
  "name": "Enterprise",
  "slug": "enterprise",
  "description": "Enterprise plan for large teams",
  "isActive": true,
  "isPublic": true,
  "sortOrder": 3,
  "pricing": {
    "monthly": 4900,
    "yearly": 49000
  },
  "features": {
    "maxScenes": -1,
    "maxDuration": -1,
    "exportQuality": "4k",
    "hasWatermark": false,
    "storageType": "cloud",
    "cloudProjectsLimit": -1,
    "maxAudioTracks": -1,
    "assetsLibrarySize": -1,
    "customFonts": -1,
    "hasAIVoice": true,
    "hasAIScriptGenerator": true,
    "hasAIImageGenerator": true,
    "hasAIMusic": true,
    "aiVideoLimit": -1,
    "maxCollaborators": -1,
    "supportLevel": "premium_4h",
    "hasTemplates": true,
    "hasBranding": true,
    "hasAPI": true,
    "hasSSO": true,
    "hasDedicatedSupport": true,
    "hasCustomBranding": true,
    "hasSLA": true
  },
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...plan fields
  }
}
```

#### PUT /v1/admin/plans/{id}
Update an existing plan.

**Parameters:**
- `id` (path): Plan UUID

**Request Body:** Partial plan object (only fields to update)

**Response:** Updated plan object

#### DELETE /v1/admin/plans/{id}
Soft delete a plan (sets isActive to false).

**Parameters:**
- `id` (path): Plan UUID

**Response:**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

#### POST /v1/admin/plans/{id}/sync-stripe
Sync a single plan with Stripe.

**Parameters:**
- `id` (path): Plan UUID

**Description:**
- Creates or updates Stripe product
- Creates or updates monthly/yearly prices
- Updates plan with Stripe IDs

**Response:**
```json
{
  "success": true,
  "data": {
    "stripeProductId": "prod_xxx",
    "stripePriceIdMonthly": "price_xxx",
    "stripePriceIdYearly": "price_xxx"
  }
}
```

#### POST /v1/admin/plans/sync-all-stripe
Sync all active plans with Stripe.

**Description:**
Bulk sync all active plans to Stripe.

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 4,
    "failed": 0,
    "errors": []
  }
}
```

## Database Schema

### plans Table

```sql
CREATE TABLE "plans" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_public" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "price_monthly" integer DEFAULT 0 NOT NULL,  -- in cents
  "price_yearly" integer DEFAULT 0 NOT NULL,   -- in cents
  "features" jsonb NOT NULL,
  "stripe_product_id" text,
  "stripe_price_id_monthly" text,
  "stripe_price_id_yearly" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
```

## Seeding Plans

A seed script is provided to populate plans from the existing `subscription.config.ts`:

```bash
tsx drizzle/seed-plans.ts
```

This script:
1. Checks if plans already exist
2. Converts existing pricing data to plan format
3. Inserts plans with proper structure
4. Converts prices from EUR to cents

## Stripe Integration

### Automatic Sync

The `StripePlanSyncService` handles Stripe synchronization:

1. **Product Creation/Update:**
   - Creates Stripe product with plan metadata
   - Updates existing products if needed

2. **Price Management:**
   - Creates monthly/yearly prices
   - Handles price updates (deactivates old, creates new)
   - Links prices to products

3. **Metadata:**
   - Stores `planId` and `slug` in Stripe metadata
   - Enables easy lookup from webhooks

### Better Auth Integration

The system integrates with Better Auth Stripe plugin:

1. **Plan Lookup:**
   - `findByStripePriceId()` method for webhook handlers
   - Maps Stripe prices back to internal plans

2. **Subscription Creation:**
   - Use Stripe Price IDs from plan records
   - Better Auth handles checkout and webhooks

3. **Feature Access:**
   - Query plan features by user's subscription
   - Enforce limits in middlewares

## Usage Examples

### Create a New Plan

```typescript
import { PlanRepository } from '@/infrastructure/repositories/plan.repository'
import { CreatePlanUseCase } from '@/application/use-cases/plan/create-plan.use-case'

const repo = new PlanRepository()
const useCase = new CreatePlanUseCase(repo)

const result = await useCase.execute({
  name: 'Starter',
  slug: 'starter',
  description: 'Perfect for beginners',
  pricing: {
    monthly: 500,  // €5.00
    yearly: 5000   // €50.00
  },
  features: {
    maxScenes: -1,
    maxDuration: 300,
    exportQuality: '1080p',
    hasWatermark: false,
    // ... other features
  }
})
```

### Sync with Stripe

```typescript
import { StripePlanSyncService } from '@/application/services/stripe-plan-sync.service'
import { PlanRepository } from '@/infrastructure/repositories/plan.repository'

const repo = new PlanRepository()
const syncService = new StripePlanSyncService(repo)

// Sync single plan
const plan = await repo.findBySlug('pro')
const result = await syncService.syncPlanToStripe(plan)

// Sync all plans
const bulkResult = await syncService.syncAllPlansToStripe()
console.log(`Synced: ${bulkResult.synced}, Failed: ${bulkResult.failed}`)
```

### Get User's Plan Features

```typescript
import { PlanRepository } from '@/infrastructure/repositories/plan.repository'

const repo = new PlanRepository()
const userPlanSlug = user.subscriptionPlan || 'free'
const plan = await repo.findBySlug(userPlanSlug)

if (plan) {
  // Check limits
  const canExport4K = plan.features.exportQuality === '4k'
  const hasAI = plan.features.hasAIVoice
  const maxDuration = plan.features.maxDuration
}
```

## Migration

Run the migration to create the plans table:

```bash
npm run db:migrate
```

Or check the generated migration:

```bash
drizzle/0004_true_rhino.sql
```

## Testing

### Manual API Testing

1. **Create a plan:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "slug": "test",
    "pricing": { "monthly": 1000, "yearly": 10000 },
    "features": { ... }
  }'
```

2. **List plans:**
```bash
curl http://localhost:3000/api/v1/plans
```

3. **Sync with Stripe:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/plans/PLAN_ID/sync-stripe \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Considerations

1. **Admin Only:** CRUD operations require admin role
2. **Soft Delete:** Plans are never hard deleted (maintains referential integrity)
3. **Slug Validation:** Prevents duplicate plan slugs
4. **Price Integrity:** Stripe prices are immutable (creates new on change)
5. **Metadata:** Additional fields stored securely in JSONB

## Future Enhancements

- [ ] Plan versioning for history tracking
- [ ] A/B testing support for pricing
- [ ] Automatic price updates on schedule
- [ ] Plan comparison API
- [ ] Usage-based billing integration
- [ ] Plan recommendations based on usage
- [ ] Multi-currency support
- [ ] Regional pricing
