-- Migration: Create categories table
-- Description: Stores item categories for organizing services/products
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL,
    item_count INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT chk_item_count CHECK (item_count >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Add foreign key constraint
-- ALTER TABLE categories ADD CONSTRAINT fk_categories_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE categories IS 'Stores item categories for organizing services/products';
COMMENT ON COLUMN categories.color IS 'Hex color code (e.g., #3B82F6)';
COMMENT ON COLUMN categories.item_count IS 'Count of items in this category (denormalized for performance)';


