-- Migration: Add 'rejected' status to quotations
-- Description: Adds 'rejected' status option to quotations table
-- Created: 2024-01-25

-- Drop existing constraint
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS chk_status;

-- Add new constraint with 'rejected' status
ALTER TABLE quotations 
ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired'));

-- Update comment
COMMENT ON COLUMN quotations.status IS 'Quotation status: draft, sent, accepted, rejected, or expired';

