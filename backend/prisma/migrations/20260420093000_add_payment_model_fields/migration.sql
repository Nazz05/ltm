-- Add payment table if missing and extend fields for VNPAY integration
CREATE TABLE IF NOT EXISTS "payments" (
    "id" SERIAL PRIMARY KEY,
    "order_id" INTEGER UNIQUE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "bank_code" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "response_code" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "gateway_payload" TEXT;

CREATE INDEX IF NOT EXISTS "payments_payment_status_idx" ON "payments"("payment_status");
CREATE INDEX IF NOT EXISTS "payments_transaction_id_idx" ON "payments"("transaction_id");
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments"("created_at");
