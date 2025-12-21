-- Run UOM System Migrations
-- Description: Creates uoms table, seeds default UOM, and adds uom_id to items
-- Usage: psql -U postgres -d hisaabu -f run_uom_migrations.sql

-- Migration 022: Create uoms table
\i migrations/022_create_uoms_table.sql

-- Migration 023: Seed default UOM (Pieces/PC)
\i migrations/023_seed_default_uom.sql

-- Migration 024: Add uom_id to items table
\i migrations/024_add_uom_to_items.sql

-- Display success message
SELECT 'UOM system migrations completed successfully!' AS status;

