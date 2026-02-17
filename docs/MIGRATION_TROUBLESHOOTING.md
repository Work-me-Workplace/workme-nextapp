# Migration Troubleshooting

## Current Errors

### 1. P1002 – Advisory Lock Timeout
```
Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)). Elapsed: 10000ms.
```

**Cause:** Prisma needs exclusive access to run migrations. PostgreSQL advisory locks are used to block concurrent migration runs. With **Neon’s connection pooler** (`-pooler` in the URL), connections are shared, so:
- Idle pooled connections can keep holding the lock
- The pooler may not fully release connections quickly

### 2. Migration History Mismatch
- **DB has migrations not in repo:** `$(date +%Y%m%d%H%M%S)_add_class_start_date_to_platform_product`, `$(date +%Y%m%d%H%M%S)_standardize_companyx_models`
- **Local has migrations not in DB:** `$(date +%Y%m%d%H%M%S)_add_unified_product_digital_sign_workforce_stuff`, `20260217142850_add_unified_product_digital_sign_workforce_stuff`
- **Folder names with literal `$(date...)`:** Migration folders were created with unexpanded shell variables instead of real timestamps.

---

## Options (in order of preference)

### Option A: Use Direct Connection for Migrations (recommended for Neon)

Use a non-pooled, direct connection for `prisma migrate`:

1. In Neon: create a direct connection URL (no `-pooler` in host) or copy from the project dashboard.
2. Add `directUrl` to `schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_DATABASE_URL")
   }
   ```
3. Set `DIRECT_DATABASE_URL` in `.env` to the direct (non-pooler) connection string.
4. Run migrations again; they will use the direct connection.

### Option B: Clear Advisory Lock (one-off fix)

If a connection is stuck holding the lock, run in Neon SQL Editor or psql:

```sql
SELECT pg_terminate_backend(PSA.pid)
FROM pg_locks AS PL
    INNER JOIN pg_stat_activity AS PSA ON PSA.pid = PL.pid
WHERE PSA.state = 'idle'
  AND PL.objid = 72707369;
```

Then retry the migration.

### Option C: Database Reset (destructive)

Resets schema and data:

```bash
npx prisma migrate reset
```

- Drops all data.
- Reapplies all migrations from scratch.
- Only use if data can be lost (e.g. dev/staging).

### Option D: Resolve Migration History

The `$(date +%Y%m%d%H%M%S)_...` folder names come from shell variables not being expanded when creating migration folders.

1. Rename folders to proper timestamps (e.g. `20251215154202_rename_signageId_to_digitalSignId`).
2. Align `_prisma_migrations` rows with those names, or mark migrations as rolled back and reapply.
3. See Prisma docs on [resolving migration history](https://www.prisma.io/docs/guides/migrate/production-troubleshooting).

---

## Quick Win: CompanyEvent Loading (No New Migration Needed)

The CompanyEvent / `eventItems` fix only requires:

1. **Prisma client regeneration:** `npx prisma generate` (already run).
2. **DB already migrated:** The `20260217000000_companyevent_perks_to_eventitems` migration was applied earlier.

So CompanyEvent loading should work even without running the new unified model migration. The unified `ProductDigitalSignWorkforceStuff` migration is for digital signage from workforce stuff.

---

## Next Steps

1. Add `directUrl` for Neon and retry migrations.
2. If the lock is still held, run the `pg_terminate_backend` query.
3. Fix the `$(date...)` migration folder names before changing migration history.
