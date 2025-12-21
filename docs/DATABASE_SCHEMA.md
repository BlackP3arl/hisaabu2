# Database Schema Documentation

## Overview

This document describes the complete database schema for the Hisaabu Invoice & Quotation Management application. The database uses PostgreSQL and follows relational database best practices with proper normalization, foreign keys, indexes, and constraints.

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ quotations : creates
    users ||--o{ invoices : creates
    clients ||--o{ quotations : receives
    clients ||--o{ invoices : receives
    clients ||--o{ payments : makes
    categories ||--o{ items : contains
    items ||--o{ quotation_items : "used in"
    items ||--o{ invoice_items : "used in"
    quotations ||--o{ quotation_items : contains
    quotations ||--|| invoices : "converts to"
    invoices ||--o{ invoice_items : contains
    invoices ||--o{ payments : receives
    invoices ||--o{ share_links : "has secure link"
    quotations ||--o{ share_links : "has secure link"
    company_settings ||--|| users : "belongs to"
    company_settings }o--|| taxes : "has default"
    taxes }o--|| users : "belongs to"

    users {
        int id PK
        string email UK
        string password_hash
        string name
        string role
        timestamp created_at
        timestamp updated_at
    }

    clients {
        int id PK
        string name
        string email
        string phone
        string address
        string city
        string postal_code
        string country
        string company_name
        string tax_id
        string status
        text notes
        int user_id FK
        timestamp created_at
        timestamp updated_at
    }

    categories {
        int id PK
        string name
        string description
        string color
        int item_count
        int user_id FK
        timestamp created_at
        timestamp updated_at
    }

    items {
        int id PK
        string name
        text description
        decimal rate
        int category_id FK
        string status
        int user_id FK
        timestamp created_at
        timestamp updated_at
    }

    quotations {
        int id PK
        string number UK
        int client_id FK
        int user_id FK
        date issue_date
        date expiry_date
        decimal subtotal
        decimal discount_total
        decimal tax_total
        jsonb document_taxes
        decimal total_amount
        text notes
        text terms
        string status
        timestamp created_at
        timestamp updated_at
    }

    quotation_items {
        int id PK
        int quotation_id FK
        int item_id FK
        string name
        text description
        decimal quantity
        decimal price
        decimal discount_percent
        decimal tax_percent
        decimal line_total
        int sort_order
    }

    invoices {
        int id PK
        string number UK
        int client_id FK
        int user_id FK
        date issue_date
        date due_date
        decimal subtotal
        decimal discount_total
        decimal tax_total
        jsonb document_taxes
        decimal total_amount
        decimal amount_paid
        decimal balance_due
        text notes
        text terms
        string status
        timestamp created_at
        timestamp updated_at
        timestamp paid_at
    }

    invoice_items {
        int id PK
        int invoice_id FK
        int item_id FK
        string name
        text description
        decimal quantity
        decimal price
        decimal discount_percent
        decimal tax_percent
        decimal line_total
        int sort_order
    }

    payments {
        int id PK
        int invoice_id FK
        decimal amount
        date payment_date
        string payment_method
        text notes
        string reference_number
        int user_id FK
        timestamp created_at
    }

    company_settings {
        int id PK
        int user_id FK UK
        string company_name
        string logo_url
        text registered_address
        text shipping_address
        string email
        string phone
        string gst_number
        string registration_number
        decimal default_tax_rate
        int default_tax_id FK
        string currency
        string date_format
        string invoice_prefix
        string quotation_prefix
        text terms_template
        boolean tax_per_item_enabled
        timestamp created_at
        timestamp updated_at
    }

    taxes {
        int id PK
        int user_id FK
        string name
        decimal rate
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }

    share_links {
        int id PK
        string token UK
        string document_type
        int document_id
        string password_hash
        date expires_at
        boolean is_active
        int view_count
        timestamp created_at
        timestamp last_accessed_at
    }
```

## Tables

### 1. users

Stores user authentication and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address (used for login) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | User's full name |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'staff' | User role: 'admin' or 'staff' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email` (UNIQUE)

**Relationships:**
- One-to-many with `clients` (user_id)
- One-to-many with `quotations` (user_id)
- One-to-many with `invoices` (user_id)
- One-to-many with `items` (user_id)
- One-to-many with `categories` (user_id)
- One-to-one with `company_settings` (user_id)

---

### 2. clients

Stores client/customer information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing client ID |
| name | VARCHAR(255) | NOT NULL | Client's full name |
| email | VARCHAR(255) | NOT NULL | Client email address |
| phone | VARCHAR(50) | | Client phone number |
| address | TEXT | | Street address |
| city | VARCHAR(100) | | City |
| postal_code | VARCHAR(20) | | Postal/ZIP code |
| country | VARCHAR(100) | | Country |
| company_name | VARCHAR(255) | | Company name (if applicable) |
| tax_id | VARCHAR(100) | | Tax ID / VAT number |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | Status: 'active', 'inactive', 'new', 'overdue' |
| notes | TEXT | | Internal notes about the client |
| user_id | INTEGER | NOT NULL, FK → users.id | Owner/creator of this client record |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_clients_user_id` on `user_id`
- `idx_clients_email` on `email`
- `idx_clients_status` on `status`
- `idx_clients_name` on `name` (for search)

**Relationships:**
- Many-to-one with `users` (user_id)
- One-to-many with `quotations` (client_id)
- One-to-many with `invoices` (client_id)
- One-to-many with `payments` (via invoices)

---

### 3. categories

Stores item categories for organizing services/products.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing category ID |
| name | VARCHAR(255) | NOT NULL | Category name |
| description | TEXT | | Category description |
| color | VARCHAR(7) | NOT NULL | Hex color code (e.g., '#3B82F6') |
| item_count | INTEGER | NOT NULL, DEFAULT 0 | Count of items in this category (denormalized for performance) |
| user_id | INTEGER | NOT NULL, FK → users.id | Owner/creator of this category |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_categories_user_id` on `user_id`
- `idx_categories_name` on `name` (for search)

**Relationships:**
- Many-to-one with `users` (user_id)
- One-to-many with `items` (category_id)

---

### 4. items

Stores service/product items master data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing item ID |
| name | VARCHAR(255) | NOT NULL | Item name |
| description | TEXT | | Item description |
| rate | DECIMAL(10,2) | NOT NULL | Unit price per piece |
| category_id | INTEGER | FK → categories.id | Category this item belongs to |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | Status: 'active' or 'inactive' |
| user_id | INTEGER | NOT NULL, FK → users.id | Owner/creator of this item |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_items_user_id` on `user_id`
- `idx_items_category_id` on `category_id`
- `idx_items_status` on `status`
- `idx_items_name` on `name` (for search)
- Full-text search index on `name` and `description` (for search functionality)

**Relationships:**
- Many-to-one with `users` (user_id)
- Many-to-one with `categories` (category_id)
- One-to-many with `quotation_items` (item_id)
- One-to-many with `invoice_items` (item_id)

---

### 5. quotations

Stores quotation documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing quotation ID |
| number | VARCHAR(50) | UNIQUE, NOT NULL | Quotation number (e.g., 'QT-2024-001') |
| client_id | INTEGER | NOT NULL, FK → clients.id | Client this quotation is for |
| user_id | INTEGER | NOT NULL, FK → users.id | Creator of this quotation |
| issue_date | DATE | NOT NULL | Quotation issue date |
| expiry_date | DATE | NOT NULL | Quotation expiry/valid until date |
| subtotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Subtotal before discount and tax |
| discount_total | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Total discount amount |
| tax_total | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Total tax amount |
| total_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Grand total amount |
| notes | TEXT | | Additional notes for the client |
| terms | TEXT | | Terms and conditions |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | Status: 'draft', 'sent', 'accepted', 'expired' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Document creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_quotations_number` on `number` (UNIQUE)
- `idx_quotations_client_id` on `client_id`
- `idx_quotations_user_id` on `user_id`
- `idx_quotations_status` on `status`
- `idx_quotations_issue_date` on `issue_date`
- `idx_quotations_expiry_date` on `expiry_date`

**Relationships:**
- Many-to-one with `clients` (client_id)
- Many-to-one with `users` (user_id)
- One-to-many with `quotation_items` (quotation_id)
- One-to-one with `invoices` (when converted)
- One-to-many with `share_links` (document_type='quotation', document_id)

---

### 6. quotation_items

Stores line items for quotations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing line item ID |
| quotation_id | INTEGER | NOT NULL, FK → quotations.id | Parent quotation |
| item_id | INTEGER | FK → items.id | Reference to item master (nullable for custom items) |
| name | VARCHAR(255) | NOT NULL | Item name (snapshot at time of creation) |
| description | TEXT | | Item description |
| quantity | DECIMAL(10,2) | NOT NULL, DEFAULT 1 | Quantity |
| price | DECIMAL(10,2) | NOT NULL | Unit price |
| discount_percent | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Discount percentage |
| tax_percent | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Tax percentage |
| line_total | DECIMAL(10,2) | NOT NULL | Calculated line total: (quantity * price * (1 - discount/100)) * (1 + tax/100) |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |

**Indexes:**
- `idx_quotation_items_quotation_id` on `quotation_id`
- `idx_quotation_items_item_id` on `item_id`

**Relationships:**
- Many-to-one with `quotations` (quotation_id)
- Many-to-one with `items` (item_id, nullable)

---

### 7. invoices

Stores invoice documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing invoice ID |
| number | VARCHAR(50) | UNIQUE, NOT NULL | Invoice number (e.g., 'INV-0023') |
| client_id | INTEGER | NOT NULL, FK → clients.id | Client this invoice is for |
| user_id | INTEGER | NOT NULL, FK → users.id | Creator of this invoice |
| issue_date | DATE | NOT NULL | Invoice issue date |
| due_date | DATE | NOT NULL | Payment due date |
| subtotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Subtotal before discount and tax |
| discount_total | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Total discount amount |
| tax_total | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Total tax amount |
| total_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Grand total amount |
| amount_paid | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Total amount paid so far |
| balance_due | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Outstanding balance (total_amount - amount_paid) |
| notes | TEXT | | Additional notes for the client |
| terms | TEXT | | Terms and conditions |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | Status: 'draft', 'sent', 'paid', 'partial', 'overdue' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Document creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| paid_at | TIMESTAMP | | Date when invoice was fully paid |

**Indexes:**
- `idx_invoices_number` on `number` (UNIQUE)
- `idx_invoices_client_id` on `client_id`
- `idx_invoices_user_id` on `user_id`
- `idx_invoices_status` on `status`
- `idx_invoices_issue_date` on `issue_date`
- `idx_invoices_due_date` on `due_date`
- `idx_invoices_balance_due` on `balance_due` (for finding outstanding invoices)

**Relationships:**
- Many-to-one with `clients` (client_id)
- Many-to-one with `users` (user_id)
- One-to-many with `invoice_items` (invoice_id)
- One-to-many with `payments` (invoice_id)
- One-to-many with `share_links` (document_type='invoice', document_id)
- One-to-one with `quotations` (when converted from quotation)

**Computed Fields:**
- `balance_due` = `total_amount` - `amount_paid` (calculated on save)
- `status` is automatically updated based on `balance_due` and `due_date`:
  - If `balance_due` = 0: status = 'paid'
  - Else if `balance_due` < `total_amount`: status = 'partial'
  - Else if `due_date` < CURRENT_DATE and `balance_due` > 0: status = 'overdue'
  - Else if status was 'draft' and sent: status = 'sent'

---

### 8. invoice_items

Stores line items for invoices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing line item ID |
| invoice_id | INTEGER | NOT NULL, FK → invoices.id | Parent invoice |
| item_id | INTEGER | FK → items.id | Reference to item master (nullable for custom items) |
| name | VARCHAR(255) | NOT NULL | Item name (snapshot at time of creation) |
| description | TEXT | | Item description |
| quantity | DECIMAL(10,2) | NOT NULL, DEFAULT 1 | Quantity |
| price | DECIMAL(10,2) | NOT NULL | Unit price |
| discount_percent | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Discount percentage |
| tax_percent | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Tax percentage |
| line_total | DECIMAL(10,2) | NOT NULL | Calculated line total: (quantity * price * (1 - discount/100)) * (1 + tax/100) |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |

**Indexes:**
- `idx_invoice_items_invoice_id` on `invoice_id`
- `idx_invoice_items_item_id` on `item_id`

**Relationships:**
- Many-to-one with `invoices` (invoice_id)
- Many-to-one with `items` (item_id, nullable)

---

### 9. payments

Stores payment records for invoices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing payment ID |
| invoice_id | INTEGER | NOT NULL, FK → invoices.id | Invoice this payment is for |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| payment_date | DATE | NOT NULL | Date payment was received |
| payment_method | VARCHAR(50) | | Payment method: 'cash', 'bank_transfer', 'credit_card', 'check', 'other' |
| notes | TEXT | | Payment notes |
| reference_number | VARCHAR(100) | | Reference/transaction number |
| user_id | INTEGER | NOT NULL, FK → users.id | User who recorded this payment |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Payment record creation timestamp |

**Indexes:**
- `idx_payments_invoice_id` on `invoice_id`
- `idx_payments_payment_date` on `payment_date`
- `idx_payments_user_id` on `user_id`

**Relationships:**
- Many-to-one with `invoices` (invoice_id)
- Many-to-one with `users` (user_id)

**Triggers:**
- After INSERT/UPDATE/DELETE on payments, update `invoices.amount_paid` and `invoices.balance_due`
- After payment update, check if invoice should be marked as 'paid'

---

### 10. company_settings

Stores company profile and configuration settings (one per user).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing settings ID |
| user_id | INTEGER | UNIQUE, NOT NULL, FK → users.id | Owner of these settings |
| company_name | VARCHAR(255) | NOT NULL | Company name |
| logo_url | VARCHAR(500) | | URL/path to company logo |
| registered_address | TEXT | | Registered business address |
| shipping_address | TEXT | | Shipping address |
| email | VARCHAR(255) | | Company email |
| phone | VARCHAR(50) | | Company phone number |
| gst_number | VARCHAR(100) | | GST/TIN number |
| registration_number | VARCHAR(100) | | Business registration number |
| default_tax_rate | DECIMAL(5,2) | NOT NULL, DEFAULT 10.00 | Default tax rate percentage |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code (ISO 4217) |
| date_format | VARCHAR(20) | NOT NULL, DEFAULT 'MM/DD/YYYY' | Date format preference |
| invoice_prefix | VARCHAR(20) | NOT NULL, DEFAULT 'INV-' | Prefix for invoice numbers |
| quotation_prefix | VARCHAR(20) | NOT NULL, DEFAULT 'QT-' | Prefix for quotation numbers |
| terms_template | TEXT | | Default terms and conditions template |
| tax_per_item_enabled | BOOLEAN | NOT NULL, DEFAULT true | Allow different tax rates per item |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Settings creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_company_settings_user_id` on `user_id` (UNIQUE)

**Relationships:**
- One-to-one with `users` (user_id)

---

### 11. share_links

Stores secure share links for quotations and invoices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing share link ID |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Unique token for the share link (UUID) |
| document_type | VARCHAR(20) | NOT NULL | Document type: 'quotation' or 'invoice' |
| document_id | INTEGER | NOT NULL | ID of the quotation or invoice |
| password_hash | VARCHAR(255) | | Bcrypt hashed password (nullable for passwordless links) |
| expires_at | DATE | | Expiration date (nullable for non-expiring links) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether the link is active |
| view_count | INTEGER | NOT NULL, DEFAULT 0 | Number of times the link has been accessed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Link creation timestamp |
| last_accessed_at | TIMESTAMP | | Last access timestamp |

**Indexes:**
- `idx_share_links_token` on `token` (UNIQUE)
- `idx_share_links_document` on `(document_type, document_id)`
- `idx_share_links_is_active` on `is_active`

**Relationships:**
- Many-to-one with `quotations` (document_type='quotation', document_id)
- Many-to-one with `invoices` (document_type='invoice', document_id)

**Security:**
- Token should be a cryptographically secure random UUID
- Password is optional but recommended
- Links can be deactivated without deletion for audit purposes

---

## Database Constraints

### Foreign Key Constraints

1. `clients.user_id` → `users.id` (ON DELETE CASCADE)
2. `categories.user_id` → `users.id` (ON DELETE CASCADE)
3. `items.user_id` → `users.id` (ON DELETE CASCADE)
4. `items.category_id` → `categories.id` (ON DELETE SET NULL)
5. `quotations.client_id` → `clients.id` (ON DELETE RESTRICT)
6. `quotations.user_id` → `users.id` (ON DELETE RESTRICT)
7. `quotation_items.quotation_id` → `quotations.id` (ON DELETE CASCADE)
8. `quotation_items.item_id` → `items.id` (ON DELETE SET NULL)
9. `invoices.client_id` → `clients.id` (ON DELETE RESTRICT)
10. `invoices.user_id` → `users.id` (ON DELETE RESTRICT)
11. `invoice_items.invoice_id` → `invoices.id` (ON DELETE CASCADE)
12. `invoice_items.item_id` → `items.id` (ON DELETE SET NULL)
13. `payments.invoice_id` → `invoices.id` (ON DELETE CASCADE)
14. `payments.user_id` → `users.id` (ON DELETE RESTRICT)
15. `company_settings.user_id` → `users.id` (ON DELETE CASCADE)

### Check Constraints

1. `quotations.total_amount` >= 0
2. `invoices.total_amount` >= 0
3. `invoices.amount_paid` >= 0
4. `invoices.balance_due` >= 0
5. `invoices.amount_paid` <= `invoices.total_amount`
6. `payments.amount` > 0
7. `items.rate` >= 0
8. `quotation_items.quantity` > 0
9. `quotation_items.price` >= 0
10. `quotation_items.discount_percent` >= 0 AND <= 100
11. `quotation_items.tax_percent` >= 0 AND <= 100
12. `invoice_items.quantity` > 0
13. `invoice_items.price` >= 0
14. `invoice_items.discount_percent` >= 0 AND <= 100
15. `invoice_items.tax_percent` >= 0 AND <= 100
16. `quotations.expiry_date` >= `quotations.issue_date`
17. `invoices.due_date` >= `invoices.issue_date`
18. `share_links.document_type` IN ('quotation', 'invoice')

### Unique Constraints

1. `users.email` (UNIQUE)
2. `quotations.number` (UNIQUE per user - consider composite index with user_id)
3. `invoices.number` (UNIQUE per user - consider composite index with user_id)
4. `share_links.token` (UNIQUE)
5. `company_settings.user_id` (UNIQUE - one settings per user)

---

## Database Functions and Triggers

### 1. Update Invoice Totals Trigger

Automatically recalculates invoice totals when line items are added/updated/deleted:

```sql
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET 
        subtotal = (
            SELECT COALESCE(SUM(quantity * price), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        discount_total = (
            SELECT COALESCE(SUM(quantity * price * discount_percent / 100), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        tax_total = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * tax_percent / 100), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * (1 + tax_percent / 100)), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        balance_due = total_amount - amount_paid,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();
```

### 2. Update Quotation Totals Trigger

Similar to invoice totals trigger for quotations:

```sql
CREATE OR REPLACE FUNCTION update_quotation_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotations
    SET 
        subtotal = (
            SELECT COALESCE(SUM(quantity * price), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        discount_total = (
            SELECT COALESCE(SUM(quantity * price * discount_percent / 100), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        tax_total = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * tax_percent / 100), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * (1 + tax_percent / 100)), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotation_totals
AFTER INSERT OR UPDATE OR DELETE ON quotation_items
FOR EACH ROW EXECUTE FUNCTION update_quotation_totals();
```

### 3. Update Invoice Payment Status Trigger

Updates invoice status and amount_paid when payments are added/updated/deleted:

```sql
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record invoices%ROWTYPE;
    total_paid DECIMAL(10,2);
BEGIN
    SELECT * INTO invoice_record
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE invoice_id = invoice_record.id;
    
    UPDATE invoices
    SET 
        amount_paid = total_paid,
        balance_due = total_amount - total_paid,
        status = CASE
            WHEN total_paid = 0 THEN 
                CASE 
                    WHEN due_date < CURRENT_DATE THEN 'overdue'
                    ELSE 'sent'
                END
            WHEN total_paid >= total_amount THEN 'paid'
            WHEN total_paid > 0 THEN 'partial'
            ELSE status
        END,
        paid_at = CASE WHEN total_paid >= total_amount THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = invoice_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_payment_status
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();
```

### 4. Update Category Item Count Trigger

Maintains denormalized item_count in categories table:

```sql
CREATE OR REPLACE FUNCTION update_category_item_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old category count
    IF OLD.category_id IS NOT NULL THEN
        UPDATE categories
        SET item_count = item_count - 1
        WHERE id = OLD.category_id;
    END IF;
    
    -- Update new category count
    IF NEW.category_id IS NOT NULL THEN
        UPDATE categories
        SET item_count = item_count + 1
        WHERE id = NEW.category_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_item_count
AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW EXECUTE FUNCTION update_category_item_count();
```

### 5. Auto-update Updated At Trigger

Automatically updates `updated_at` timestamp:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (repeat for all tables with updated_at)
```

---

## Database Views

### 1. client_summary

Aggregated view of client financial information:

```sql
CREATE VIEW client_summary AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.status,
    COUNT(DISTINCT q.id) as total_quotations,
    COUNT(DISTINCT i.id) as total_invoices,
    COALESCE(SUM(i.total_amount), 0) as total_billed,
    COALESCE(SUM(i.amount_paid), 0) as total_paid,
    COALESCE(SUM(i.balance_due), 0) as outstanding
FROM clients c
LEFT JOIN quotations q ON q.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id, c.name, c.email, c.status;
```

### 2. dashboard_stats

Aggregated statistics for dashboard:

```sql
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM quotations WHERE user_id = :user_id) as total_quotations,
    (SELECT COUNT(*) FROM invoices WHERE user_id = :user_id) as total_invoices,
    (SELECT COALESCE(SUM(balance_due), 0) FROM invoices WHERE user_id = :user_id) as total_outstanding,
    (SELECT COUNT(*) FROM invoices WHERE user_id = :user_id AND status = 'paid') as paid_invoices,
    (SELECT COUNT(*) FROM invoices WHERE user_id = :user_id AND status = 'overdue') as overdue_invoices,
    (SELECT COUNT(*) FROM invoices WHERE user_id = :user_id AND status IN ('sent', 'draft')) as unpaid_invoices;
```

---

## Sample Data Structure

### Example Quotation with Items

```json
{
  "id": 1,
  "number": "QT-2024-001",
  "client_id": 1,
  "client": {
    "id": 1,
    "name": "Acme Corp",
    "email": "john@acme.com"
  },
  "issue_date": "2024-01-15",
  "expiry_date": "2024-02-15",
  "subtotal": 1000.00,
  "discount_total": 50.00,
  "tax_total": 95.00,
  "total_amount": 1045.00,
  "status": "sent",
  "items": [
    {
      "id": 1,
      "item_id": 5,
      "name": "Web Development",
      "description": "Full-stack web application development",
      "quantity": 5,
      "price": 120.00,
      "discount_percent": 5,
      "tax_percent": 10,
      "line_total": 627.00
    },
    {
      "id": 2,
      "item_id": 1,
      "name": "UI/UX Design",
      "description": "Complete user interface design",
      "quantity": 3,
      "price": 150.00,
      "discount_percent": 0,
      "tax_percent": 10,
      "line_total": 495.00
    }
  ]
}
```

### Example Invoice with Payments

```json
{
  "id": 1,
  "number": "INV-0023",
  "client_id": 1,
  "client": {
    "id": 1,
    "name": "Acme Corp",
    "email": "john@acme.com"
  },
  "issue_date": "2024-01-20",
  "due_date": "2024-02-20",
  "subtotal": 1000.00,
  "discount_total": 50.00,
  "tax_total": 95.00,
  "total_amount": 1045.00,
  "amount_paid": 500.00,
  "balance_due": 545.00,
  "status": "partial",
  "items": [...],
  "payments": [
    {
      "id": 1,
      "amount": 500.00,
      "payment_date": "2024-01-25",
      "payment_method": "bank_transfer",
      "reference_number": "TXN-12345"
    }
  ]
}
```

---

## Migration Strategy

1. Create all tables in dependency order (users first, then clients, categories, items, then quotations/invoices)
2. Add foreign key constraints after all tables are created
3. Add indexes after data is loaded (for faster initial load)
4. Add triggers after tables and constraints are in place
5. Create views after all tables are ready

---

## Notes for Backend Implementation

1. **Document Numbering**: Invoice and quotation numbers should be unique per user. Consider using a composite unique constraint: `(user_id, number)` or generate numbers with user prefix.

2. **Soft Deletes**: Consider adding `deleted_at` timestamp columns for soft deletes instead of hard deletes for audit purposes.

3. **Audit Trail**: Consider adding an `audit_log` table to track all changes to important records (invoices, quotations, payments).

4. **Multi-tenancy**: The current schema assumes single-tenant. If multi-tenancy is needed, add a `tenant_id` or `organization_id` column to all tables.

5. **File Attachments**: Consider adding an `attachments` table if document/file attachments are needed for invoices/quotations.

6. **Email Logs**: Consider adding an `email_logs` table to track sent emails (quotations, invoices, reminders).

7. **Recurring Invoices**: If recurring invoices are needed, add a `recurring_invoices` table.

8. **Currency Support**: The schema supports currency codes, but all amounts are stored as DECIMAL. Consider storing currency with each amount if multi-currency is needed.


