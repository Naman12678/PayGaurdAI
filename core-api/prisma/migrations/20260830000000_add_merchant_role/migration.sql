-- Adds a role to Merchant so admin-only operations (policy changes) have a
-- real enforcement point. Every existing and new merchant defaults to
-- 'admin' — they're the sole owner of their own store, so behavior is
-- unchanged today. This lays groundwork for a future lower-privilege
-- staff/invite role without a breaking change later.
ALTER TABLE "merchants" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';
