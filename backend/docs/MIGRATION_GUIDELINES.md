# Migration Guidelines

## Scope

This file defines how to create, test, and review Prisma migrations in local development.

## Naming Convention

Use:

- `YYYYMMDDHHmm_<short_goal>`

Examples:

- `202604081530_sync_schema_step1`
- `202604091000_add_payment_method`

## Required Flow For Each Migration

1. Update schema in `prisma/schema.prisma`.
2. Create migration:

```powershell
npx prisma migrate dev --name <migration_name>
```

3. Generate client:

```powershell
npx prisma generate
```

4. Reset and replay on clean local DB:

```powershell
npx prisma migrate reset
```

5. Run seed:

```powershell
npx prisma db seed
```

## Review Checklist

- SQL changes match schema intent.
- No accidental destructive action.
- Indexes are aligned with common queries.
- Foreign keys and onDelete rules are intentional.
- Seed still works after migration reset.

## Rollback Policy (Dev)

For local development, rollback is done by reset and replay.

```powershell
npx prisma migrate reset
```

Notes:

- This deletes local data.
- Always backup data before reset if needed.

## Production Note

Do not run reset in production. Production rollback needs explicit SQL strategy and backup restore plan.
