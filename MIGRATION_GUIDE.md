# Database Migration Guide - Fix Sign-Up Issue

## Problem
The sign-up endpoint was failing with a PostgreSQL error `42601` (syntax error) because there was a mismatch between the TypeScript schema definition and the actual database structure.

## Root Cause
1. Initial migration (0000) created the `users` table with Stripe-related fields
2. The TypeScript schema in `src/infrastructure/database/schema/schema.ts` was missing these fields
3. Better Auth's Drizzle adapter uses the schema to generate SQL queries
4. Mismatch between schema and database caused SQL syntax errors during user creation

## Solution
This PR fixes the schema mismatch and provides a proper migration path.

## Migration Instructions

### Option 1: Fresh Database (Recommended for Development)
If you're on a local development environment and can reset your database:

```bash
# Reset the database (WARNING: This will delete all data)
bun run db:reset

# Run all migrations
bun run db:migrate
```

### Option 2: Existing Database (Production/Staging)
If you have an existing database with data:

1. **Check what migrations have been applied:**
   ```bash
   # Connect to your PostgreSQL database
   psql $DATABASE_URL
   
   # Check if migrations tracking table exists
   \dt __drizzle_migrations
   
   # If it exists, check which migrations were applied
   SELECT * FROM __drizzle_migrations ORDER BY id;
   ```

2. **Check existing users table structure:**
   ```sql
   \d users
   ```

3. **Apply the new migration:**
   
   The migration is designed to be idempotent and safe to run on databases in various states:
   
   ```bash
   # Run the migration
   bun run db:migrate
   ```
   
   The migration uses `IF NOT EXISTS` clauses to safely handle cases where tables or columns already exist.

## Verification

After migration, verify the sign-up works:

```bash
# Start the development server
bun run dev

# Test the sign-up endpoint
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123",
    "callbackURL": "/"
  }'
```

You should receive a success response instead of the `FAILED_TO_CREATE_USER` error.

## Changes in This PR

### Schema Changes (`src/infrastructure/database/schema/schema.ts`)
- Added Stripe-related fields to `users` table TypeScript definition:
  - `isTrialActive`, `hasUsedTrial`, `trialStartDate`, `trialEndDate`
  - `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd`
  - Note: These fields already exist in the database from migration 0000, but were missing from the TypeScript schema causing Better Auth to fail

### New Migration (`drizzle/0002_clear_iron_lad.sql`)
- Creates `ai_usage` table for tracking AI feature usage
- Creates `user_api_keys` table for storing user's encrypted API keys
- Creates `billing_history` table for Stripe billing records
- Adds `subscription_plan`, `has_api_access`, `use_own_api_keys` columns to `users`

## Notes
- The schema now properly matches the database structure
- Better Auth's Drizzle adapter will work correctly with the updated schema
- All Stripe plugin features are now properly supported
