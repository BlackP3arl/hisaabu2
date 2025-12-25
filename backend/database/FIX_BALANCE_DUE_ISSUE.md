# Fix Invoice Balance Due Issue

## Problem
Invoices were showing incorrect `balance_due` values. When no payments were recorded, `balance_due` should equal `total_amount`, but it was showing incorrect values (e.g., 216 instead of 566).

## Root Cause
The `update_invoice_totals` trigger was using the `amount_paid` column value directly, which could be stale or incorrect. It should calculate `amount_paid` from the payments table (source of truth) instead.

## Solution

### Step 1: Update the Trigger Function
The trigger function has been updated to:
1. Calculate `amount_paid` from the payments table
2. Update `amount_paid` column to match
3. Calculate `balance_due` correctly as `total_amount - amount_paid`

### Step 2: Apply the Updated Trigger
Run the updated trigger SQL:

```bash
cd backend/database
psql -U postgres -d hisaabu -f triggers/update_invoice_totals.sql
```

### Step 3: Fix Existing Invoices
Run the fix script to correct all existing invoices:

```bash
cd backend/database
psql -U postgres -d hisaabu -f fix_invoice_balances.sql
```

This will:
- Recalculate `amount_paid` from payments for all invoices
- Recalculate `balance_due` as `total_amount - amount_paid`
- Update invoice status based on payments and due date

## Verification

After running the fixes, verify with:

```sql
-- Check invoices with incorrect balances
SELECT 
    id,
    number,
    total_amount,
    amount_paid,
    balance_due,
    (total_amount - amount_paid) as calculated_balance,
    CASE 
        WHEN balance_due = (total_amount - amount_paid) THEN 'OK'
        ELSE 'MISMATCH'
    END as status_check
FROM invoices
WHERE balance_due != (total_amount - COALESCE((
    SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id
), 0))
OR amount_paid != COALESCE((
    SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id
), 0);
```

This should return no rows if everything is fixed correctly.

## Changes Made

1. **Updated Trigger**: `triggers/update_invoice_totals.sql`
   - Now calculates `amount_paid` from payments table
   - Updates `amount_paid` column when totals are recalculated
   - Ensures `balance_due` is always correct

2. **Fix Script**: `fix_invoice_balances.sql`
   - One-time script to fix all existing invoices
   - Updates status based on payments and due date

## Status Logic

Invoice status is now correctly set based on:
- `paid`: `amount_paid >= total_amount`
- `partial`: `amount_paid > 0 AND amount_paid < total_amount`
- `overdue`: `due_date < CURRENT_DATE AND balance_due > 0`
- `sent`: `amount_paid = 0 AND due_date >= CURRENT_DATE`
- `draft`: Original status if draft

