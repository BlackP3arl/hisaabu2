-- Migration: Add uom_id to items table
-- Description: Add unit of measure reference to items
-- Created: 2025-01-21

-- Add uom_id column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS uom_id INTEGER;

-- Set default UOM (Pieces/PC) for existing items
UPDATE items SET uom_id = 1 WHERE uom_id IS NULL;

-- Set default value for new items
ALTER TABLE items ALTER COLUMN uom_id SET DEFAULT 1;

-- Create index
CREATE INDEX IF NOT EXISTS idx_items_uom_id ON items(uom_id);

-- Add foreign key constraint (commented out as per pattern in other migrations)
-- ALTER TABLE items ADD CONSTRAINT fk_items_uom_id FOREIGN KEY (uom_id) REFERENCES uoms(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN items.uom_id IS 'Unit of measure for this item (defaults to Pieces/PC)';

