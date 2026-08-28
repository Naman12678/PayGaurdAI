-- Adds a real cap on total spend per session, on top of the existing
-- per-order amount cap and per-session order-count cap. Without this,
-- a session could place N orders each under the per-order cap with no
-- ceiling on their sum.
ALTER TABLE "policies" ADD COLUMN "max_session_spend" INTEGER NOT NULL DEFAULT 8000;
ALTER TABLE "sessions" ADD COLUMN "total_spent" INTEGER NOT NULL DEFAULT 0;
