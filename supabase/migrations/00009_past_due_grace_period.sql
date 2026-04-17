-- ============================================
-- Migration: Add past_due_since for 30-day grace period
-- When subscription goes past_due, record when it started.
-- After 30 days, the org becomes fully locked (read-only).
-- ============================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz;
