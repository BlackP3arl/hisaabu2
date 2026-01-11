-- Migration: Add 'viewed' status to invoices
-- Description: Adds 'viewed' as an allowed status for invoices to track when clients acknowledge shared invoices
-- Created: 2026-01-11

-- Drop the existing status constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_status;

-- Add the new constraint with 'viewed' status included
ALTER TABLE invoices ADD CONSTRAINT chk_status
  CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue'));

-- Add comment explaining the new status
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, viewed, paid, partial, or overdue';
