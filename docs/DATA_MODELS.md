# Data Models Documentation

## Overview

This document provides detailed specifications for all data models used in the Hisaabu application, including field types, validation rules, default values, and example payloads.

---

## User Model

### Database Table: `users`

**Purpose**: Stores user authentication and profile information.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing user ID |
| email | VARCHAR(255) | Yes | - | Unique, Email format | User email (login identifier) |
| password_hash | VARCHAR(255) | Yes | - | Min 60 chars (bcrypt) | Bcrypt hashed password |
| name | VARCHAR(255) | Yes | - | 2-255 chars | User's full name |
| role | VARCHAR(50) | Yes | 'staff' | Enum: 'admin', 'staff' | User role for access control |
| created_at | TIMESTAMP | Yes | NOW() | - | Account creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |

**Example JSON:**
```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe",
  "role": "admin",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

**Validation Rules:**
- Email must be unique across all users
- Email must match RFC 5322 format
- Password (before hashing) must be minimum 8 characters
- Password must include: uppercase, lowercase, number, special character
- Name must be 2-255 characters

---

## Client Model

### Database Table: `clients`

**Purpose**: Stores client/customer information.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing client ID |
| name | VARCHAR(255) | Yes | - | 1-255 chars | Client's full name |
| email | VARCHAR(255) | Yes | - | Email format, Unique per user | Client email address |
| phone | VARCHAR(50) | No | NULL | Valid phone format | Client phone number |
| address | TEXT | No | NULL | - | Street address |
| city | VARCHAR(100) | No | NULL | - | City |
| postal_code | VARCHAR(20) | No | NULL | - | Postal/ZIP code |
| country | VARCHAR(100) | No | NULL | - | Country |
| company_name | VARCHAR(255) | No | NULL | - | Company name (if applicable) |
| tax_id | VARCHAR(100) | No | NULL | - | Tax ID / VAT number |
| status | VARCHAR(20) | Yes | 'active' | Enum: 'active', 'inactive', 'new', 'overdue' | Client status |
| notes | TEXT | No | NULL | - | Internal notes about client |
| user_id | INTEGER | Yes | - | Foreign Key → users.id | Owner/creator |
| created_at | TIMESTAMP | Yes | NOW() | - | Record creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |

**Computed Fields (not in database):**
- `totalBilled`: Sum of invoice total_amount
- `totalPaid`: Sum of invoice amount_paid
- `outstanding`: totalBilled - totalPaid
- `totalInvoices`: Count of invoices
- `totalQuotations`: Count of quotations

**Example JSON:**
```json
{
  "id": 1,
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1 234 567 8900",
  "address": "123 Main St",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "companyName": "Acme Corporation",
  "taxId": "TAX-12345",
  "status": "active",
  "notes": "Preferred contact method: email",
  "totalBilled": 50000.00,
  "outstanding": 5000.00,
  "totalInvoices": 12,
  "totalQuotations": 5,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

**Validation Rules:**
- Name is required, 1-255 characters
- Email is required, must be valid email format, unique per user
- Phone must be valid format if provided
- Status must be one of: 'active', 'inactive', 'new', 'overdue'

---

## Category Model

### Database Table: `categories`

**Purpose**: Stores item categories for organizing services/products.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing category ID |
| name | VARCHAR(255) | Yes | - | 1-255 chars | Category name |
| description | TEXT | No | NULL | - | Category description |
| color | VARCHAR(7) | Yes | - | Hex color format (#RRGGBB) | Hex color code |
| item_count | INTEGER | Yes | 0 | >= 0 | Count of items (denormalized) |
| user_id | INTEGER | Yes | - | Foreign Key → users.id | Owner/creator |
| created_at | TIMESTAMP | Yes | NOW() | - | Record creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |

**Example JSON:**
```json
{
  "id": 1,
  "name": "Development",
  "description": "Software development services",
  "color": "#3B82F6",
  "itemCount": 12,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

**Validation Rules:**
- Name is required, 1-255 characters
- Color must be valid hex color format (#RRGGBB)
- item_count is automatically maintained via database triggers

---

## Item Model

### Database Table: `items`

**Purpose**: Stores service/product items master data.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing item ID |
| name | VARCHAR(255) | Yes | - | 1-255 chars | Item name |
| description | TEXT | No | NULL | - | Item description |
| rate | DECIMAL(10,2) | Yes | - | >= 0, Max 2 decimals | Unit price per piece |
| category_id | INTEGER | No | NULL | Foreign Key → categories.id | Category (optional) |
| status | VARCHAR(20) | Yes | 'active' | Enum: 'active', 'inactive' | Item status |
| user_id | INTEGER | Yes | - | Foreign Key → users.id | Owner/creator |
| created_at | TIMESTAMP | Yes | NOW() | - | Record creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |

**Computed Fields (for API responses):**
- `categoryName`: Name of the category (from categories table)
- `categoryColor`: Color of the category (from categories table)

**Example JSON:**
```json
{
  "id": 1,
  "name": "Web Development",
  "description": "Full-stack web application development",
  "rate": 120.00,
  "categoryId": 1,
  "categoryName": "Development",
  "categoryColor": "#3B82F6",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

**Validation Rules:**
- Name is required, 1-255 characters
- Rate is required, must be >= 0, maximum 2 decimal places
- Category must exist if provided
- Status must be 'active' or 'inactive'

---

## Quotation Model

### Database Table: `quotations`

**Purpose**: Stores quotation documents.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing quotation ID |
| number | VARCHAR(50) | Yes | Auto | Unique per user | Quotation number |
| client_id | INTEGER | Yes | - | Foreign Key → clients.id | Client |
| user_id | INTEGER | Yes | - | Foreign Key → users.id | Creator |
| issue_date | DATE | Yes | - | Valid date | Quotation issue date |
| expiry_date | DATE | Yes | - | Valid date, >= issue_date | Quotation expiry date |
| subtotal | DECIMAL(10,2) | Yes | 0 | >= 0 | Subtotal before discount/tax |
| discount_total | DECIMAL(10,2) | Yes | 0 | >= 0 | Total discount amount |
| tax_total | DECIMAL(10,2) | Yes | 0 | >= 0 | Total tax amount |
| total_amount | DECIMAL(10,2) | Yes | 0 | >= 0 | Grand total amount |
| notes | TEXT | No | NULL | - | Additional notes |
| terms | TEXT | No | NULL | - | Terms and conditions |
| status | VARCHAR(20) | Yes | 'draft' | Enum: 'draft', 'sent', 'accepted', 'expired' | Quotation status |
| created_at | TIMESTAMP | Yes | NOW() | - | Document creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |

**Related Data:**
- `items`: Array of QuotationItem objects
- `client`: Client object (populated in API responses)

**Example JSON:**
```json
{
  "id": 1,
  "number": "QT-2024-001",
  "clientId": 1,
  "client": {
    "id": 1,
    "name": "Acme Corp",
    "email": "contact@acme.com"
  },
  "issueDate": "2024-01-15",
  "expiryDate": "2024-02-15",
  "subtotal": 1000.00,
  "discountTotal": 50.00,
  "taxTotal": 95.00,
  "totalAmount": 1045.00,
  "notes": "Please review and confirm",
  "terms": "Payment terms: Net 30",
  "status": "sent",
  "items": [
    {
      "id": 1,
      "itemId": 5,
      "name": "Web Development",
      "description": "Full-stack web application development",
      "quantity": 5,
      "price": 120.00,
      "discountPercent": 5,
      "taxPercent": 10,
      "lineTotal": 627.00,
      "sortOrder": 0
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

**Validation Rules:**
- Client must exist
- Issue date must be valid date
- Expiry date must be valid date and >= issue date
- At least one line item required
- Status must be one of: 'draft', 'sent', 'accepted', 'expired'
- Totals are automatically calculated

---

## QuotationItem Model

### Database Table: `quotation_items`

**Purpose**: Stores line items for quotations.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing line item ID |
| quotation_id | INTEGER | Yes | - | Foreign Key → quotations.id | Parent quotation |
| item_id | INTEGER | No | NULL | Foreign Key → items.id | Reference to item master |
| name | VARCHAR(255) | Yes | - | 1-255 chars | Item name (snapshot) |
| description | TEXT | No | NULL | - | Item description (snapshot) |
| quantity | DECIMAL(10,2) | Yes | 1 | > 0 | Quantity |
| price | DECIMAL(10,2) | Yes | - | >= 0 | Unit price |
| discount_percent | DECIMAL(5,2) | Yes | 0 | 0-100 | Discount percentage |
| tax_percent | DECIMAL(5,2) | Yes | 0 | 0-100 | Tax percentage |
| line_total | DECIMAL(10,2) | Yes | - | >= 0 | Calculated line total |
| sort_order | INTEGER | Yes | 0 | >= 0 | Display order |

**Example JSON:**
```json
{
  "id": 1,
  "quotationId": 1,
  "itemId": 5,
  "name": "Web Development",
  "description": "Full-stack web application development",
  "quantity": 5,
  "price": 120.00,
  "discountPercent": 5,
  "taxPercent": 10,
  "lineTotal": 627.00,
  "sortOrder": 0
}
```

**Validation Rules:**
- Quantity must be > 0
- Price must be >= 0
- Discount percent must be 0-100
- Tax percent must be 0-100
- Line total is automatically calculated

**Calculation:**
```
lineTotal = (quantity × price × (1 - discountPercent/100)) × (1 + taxPercent/100)
```

---

## Invoice Model

### Database Table: `invoices`

**Purpose**: Stores invoice documents.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing invoice ID |
| number | VARCHAR(50) | Yes | Auto | Unique per user | Invoice number |
| client_id | INTEGER | Yes | - | Foreign Key → clients.id | Client |
| user_id | INTEGER | Yes | - | Foreign Key → users.id | Creator |
| issue_date | DATE | Yes | - | Valid date | Invoice issue date |
| due_date | DATE | Yes | - | Valid date, >= issue_date | Payment due date |
| subtotal | DECIMAL(10,2) | Yes | 0 | >= 0 | Subtotal before discount/tax |
| discount_total | DECIMAL(10,2) | Yes | 0 | >= 0 | Total discount amount |
| tax_total | DECIMAL(10,2) | Yes | 0 | >= 0 | Total tax amount |
| total_amount | DECIMAL(10,2) | Yes | 0 | >= 0 | Grand total amount |
| amount_paid | DECIMAL(10,2) | Yes | 0 | >= 0, <= total_amount | Total amount paid |
| balance_due | DECIMAL(10,2) | Yes | 0 | >= 0 | Outstanding balance |
| notes | TEXT | No | NULL | - | Additional notes |
| terms | TEXT | No | NULL | - | Terms and conditions |
| status | VARCHAR(20) | Yes | 'draft' | Enum: 'draft', 'sent', 'paid', 'partial', 'overdue' | Invoice status |
| created_at | TIMESTAMP | Yes | NOW() | - | Document creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |
| paid_at | TIMESTAMP | No | NULL | - | Date when fully paid |

**Related Data:**
- `items`: Array of InvoiceItem objects
- `payments`: Array of Payment objects
- `client`: Client object (populated in API responses)

**Example JSON:**
```json
{
  "id": 1,
  "number": "INV-0023",
  "clientId": 1,
  "client": {
    "id": 1,
    "name": "Acme Corp",
    "email": "contact@acme.com"
  },
  "issueDate": "2024-01-20",
  "dueDate": "2024-02-20",
  "subtotal": 1000.00,
  "discountTotal": 50.00,
  "taxTotal": 95.00,
  "totalAmount": 1045.00,
  "amountPaid": 500.00,
  "balanceDue": 545.00,
  "notes": "Thank you for your business",
  "terms": "Payment terms: Net 30",
  "status": "partial",
  "items": [ /* ... */ ],
  "payments": [
    {
      "id": 1,
      "amount": 500.00,
      "paymentDate": "2024-01-25",
      "paymentMethod": "bank_transfer",
      "referenceNumber": "TXN-12345",
      "notes": "Partial payment",
      "createdAt": "2024-01-25T10:00:00Z"
    }
  ],
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-25T15:30:00Z",
  "paidAt": null
}
```

**Validation Rules:**
- Client must exist
- Issue date must be valid date
- Due date must be valid date and >= issue date
- At least one line item required
- Status must be one of: 'draft', 'sent', 'paid', 'partial', 'overdue'
- amount_paid must be <= total_amount
- balance_due = total_amount - amount_paid (auto-calculated)
- Status is automatically updated based on payments and due date

---

## InvoiceItem Model

### Database Table: `invoice_items`

**Purpose**: Stores line items for invoices.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing line item ID |
| invoice_id | INTEGER | Yes | - | Foreign Key → invoices.id | Parent invoice |
| item_id | INTEGER | No | NULL | Foreign Key → items.id | Reference to item master |
| name | VARCHAR(255) | Yes | - | 1-255 chars | Item name (snapshot) |
| description | TEXT | No | NULL | - | Item description (snapshot) |
| quantity | DECIMAL(10,2) | Yes | 1 | > 0 | Quantity |
| price | DECIMAL(10,2) | Yes | - | >= 0 | Unit price |
| discount_percent | DECIMAL(5,2) | Yes | 0 | 0-100 | Discount percentage |
| tax_percent | DECIMAL(5,2) | Yes | 0 | 0-100 | Tax percentage |
| line_total | DECIMAL(10,2) | Yes | - | >= 0 | Calculated line total |
| sort_order | INTEGER | Yes | 0 | >= 0 | Display order |

**Example JSON:** (Same format as QuotationItem)

**Validation Rules:** (Same as QuotationItem)

---

## Payment Model

### Database Table: `payments`

**Purpose**: Stores payment records for invoices.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing payment ID |
| invoice_id | INTEGER | Yes | - | Foreign Key → invoices.id | Invoice |
| amount | DECIMAL(10,2) | Yes | - | > 0, <= invoice balance | Payment amount |
| payment_date | DATE | Yes | - | Valid date | Payment date |
| payment_method | VARCHAR(50) | No | NULL | Enum: 'cash', 'bank_transfer', 'credit_card', 'check', 'other' | Payment method |
| notes | TEXT | No | NULL | - | Payment notes |
| reference_number | VARCHAR(100) | No | NULL | - | Reference/transaction number |
| user_id | INTEGER | Yes | - | Foreign Key → users.id | User who recorded payment |
| created_at | TIMESTAMP | Yes | NOW() | - | Payment record creation timestamp |

**Example JSON:**
```json
{
  "id": 1,
  "invoiceId": 1,
  "amount": 500.00,
  "paymentDate": "2024-01-25",
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN-12345",
  "notes": "Partial payment",
  "createdAt": "2024-01-25T10:00:00Z"
}
```

**Validation Rules:**
- Amount must be > 0
- Amount cannot exceed invoice balance_due
- Payment date must be valid date
- Payment method must be one of valid methods if provided

**Side Effects:**
- When payment is created/updated/deleted, invoice `amount_paid` and `balance_due` are recalculated
- Invoice status is automatically updated

---

## CompanySettings Model

### Database Table: `company_settings`

**Purpose**: Stores company profile and configuration settings (one per user).

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing settings ID |
| user_id | INTEGER | Yes | - | Foreign Key → users.id, Unique | Owner |
| company_name | VARCHAR(255) | Yes | - | 1-255 chars | Company name |
| logo_url | VARCHAR(500) | No | NULL | Valid URL | Logo URL/path |
| registered_address | TEXT | No | NULL | - | Registered business address |
| shipping_address | TEXT | No | NULL | - | Shipping address |
| email | VARCHAR(255) | No | NULL | Email format | Company email |
| phone | VARCHAR(50) | No | NULL | - | Company phone |
| gst_number | VARCHAR(100) | No | NULL | - | GST/TIN number |
| registration_number | VARCHAR(100) | No | NULL | - | Business registration number |
| default_tax_rate | DECIMAL(5,2) | Yes | 10.00 | 0-100 | Default tax rate % |
| currency | VARCHAR(3) | Yes | 'USD' | ISO 4217 code | Currency code |
| date_format | VARCHAR(20) | Yes | 'MM/DD/YYYY' | Valid format | Date format |
| invoice_prefix | VARCHAR(20) | Yes | 'INV-' | 1-20 chars | Invoice number prefix |
| quotation_prefix | VARCHAR(20) | Yes | 'QT-' | 1-20 chars | Quotation number prefix |
| terms_template | TEXT | No | NULL | - | Default terms template |
| tax_per_item_enabled | BOOLEAN | Yes | true | - | Allow different tax per item |
| created_at | TIMESTAMP | Yes | NOW() | - | Settings creation timestamp |
| updated_at | TIMESTAMP | Yes | NOW() | - | Last update timestamp |

**Example JSON:**
```json
{
  "companyName": "My Company",
  "logoUrl": "https://example.com/logo.png",
  "registeredAddress": "123 Main St, City, Country",
  "shippingAddress": "123 Main St, City, Country",
  "email": "contact@company.com",
  "phone": "+1 234 567 8900",
  "gstNumber": "GST-12345",
  "registrationNumber": "REG-12345",
  "defaultTaxRate": 10.00,
  "defaultTaxId": 1,
  "defaultTax": {
    "id": 1,
    "name": "GST",
    "rate": 10.00,
    "isDefault": true
  },
  "taxes": [
    {
      "id": 1,
      "name": "GST",
      "rate": 10.00,
      "isDefault": true
    },
    {
      "id": 2,
      "name": "Service Tax",
      "rate": 5.00,
      "isDefault": false
    }
  ],
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "invoicePrefix": "INV-",
  "quotationPrefix": "QT-",
  "termsTemplate": "Payment terms: Net 30",
  "taxPerItemEnabled": true
}
```

**Validation Rules:**
- Company name is required
- Email must be valid format if provided
- Currency must be valid ISO 4217 code
- Date format must be valid format string
- Tax rate must be 0-100

---

## ShareLink Model

### Database Table: `share_links`

**Purpose**: Stores secure share links for quotations and invoices.

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | INTEGER | Yes | Auto | Primary Key | Auto-incrementing share link ID |
| token | VARCHAR(255) | Yes | Auto | Unique, UUID v4 | Unique token |
| document_type | VARCHAR(20) | Yes | - | Enum: 'quotation', 'invoice' | Document type |
| document_id | INTEGER | Yes | - | Foreign Key | Document ID |
| password_hash | VARCHAR(255) | No | NULL | Bcrypt hash | Hashed password (optional) |
| expires_at | DATE | No | NULL | Valid date | Expiration date (optional) |
| is_active | BOOLEAN | Yes | true | - | Whether link is active |
| view_count | INTEGER | Yes | 0 | >= 0 | Number of views |
| created_at | TIMESTAMP | Yes | NOW() | - | Link creation timestamp |
| last_accessed_at | TIMESTAMP | No | NULL | - | Last access timestamp |

**Example JSON:**
```json
{
  "id": 1,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://app.hisaabu.com/share/invoice/550e8400-e29b-41d4-a716-446655440000",
  "documentType": "invoice",
  "documentId": 1,
  "hasPassword": true,
  "expiresAt": "2024-12-31",
  "isActive": true,
  "viewCount": 5,
  "createdAt": "2024-01-25T10:00:00Z",
  "lastAccessedAt": "2024-01-26T14:30:00Z"
}
```

**Validation Rules:**
- Token is auto-generated (UUID v4)
- Document type must be 'quotation' or 'invoice'
- Document must exist
- Password is optional but recommended
- Expiry date must be in the future if provided

---

## Data Transformation

### API Request → Database

1. **CamelCase → snake_case**: API uses camelCase, database uses snake_case
   - `clientId` → `client_id`
   - `issueDate` → `issue_date`
   - `totalAmount` → `total_amount`

2. **Date Format**: API uses ISO 8601 strings, database uses DATE/TIMESTAMP
   - `"2024-01-15"` → `DATE '2024-01-15'`
   - `"2024-01-15T10:00:00Z"` → `TIMESTAMP '2024-01-15 10:00:00'`

3. **Decimal Precision**: API uses numbers, database uses DECIMAL(10,2)
   - `120.5` → `DECIMAL(120.50)`

### Database → API Response

1. **snake_case → CamelCase**: Convert database fields to camelCase
2. **Date Formatting**: Convert dates to ISO 8601 strings
3. **Related Data**: Populate related objects (client, items, payments)
4. **Computed Fields**: Add computed fields (totalBilled, outstanding, etc.)

---

## Enum Values

### Client Status
- `active`: Normal active client
- `inactive`: Archived client
- `new`: Recently added (first 30 days)
- `overdue`: Has overdue invoices

### Item Status
- `active`: Item is available for use
- `inactive`: Item is archived

### Quotation Status
- `draft`: Created but not sent
- `sent`: Sent to client
- `accepted`: Client accepted
- `expired`: Expiry date passed

### Invoice Status
- `draft`: Created but not sent
- `sent`: Sent to client
- `partial`: Partially paid
- `paid`: Fully paid
- `overdue`: Due date passed, unpaid

### Payment Method
- `cash`: Cash payment
- `bank_transfer`: Bank transfer
- `credit_card`: Credit card
- `check`: Check payment
- `other`: Other method

### User Role
- `admin`: Administrator (full access)
- `staff`: Staff member (limited access)

---

## Default Values

### Quotation
- `status`: 'draft'
- `subtotal`: 0
- `discount_total`: 0
- `tax_total`: 0
- `total_amount`: 0

### Invoice
- `status`: 'draft'
- `subtotal`: 0
- `discount_total`: 0
- `tax_total`: 0
- `total_amount`: 0
- `amount_paid`: 0
- `balance_due`: 0

### Company Settings
- `default_tax_rate`: 10.00
- `currency`: 'USD'
- `date_format`: 'MM/DD/YYYY'
- `invoice_prefix`: 'INV-'
- `quotation_prefix`: 'QT-'
- `tax_per_item_enabled`: true

---

## Data Relationships

### One-to-Many
- User → Clients
- User → Quotations
- User → Invoices
- User → Items
- User → Categories
- Client → Quotations
- Client → Invoices
- Category → Items
- Quotation → QuotationItems
- Invoice → InvoiceItems
- Invoice → Payments

### One-to-One
- User → CompanySettings

### Many-to-One
- QuotationItem → Item (optional)
- InvoiceItem → Item (optional)

---

## Notes for Backend Implementation

1. **Field Naming**: Use snake_case in database, convert to camelCase in API responses.

2. **Date Handling**: Store dates as DATE/TIMESTAMP in database, return as ISO 8601 strings in API.

3. **Decimal Precision**: Use DECIMAL(10,2) for all monetary values to ensure precision.

4. **Auto-calculation**: Totals are automatically calculated via database triggers or application logic.

5. **Status Updates**: Status fields are automatically updated based on business logic.

6. **Soft Deletes**: Consider adding `deleted_at` timestamp for soft deletes instead of hard deletes.

7. **Audit Trail**: Consider adding `created_by` and `updated_by` fields to track user actions.

8. **Timestamps**: All tables should have `created_at` and `updated_at` timestamps.

9. **Validation**: Validate all data on the server side, even if frontend validates.

10. **Data Integrity**: Use foreign key constraints and database triggers to maintain data integrity.


