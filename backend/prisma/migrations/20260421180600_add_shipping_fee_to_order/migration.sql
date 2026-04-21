/*
  Warnings:

  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `DoublePrecision`.
  - You are about to drop the `product_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `query_cache_metadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shipments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slow_query_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_history` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `payment_status` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_product_id_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "slow_query_log" DROP CONSTRAINT "slow_query_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_history" DROP CONSTRAINT "stock_history_product_id_fkey";

-- DropIndex
DROP INDEX "idx_payments_order";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shipping_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "payment_method" SET DATA TYPE TEXT,
ALTER COLUMN "payment_status" SET NOT NULL,
ALTER COLUMN "payment_status" SET DATA TYPE TEXT,
ALTER COLUMN "transaction_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "product_images";

-- DropTable
DROP TABLE "query_cache_metadata";

-- DropTable
DROP TABLE "shipments";

-- DropTable
DROP TABLE "slow_query_log";

-- DropTable
DROP TABLE "stock_history";

-- CreateIndex
CREATE INDEX "orders_deleted_at_idx" ON "orders"("deleted_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
