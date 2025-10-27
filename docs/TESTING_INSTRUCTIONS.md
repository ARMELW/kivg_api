# Testing Instructions

## Overview
This PR fixes the Better Auth sign-up error by synchronizing the TypeScript schema with the database structure.

## Prerequisites
- PostgreSQL database running
- Database connection configured in `.env` file

## Testing Steps

### 1. Setup Environment
```bash
# Copy environment variables if not already done
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection string
# Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/doodlio_db
```

### 2. Apply Migrations

#### Option A: Fresh Database (Recommended for Testing)
```bash
# Reset database and apply all migrations
bun run db:reset
bun run db:migrate
```

#### Option B: Existing Database
```bash
# Apply migrations (idempotent, safe to run)
bun run db:migrate
```

### 3. Start the Development Server
```bash
bun run dev
```

### 4. Test Sign-Up Endpoint

#### Using cURL
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "securePassword123",
    "callbackURL": "/"
  }'
```

#### Expected Response (Success)
```json
{
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "emailVerified": false,
    "role": "user",
    "isAdmin": false,
    ...
  },
  "session": {
    "id": "...",
    "token": "...",
    ...
  }
}
```

#### Previous Error (Before Fix)
```json
{
  "code": "FAILED_TO_CREATE_USER",
  "message": "Failed to create user",
  "details": {
    "name": "PostgresError",
    "severity": "ERROR",
    "code": "42601",
    "position": "21",
    ...
  }
}
```

### 5. Verify Database

Connect to your database and verify the user was created:

```sql
-- Check users table
SELECT id, name, email, role, subscription_plan, stripe_customer_id 
FROM users 
WHERE email = 'test@example.com';

-- Verify new tables exist
\dt ai_usage
\dt user_api_keys
\dt billing_history
```

### 6. Test Additional Scenarios

#### Test with Different User Data
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "anotherPassword456",
    "callbackURL": "/"
  }'
```

#### Test Duplicate Email (Should Fail Gracefully)
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "callbackURL": "/"
  }'
```

Expected: Error about email already exists (not SQL syntax error)

### 7. Test Sign-In (Verify Full Flow)
```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123"
  }'
```

Expected: Successful authentication with session token

## Cleanup

To remove test users:
```sql
DELETE FROM users WHERE email LIKE 'test%' OR email LIKE 'jane%';
```

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The migration is idempotent and should handle this. If it still fails, check which migrations have been applied:
```sql
SELECT * FROM __drizzle_migrations ORDER BY id;
```

### Issue: Database connection error
**Solution**: Verify your DATABASE_URL in `.env` and ensure PostgreSQL is running:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### Issue: "Better Auth" configuration error
**Solution**: Ensure all required environment variables are set in `.env`:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

## Success Criteria

✅ Sign-up endpoint returns success response (not PostgreSQL error)
✅ User record created in database with all fields
✅ New tables (ai_usage, user_api_keys, billing_history) exist
✅ Can sign in with newly created user
✅ No SQL syntax errors in application logs
