# Migration Proposal Template

## Summary

- Migration name:
- Goal:
- Related task/ticket:

## Schema Changes

- Added:
- Updated:
- Removed:

## Data Impact

- Backfill needed: Yes/No
- Potential data loss risk: Low/Medium/High
- Notes:

## Performance Impact

- New indexes:
- Query impact notes:

## Rollback Plan (Dev)

- Reset and replay plan:
- Seed rerun plan:

## Verification

- `npx prisma validate`:
- `npx prisma generate`:
- `npx prisma migrate reset`:
- `npx prisma db seed`:

## Reviewer Checklist

- [ ] SQL matches schema intent
- [ ] FK and onDelete reviewed
- [ ] Indexes justified
- [ ] Seed compatibility checked
