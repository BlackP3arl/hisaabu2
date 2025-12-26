-- Migration: Add document-level taxes to invoices and quotations
-- Description: Stores document-level taxes (non-GST taxes) as JSONB arrays
-- Created: 2024-01-25

-- Add document_taxes column to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS document_taxes JSONB DEFAULT '[]'::jsonb;

-- Add document_taxes column to quotations
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS document_taxes JSONB DEFAULT '[]'::jsonb;

-- Add comments
COMMENT ON COLUMN invoices.document_taxes IS 'Array of document-level taxes (non-GST). Format: [{"taxId": 1, "name": "Service Tax", "rate": 5.0, "amount": 50.00}]';
COMMENT ON COLUMN quotations.document_taxes IS 'Array of document-level taxes (non-GST). Format: [{"taxId": 1, "name": "Service Tax", "rate": 5.0, "amount": 50.00}]';


