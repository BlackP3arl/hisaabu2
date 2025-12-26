-- Migration: Seed default UOM
-- Description: Insert default "Pieces (PC)" UOM
-- Created: 2025-01-21

-- Insert default UOM if it doesn't exist
INSERT INTO uoms (id, name, code, created_at, updated_at)
VALUES (1, 'Pieces', 'PC', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- If the ID 1 is taken, insert without specifying ID
INSERT INTO uoms (name, code, created_at, updated_at)
SELECT 'Pieces', 'PC', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM uoms WHERE code = 'PC');


