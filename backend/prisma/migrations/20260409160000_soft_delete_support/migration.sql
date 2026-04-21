-- Add soft delete columns for core business tables
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Indexes for soft delete filtering
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX IF NOT EXISTS "addresses_deleted_at_idx" ON "addresses"("deleted_at");
CREATE INDEX IF NOT EXISTS "categories_deleted_at_idx" ON "categories"("deleted_at");
CREATE INDEX IF NOT EXISTS "products_deleted_at_idx" ON "products"("deleted_at");
