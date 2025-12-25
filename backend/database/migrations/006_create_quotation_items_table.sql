-- Migration: Create quotation_items table
-- Description: Stores line items for quotations
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    item_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT chk_tax_percent CHECK (tax_percent >= 0 AND tax_percent <= 100),
    CONSTRAINT chk_line_total CHECK (line_total >= 0),
    CONSTRAINT chk_sort_order CHECK (sort_order >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_item_id ON quotation_items(item_id);

-- Add foreign key constraints
-- ALTER TABLE quotation_items ADD CONSTRAINT fk_quotation_items_quotation_id FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;
-- ALTER TABLE quotation_items ADD CONSTRAINT fk_quotation_items_item_id FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE quotation_items IS 'Stores line items for quotations';
COMMENT ON COLUMN quotation_items.item_id IS 'Reference to item master (nullable for custom items)';
COMMENT ON COLUMN quotation_items.name IS 'Item name (snapshot at time of creation)';
COMMENT ON COLUMN quotation_items.line_total IS 'Calculated line total: (quantity * price * (1 - discount/100)) * (1 + tax/100)';


