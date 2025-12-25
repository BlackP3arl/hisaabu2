-- Migration: Create items table
-- Description: Stores service/product items master data
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rate DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_rate CHECK (rate >= 0),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- Create full-text search index on name and description
CREATE INDEX IF NOT EXISTS idx_items_search ON items USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- Add foreign key constraints
-- ALTER TABLE items ADD CONSTRAINT fk_items_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE items ADD CONSTRAINT fk_items_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE items IS 'Stores service/product items master data';
COMMENT ON COLUMN items.rate IS 'Unit price per piece';
COMMENT ON COLUMN items.category_id IS 'Category this item belongs to (optional)';
COMMENT ON COLUMN items.status IS 'Item status: active or inactive';

