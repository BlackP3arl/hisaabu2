# Tax System Implementation

## Overview
This document describes the implementation of a comprehensive tax management system that supports:
- Multiple tax definitions (name and percentage)
- Default tax selection (GST)
- GST applied at line item level
- Other taxes applied at document level

## Database Changes

### 1. Taxes Table (`013_create_taxes_table.sql`)
- Stores tax definitions per user
- Fields: `id`, `user_id`, `name`, `rate`, `is_default`, `created_at`, `updated_at`
- Unique constraint ensures only one default tax per user

### 2. Company Settings Update (`014_add_default_tax_id_to_company_settings.sql`)
- Added `default_tax_id` column to link to default tax
- Replaces the old `default_tax_rate` approach

### 3. Document-Level Taxes (`015_add_document_taxes_to_invoices_quotations.sql`)
- Added `document_taxes` JSONB column to `invoices` and `quotations` tables
- Stores array of document-level taxes (non-GST taxes)
- Format: `[{"taxId": 1, "name": "Service Tax", "rate": 5.0, "amount": 50.00}]`

## Backend Changes

### New Files
1. **`backend/src/queries/taxes.js`**
   - `getTaxes(userId)` - Get all taxes for user
   - `getTax(taxId, userId)` - Get single tax
   - `getDefaultTax(userId)` - Get default tax
   - `createTax(userId, taxData)` - Create new tax
   - `updateTax(taxId, userId, taxData)` - Update tax
   - `deleteTax(taxId, userId)` - Delete tax
   - `initializeDefaultGST(userId)` - Initialize default GST if none exists

2. **`backend/src/controllers/taxController.js`**
   - RESTful API endpoints for tax management
   - Validation and error handling

3. **`backend/src/routes/taxes.js`**
   - Routes: GET, POST, PUT, DELETE `/api/v1/taxes`
   - Initialize GST endpoint

### Updated Files
1. **`backend/src/queries/settings.js`**
   - Added `defaultTaxId` to field mapping

2. **`backend/src/controllers/settingsController.js`**
   - Updated to include taxes in settings response
   - Auto-initializes GST if no taxes exist

3. **`backend/src/app.js`**
   - Added tax routes

## Frontend Changes

### Updated Files
1. **`src/context/DataContext.jsx`**
   - Added tax state and management functions:
     - `taxes` - Array of taxes
     - `fetchTaxes()` - Fetch all taxes
     - `createTax(taxData)` - Create tax
     - `updateTax(id, updates)` - Update tax
     - `deleteTax(id)` - Delete tax

2. **`src/pages/Settings.jsx`**
   - Complete rewrite of tax configuration tab
   - Tax management UI with:
     - Default tax selector
     - Add/Edit/Delete tax functionality
     - Tax list display
   - Removed old `defaultTaxRate` field

## Tax Application Logic

### Line Item Level (GST)
- GST is applied to each line item in invoices/quotations
- Stored in `tax_percent` field of `invoice_items` and `quotation_items`
- Calculated per item: `(quantity × price × (1 - discount/100)) × (tax_percent/100)`

### Document Level (Other Taxes)
- Non-GST taxes are applied at document level
- Stored in `document_taxes` JSONB array
- Calculated on subtotal after discounts: `subtotal × (tax_rate/100)`
- Displayed as separate lines in totals section

## Migration Steps

1. Run database migrations in order:
   ```sql
   -- 013_create_taxes_table.sql
   -- 014_add_default_tax_id_to_company_settings.sql
   -- 015_add_document_taxes_to_invoices_quotations.sql
   ```

2. Initialize default GST for existing users:
   - Call `POST /api/v1/taxes/initialize-gst` for each user
   - Or run SQL to create GST tax and link to company_settings

3. Update existing invoices/quotations:
   - Migrate old `tax_percent` to use GST tax ID
   - Set `document_taxes` to empty array `[]`

## API Endpoints

### Taxes
- `GET /api/v1/taxes` - Get all taxes
- `GET /api/v1/taxes/:id` - Get single tax
- `POST /api/v1/taxes` - Create tax
- `PUT /api/v1/taxes/:id` - Update tax
- `DELETE /api/v1/taxes/:id` - Delete tax
- `POST /api/v1/taxes/initialize-gst` - Initialize default GST

### Settings
- `GET /api/v1/settings` - Now includes `taxes` array and `defaultTax` object
- `PUT /api/v1/settings` - Accepts `defaultTaxId` instead of `defaultTaxRate`

## Next Steps (TODO)

1. **Update Invoice/Quotation Forms**
   - Add GST selection at item level
   - Add document-level tax selection
   - Update calculation logic

2. **Update Invoice/Quotation Display**
   - Show document-level taxes as separate lines
   - Update totals calculation

3. **Update Calculation Triggers**
   - Modify database triggers to handle document-level taxes
   - Update `update_invoice_totals.sql` and `update_quotation_totals.sql`

4. **Update Documentation**
   - Update API specification
   - Update data models documentation
   - Update database schema documentation

## Notes

- GST is the only tax that applies at line item level
- All other taxes apply at document level
- Default tax is used when creating new line items
- Document-level taxes are calculated on subtotal (after discounts, before GST)


