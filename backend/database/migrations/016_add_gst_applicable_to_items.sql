-- Migration: Add gst_applicable column to items table
-- Description: Controls whether GST (default tax) is automatically applied when item is added to invoices/quotations
-- Created: 2024-01-25

-- Add gst_applicable column to items
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS gst_applicable BOOLEAN NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN items.gst_applicable IS 'Whether GST (default tax) should be applied when this item is added to invoices/quotations. Defaults to true for backward compatibility.';

