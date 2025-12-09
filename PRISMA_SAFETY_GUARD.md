# 🛡️ Prisma Safety Guard

## What Happened

A destructive Prisma command (`db push --force-reset`) was accidentally run, which dropped the database and caused data loss. This safety guard has been implemented to prevent this from happening again.

## Safety Guard Implementation

The safety guard blocks destructive Prisma operations that could cause data loss:

### Blocked Flags:
- `--force-reset` - Drops and recreates the database
- `--reset` - Resets the database
- `--accept-data-loss` - Accepts data loss during schema changes
- `--skip-seed` - Skips seeding (less dangerous, but blocked for consistency)

### Blocked Command Patterns:
- `migrate reset` - Resets migrations and database
- `db push --force-reset` - Force reset via db push
- `db push --reset` - Reset via db push

## Usage

### Safe Commands (via npm scripts):
```bash
# Safe migration commands
npm run prisma:migrate          # Create and apply migrations
npm run migrate:deploy          # Deploy migrations (production)
npm run db:push                  # Push schema changes
npm run db:status                # Check migration status

# Generic safe wrapper
npm run prisma:safe <command>   # Run any Prisma command safely
```

### Direct Usage:
```bash
# Use the safety guard script
node scripts/safe-prisma.js migrate dev
node scripts/safe-prisma.js db push
node scripts/safe-prisma.js migrate status
```

### If You REALLY Need Destructive Operations:

**⚠️ WARNING: Only use if absolutely necessary and you understand the consequences!**

```bash
# Set override environment variable
export ALLOW_DESTRUCTIVE_PRISMA=1
node scripts/safe-prisma.js db push --force-reset

# Or bypass the guard entirely (NOT RECOMMENDED)
npx prisma db push --force-reset
```

## How It Works

1. The `safe-prisma.js` script intercepts Prisma commands
2. It checks for destructive flags and command patterns
3. If detected, it blocks the command and shows an error
4. Safe commands are passed through to Prisma normally

## Configuration

Edit `.prisma-safety-config.json` to customize:
- Which flags to block
- Which command patterns to block
- Whether to require explicit override

## Recovery

If data was lost, check:
1. Database backups (if configured)
2. Migration history in `prisma/migrations/`
3. Git history for schema changes
4. Application logs for recent operations

## Best Practices

1. **Always use safe commands** via npm scripts or the safety guard
2. **Review migrations** before applying in production
3. **Test migrations** in development/staging first
4. **Backup databases** before major schema changes
5. **Use `migrate dev`** instead of `db push` for schema changes
6. **Never use `--force-reset`** unless you're absolutely sure

## Current Status

✅ Safety guard is **ACTIVE** and protecting your database
✅ All npm scripts use the safety guard
✅ Schema is aligned with migrations

---

**Remember**: When in doubt, use `prisma migrate dev` instead of `db push`. Migrations are safer and reversible.

