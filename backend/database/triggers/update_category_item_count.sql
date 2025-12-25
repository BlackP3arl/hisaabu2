-- Trigger Function: Update category item count
-- Description: Maintains denormalized item_count in categories table
-- Created: 2024-01-25

CREATE OR REPLACE FUNCTION update_category_item_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old category count (on UPDATE or DELETE)
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        IF OLD.category_id IS NOT NULL THEN
            UPDATE categories
            SET item_count = item_count - 1
            WHERE id = OLD.category_id;
        END IF;
    END IF;
    
    -- Update new category count (on INSERT or UPDATE)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.category_id IS NOT NULL THEN
            UPDATE categories
            SET item_count = item_count + 1
            WHERE id = NEW.category_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_category_item_count
    AFTER INSERT OR UPDATE OR DELETE ON items
    FOR EACH ROW 
    EXECUTE FUNCTION update_category_item_count();


