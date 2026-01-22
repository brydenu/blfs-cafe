# Fixing Prisma Migration Shadow Database Issue

## Problem
The shadow database doesn't have the base schema, causing migration failures.

## Solution Options

### Option 1: Use `migrate deploy` (Recommended if database already exists)
This applies migrations without using a shadow database:

```bash
npx prisma migrate deploy
```

Then regenerate the Prisma client:
```bash
npx prisma generate
```

### Option 2: Set Shadow Database URL (Temporary workaround)
If you need to use `migrate dev`, you can temporarily set the shadow database to the same as your main database by adding this to your `.env` file:

```
SHADOW_DATABASE_URL="your-main-database-url-here"
```

Or set it to point to a separate shadow database.

### Option 3: Create Baseline Migration
If your database already has the schema but migrations are missing, you can create a baseline:

```bash
npx prisma migrate resolve --applied 20260119163036_convert_status_to_completed
npx prisma migrate resolve --applied 20260119181617_add_is_cancelled_to_order_item
# ... mark all existing migrations as applied
npx prisma migrate dev
```

### Option 4: Disable Shadow Database (Development only)
Add to your `.env` file:
```
PRISMA_MIGRATE_SKIP_GENERATE=1
```

Then use `migrate deploy` instead of `migrate dev`.
