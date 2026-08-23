-- Create merchants table
CREATE TABLE "merchants" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email"         TEXT UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add merchant_id to products
ALTER TABLE "products"
  ADD COLUMN "merchant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add merchant_id to policies
ALTER TABLE "policies"
  ADD COLUMN "merchant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add merchant_id to sessions
ALTER TABLE "sessions"
  ADD COLUMN "merchant_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add merchant_id to audit_log; also add idempotency_key for order dedup
ALTER TABLE "audit_log"
  ADD COLUMN "merchant_id"     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN "idempotency_key" TEXT UNIQUE;

-- Insert the default seed merchant so existing data keeps valid FKs
-- Password: "Demo1234!" (bcrypt hash generated offline)
INSERT INTO "merchants" ("id", "email", "password_hash", "name")
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'demo@demo.com',
  '$2b$10$Y1lYrQKXHYzwTcLjFbRoou6e3CkT.tS/9mFzn7jDGIe7S8u01Iy2i',
  'Demo Merchant'
);

-- Drop defaults; real FKs are now in place
ALTER TABLE "products"   ALTER COLUMN "merchant_id" DROP DEFAULT;
ALTER TABLE "policies"   ALTER COLUMN "merchant_id" DROP DEFAULT;
ALTER TABLE "sessions"   ALTER COLUMN "merchant_id" DROP DEFAULT;
ALTER TABLE "audit_log"  ALTER COLUMN "merchant_id" DROP DEFAULT;

-- Add FK constraints
ALTER TABLE "products"
  ADD CONSTRAINT "products_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "policies"
  ADD CONSTRAINT "policies_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index for fast per-merchant queries
CREATE INDEX "products_merchant_id_idx"  ON "products"  ("merchant_id");
CREATE INDEX "policies_merchant_id_idx"  ON "policies"  ("merchant_id");
CREATE INDEX "sessions_merchant_id_idx"  ON "sessions"  ("merchant_id");
CREATE INDEX "audit_log_merchant_id_idx" ON "audit_log" ("merchant_id");
