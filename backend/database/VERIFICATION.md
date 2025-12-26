# Database Verification Checklist

After running the database setup, verify that everything is created correctly.

## 1. Check All Tables Exist

Run this query to verify all 11 tables are created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Tables:**
1. users
2. clients
3. categories
4. items
5. quotations
6. quotation_items
7. invoices
8. invoice_items
9. payments
10. company_settings
11. share_links

## 2. Check All Indexes

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Key Indexes to Verify:**
- `idx_users_email` (UNIQUE)
- `idx_clients_user_id`
- `idx_quotations_number_user` (UNIQUE composite)
- `idx_invoices_number_user` (UNIQUE composite)
- `idx_share_links_token` (UNIQUE)
- All foreign key indexes

## 3. Check All Foreign Keys

```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**Expected Foreign Keys:**
- clients.user_id → users.id
- categories.user_id → users.id
- items.user_id → users.id
- items.category_id → categories.id
- quotations.client_id → clients.id
- quotations.user_id → users.id
- quotation_items.quotation_id → quotations.id
- quotation_items.item_id → items.id
- invoices.client_id → clients.id
- invoices.user_id → users.id
- invoice_items.invoice_id → invoices.id
- invoice_items.item_id → items.id
- payments.invoice_id → invoices.id
- payments.user_id → users.id
- company_settings.user_id → users.id

## 4. Check All Triggers

```sql
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected Triggers:**
- `trigger_users_updated_at`
- `trigger_clients_updated_at`
- `trigger_categories_updated_at`
- `trigger_items_updated_at`
- `trigger_quotations_updated_at`
- `trigger_invoices_updated_at`
- `trigger_company_settings_updated_at`
- `trigger_update_invoice_totals`
- `trigger_update_quotation_totals`
- `trigger_update_invoice_payment_status`
- `trigger_update_category_item_count`

## 5. Check All Functions

```sql
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected Functions:**
- `update_updated_at_column()`
- `update_invoice_totals()`
- `update_quotation_totals()`
- `update_invoice_payment_status()`
- `update_category_item_count()`

## 6. Check All Views

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

**Expected Views:**
- `client_summary`

## 7. Check Constraints

```sql
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_name;
```

## 8. Test Trigger Functions

### Test updated_at trigger:
```sql
-- Create a test user
INSERT INTO users (email, password_hash, name) 
VALUES ('test@example.com', 'hash', 'Test User');

-- Update the user
UPDATE users SET name = 'Updated Name' WHERE email = 'test@example.com';

-- Check updated_at changed
SELECT name, created_at, updated_at FROM users WHERE email = 'test@example.com';

-- Cleanup
DELETE FROM users WHERE email = 'test@example.com';
```

### Test invoice totals trigger:
```sql
-- Create test data
INSERT INTO users (email, password_hash, name) VALUES ('test@example.com', 'hash', 'Test');
INSERT INTO clients (name, email, user_id) VALUES ('Test Client', 'client@test.com', 1);
INSERT INTO invoices (number, client_id, user_id, issue_date, due_date) 
VALUES ('TEST-001', 1, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- Add line item
INSERT INTO invoice_items (invoice_id, name, quantity, price, line_total)
VALUES (1, 'Test Item', 1, 100.00, 100.00);

-- Check totals updated
SELECT subtotal, total_amount FROM invoices WHERE id = 1;

-- Cleanup
DELETE FROM invoice_items WHERE invoice_id = 1;
DELETE FROM invoices WHERE id = 1;
DELETE FROM clients WHERE id = 1;
DELETE FROM users WHERE id = 1;
```

## 9. Verify Extensions

```sql
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';
```

Should show `uuid-ossp` extension installed.

## 10. Check Table Structures

Verify key columns exist in each table:

```sql
-- Users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Repeat for other tables as needed
```

## Common Issues

### Issue: Foreign key constraint fails
**Solution**: Make sure migrations are run in order. Foreign keys are added in migration 012.

### Issue: Trigger not firing
**Solution**: Check that trigger functions are created before triggers.

### Issue: Unique constraint violation
**Solution**: Document numbers (invoice/quotation) are unique per user. Use composite unique index.

### Issue: Extension not found
**Solution**: Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` manually.

## Success Criteria

✅ All 11 tables created
✅ All foreign keys in place
✅ All triggers working
✅ All functions created
✅ All views created
✅ All indexes created
✅ UUID extension enabled
✅ Constraints in place

If all checks pass, the database is ready for backend implementation!



