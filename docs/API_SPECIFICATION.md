# API Specification

## Overview

This document describes the complete REST API for the Hisaabu Invoice & Quotation Management application. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `https://api.hisaabu.com/v1` (or `http://localhost:3000/api/v1` for development)

**API Version**: v1

**Content-Type**: `application/json`

---

## Authentication

All protected endpoints require authentication via JWT (JSON Web Token) in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already exists

---

#### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expiresIn": 3600
  }
}
```

---

#### POST /auth/logout

Logout user (invalidate refresh token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### POST /auth/reset-password

Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## Clients API

### GET /clients

Get list of clients with optional filtering and pagination.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page
- `search` (string) - Search by name, email, or phone
- `status` (string) - Filter by status: 'all', 'active', 'inactive', 'new', 'overdue'
- `sort` (string, default: 'created_at') - Sort field
- `order` (string, default: 'desc') - Sort order: 'asc' or 'desc'

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "clients": [
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
        "totalBilled": 50000.00,
        "outstanding": 5000.00,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### GET /clients/:id

Get client details by ID.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "client": {
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
  }
}
```

**Error Responses:**
- `404 Not Found` - Client not found

---

### POST /clients

Create a new client.

**Request Body:**
```json
{
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
  "notes": "Preferred contact method: email"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "client": {
      "id": 1,
      "name": "Acme Corp",
      "email": "contact@acme.com",
      // ... all fields
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already exists

---

### PUT /clients/:id

Update an existing client.

**Request Body:** (same as POST, all fields optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "client": {
      "id": 1,
      // ... updated fields
    }
  }
}
```

**Error Responses:**
- `404 Not Found` - Client not found
- `400 Bad Request` - Validation errors

---

### DELETE /clients/:id

Delete a client.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Client not found
- `409 Conflict` - Client has associated invoices/quotations

---

## Items API

### GET /items

Get list of items with optional filtering.

**Query Parameters:**
- `page`, `limit`, `search` - Same as clients
- `categoryId` (integer) - Filter by category
- `status` (string) - Filter by status: 'all', 'active', 'inactive'

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
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
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### GET /items/:id

Get item details by ID.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "item": {
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
  }
}
```

---

### POST /items

Create a new item.

**Request Body:**
```json
{
  "name": "Web Development",
  "description": "Full-stack web application development",
  "rate": 120.00,
  "categoryId": 1,
  "status": "active"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "item": { /* ... */ }
  }
}
```

---

### PUT /items/:id

Update an existing item.

**Request Body:** (same as POST, all fields optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": {
    "item": { /* ... */ }
  }
}
```

---

### DELETE /items/:id

Delete an item.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## Categories API

### GET /categories

Get list of categories.

**Query Parameters:**
- `page`, `limit`, `search` - Standard pagination and search

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Development",
        "description": "Software development services",
        "color": "#3B82F6",
        "itemCount": 12,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### GET /categories/:id

Get category details by ID.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "name": "Development",
      "description": "Software development services",
      "color": "#3B82F6",
      "itemCount": 12,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  }
}
```

---

### POST /categories

Create a new category.

**Request Body:**
```json
{
  "name": "Development",
  "description": "Software development services",
  "color": "#3B82F6"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": { /* ... */ }
  }
}
```

---

### PUT /categories/:id

Update an existing category.

**Request Body:** (same as POST, all fields optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "category": { /* ... */ }
  }
}
```

---

### DELETE /categories/:id

Delete a category.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Note:** Items in this category will have their `categoryId` set to NULL.

---

## Quotations API

### GET /quotations

Get list of quotations with optional filtering.

**Query Parameters:**
- `page`, `limit`, `search` - Standard pagination and search
- `status` (string) - Filter by status: 'all', 'draft', 'sent', 'accepted', 'expired'
- `clientId` (integer) - Filter by client
- `dateFrom` (date) - Filter from date
- `dateTo` (date) - Filter to date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "quotations": [
      {
        "id": 1,
        "number": "QT-2024-001",
        "clientId": 1,
        "clientName": "Acme Corp",
        "issueDate": "2024-01-15",
        "expiryDate": "2024-02-15",
        "subtotal": 1000.00,
        "discountTotal": 50.00,
        "taxTotal": 95.00,
        "totalAmount": 1045.00,
        "status": "sent",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T15:30:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### GET /quotations/:id

Get quotation details by ID with line items.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "quotation": {
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
  }
}
```

---

### POST /quotations

Create a new quotation.

**Request Body:**
```json
{
  "clientId": 1,
  "issueDate": "2024-01-15",
  "expiryDate": "2024-02-15",
  "notes": "Please review and confirm",
  "terms": "Payment terms: Net 30",
  "status": "draft",
  "items": [
    {
      "itemId": 5,
      "name": "Web Development",
      "description": "Full-stack web application development",
      "quantity": 5,
      "price": 120.00,
      "discountPercent": 5,
      "taxPercent": 10
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Quotation created successfully",
  "data": {
    "quotation": {
      "id": 1,
      "number": "QT-2024-001",
      // ... all fields with calculated totals
    }
  }
}
```

**Note:** The `number` is auto-generated based on user's quotation prefix setting.

---

### PUT /quotations/:id

Update an existing quotation.

**Request Body:** (same as POST, all fields optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Quotation updated successfully",
  "data": {
    "quotation": { /* ... */ }
  }
}
```

---

### DELETE /quotations/:id

Delete a quotation.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Quotation deleted successfully"
}
```

---

### POST /quotations/:id/convert

Convert a quotation to an invoice.

**Request Body:**
```json
{
  "issueDate": "2024-01-20",
  "dueDate": "2024-02-20"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Quotation converted to invoice successfully",
  "data": {
    "invoice": {
      "id": 1,
      "number": "INV-0023",
      // ... invoice details copied from quotation
    }
  }
}
```

---

### POST /quotations/:id/send

Send quotation to client via email.

**Request Body:**
```json
{
  "email": "client@example.com",
  "subject": "Quotation #QT-2024-001",
  "message": "Please find attached quotation"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Quotation sent successfully"
}
```

---

## Invoices API

### GET /invoices

Get list of invoices with optional filtering.

**Query Parameters:**
- `page`, `limit`, `search` - Standard pagination and search
- `status` (string) - Filter by status: 'all', 'draft', 'sent', 'paid', 'partial', 'overdue'
- `clientId` (integer) - Filter by client
- `dateFrom`, `dateTo` - Date range filter

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 1,
        "number": "INV-0023",
        "clientId": 1,
        "clientName": "Acme Corp",
        "issueDate": "2024-01-20",
        "dueDate": "2024-02-20",
        "subtotal": 1000.00,
        "discountTotal": 50.00,
        "taxTotal": 95.00,
        "totalAmount": 1045.00,
        "amountPaid": 500.00,
        "balanceDue": 545.00,
        "status": "partial",
        "createdAt": "2024-01-20T10:00:00Z",
        "updatedAt": "2024-01-25T15:30:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### GET /invoices/:id

Get invoice details by ID with line items and payments.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invoice": {
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
      "updatedAt": "2024-01-25T15:30:00Z"
    }
  }
}
```

---

### POST /invoices

Create a new invoice.

**Request Body:**
```json
{
  "clientId": 1,
  "issueDate": "2024-01-20",
  "dueDate": "2024-02-20",
  "notes": "Thank you for your business",
  "terms": "Payment terms: Net 30",
  "status": "draft",
  "items": [
    {
      "itemId": 5,
      "name": "Web Development",
      "description": "Full-stack web application development",
      "quantity": 5,
      "price": 120.00,
      "discountPercent": 5,
      "taxPercent": 10
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoice": {
      "id": 1,
      "number": "INV-0023",
      // ... all fields with calculated totals
    }
  }
}
```

---

### PUT /invoices/:id

Update an existing invoice.

**Request Body:** (same as POST, all fields optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invoice updated successfully",
  "data": {
    "invoice": { /* ... */ }
  }
}
```

---

### DELETE /invoices/:id

Delete an invoice.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

---

### POST /invoices/:id/send

Send invoice to client via email.

**Request Body:**
```json
{
  "email": "client@example.com",
  "subject": "Invoice #INV-0023",
  "message": "Please find attached invoice"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invoice sent successfully"
}
```

---

### POST /invoices/:id/payments

Record a payment for an invoice.

**Request Body:**
```json
{
  "amount": 500.00,
  "paymentDate": "2024-01-25",
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN-12345",
  "notes": "Partial payment"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment": {
      "id": 1,
      "invoiceId": 1,
      "amount": 500.00,
      "paymentDate": "2024-01-25",
      "paymentMethod": "bank_transfer",
      "referenceNumber": "TXN-12345",
      "notes": "Partial payment",
      "createdAt": "2024-01-25T10:00:00Z"
    },
    "invoice": {
      "id": 1,
      "amountPaid": 500.00,
      "balanceDue": 545.00,
      "status": "partial"
    }
  }
}
```

**Note:** Invoice status and totals are automatically updated.

---

### PUT /invoices/:id/payments/:paymentId

Update a payment record.

**Request Body:** (same as POST, all fields optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Payment updated successfully",
  "data": {
    "payment": { /* ... */ },
    "invoice": { /* ... */ }
  }
}
```

---

### DELETE /invoices/:id/payments/:paymentId

Delete a payment record.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Payment deleted successfully",
  "data": {
    "invoice": {
      "id": 1,
      "amountPaid": 0.00,
      "balanceDue": 1045.00,
      "status": "sent"
    }
  }
}
```

---

## Dashboard API

### GET /dashboard/stats

Get dashboard statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalQuotations": 25,
    "totalInvoices": 45,
    "totalOutstanding": 12450.00,
    "paidInvoices": 30,
    "unpaidInvoices": 10,
    "overdueInvoices": 5,
    "recentActivity": [
      {
        "type": "payment",
        "title": "Invoice #1024 Paid",
        "client": "Acme Corp",
        "amount": 4500.00,
        "timestamp": "2024-01-25T10:00:00Z"
      }
    ]
  }
}
```

---

## Settings API

### GET /settings

Get company settings for the authenticated user.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "settings": {
      "companyName": "My Company",
      "logoUrl": "https://example.com/logo.png",
      "registeredAddress": "123 Main St, City, Country",
      "shippingAddress": "123 Main St, City, Country",
      "email": "contact@company.com",
      "phone": "+1 234 567 8900",
      "gstNumber": "GST-12345",
      "registrationNumber": "REG-12345",
      "defaultTaxRate": 10.00,
      "currency": "USD",
      "dateFormat": "MM/DD/YYYY",
      "invoicePrefix": "INV-",
      "quotationPrefix": "QT-",
      "termsTemplate": "Payment terms: Net 30",
      "taxPerItemEnabled": true
    }
  }
}
```

---

### PUT /settings

Update company settings.

**Request Body:**
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
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "invoicePrefix": "INV-",
  "quotationPrefix": "QT-",
  "termsTemplate": "Payment terms: Net 30",
  "taxPerItemEnabled": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": { /* ... */ }
  }
}
```

---

### POST /settings/logo

Upload company logo.

**Request:** `multipart/form-data`
- `logo` (file) - Image file (max 5MB, formats: jpg, png, gif)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "logoUrl": "https://example.com/uploads/logo_12345.png"
  }
}
```

---

## Share Links API

### POST /share-links

Generate a secure share link for a quotation or invoice.

**Request Body:**
```json
{
  "documentType": "invoice",
  "documentId": 1,
  "password": "optional_password",
  "expiresAt": "2024-12-31"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Share link created successfully",
  "data": {
    "shareLink": {
      "id": 1,
      "token": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://app.hisaabu.com/share/invoice/550e8400-e29b-41d4-a716-446655440000",
      "documentType": "invoice",
      "documentId": 1,
      "hasPassword": true,
      "expiresAt": "2024-12-31",
      "isActive": true,
      "viewCount": 0,
      "createdAt": "2024-01-25T10:00:00Z"
    }
  }
}
```

---

### GET /share-links/:token

Get share link details (for validation).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "shareLink": {
      "id": 1,
      "token": "550e8400-e29b-41d4-a716-446655440000",
      "documentType": "invoice",
      "documentId": 1,
      "hasPassword": true,
      "expiresAt": "2024-12-31",
      "isActive": true,
      "viewCount": 5
    }
  }
}
```

---

### POST /share-links/:token/verify

Verify password for a share link.

**Request Body:**
```json
{
  "password": "user_entered_password"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password verified",
  "data": {
    "document": {
      // Full invoice or quotation object
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid password
- `404 Not Found` - Share link not found or expired
- `410 Gone` - Share link is inactive

---

### DELETE /share-links/:token

Deactivate a share link.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Share link deactivated successfully"
}
```

---

## PDF Generation API

### GET /quotations/:id/pdf

Generate PDF for a quotation.

**Response:** `200 OK`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="QT-2024-001.pdf"`

**Error Responses:**
- `404 Not Found` - Quotation not found

---

### GET /invoices/:id/pdf

Generate PDF for an invoice.

**Response:** `200 OK`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="INV-0023.pdf"`

**Error Responses:**
- `404 Not Found` - Invoice not found

---

## Public Share API (No Authentication Required)

### GET /public/share/:token

Get document via share link (public endpoint, no auth required).

**Query Parameters:**
- `password` (string) - Password if link is password-protected

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "document": {
      // Full invoice or quotation object
    },
    "company": {
      // Company settings for branding
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Password required or incorrect
- `404 Not Found` - Share link not found
- `410 Gone` - Share link expired or inactive

---

### POST /public/share/:token/acknowledge

Acknowledge receipt of document (optional).

**Request Body:**
```json
{
  "acknowledged": true,
  "notes": "Received and reviewed"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Document acknowledged"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details, validation errors, etc.
    }
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

### Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Email must be valid"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour per user
- **Unauthenticated requests**: 100 requests per hour per IP
- **Password reset**: 5 requests per hour per email

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

When rate limit is exceeded, returns `429 Too Many Requests`.

---

## Pagination

List endpoints support pagination with the following query parameters:

- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Sorting

List endpoints support sorting with the following query parameters:

- `sort` (string) - Field to sort by (default: 'created_at')
- `order` (string) - Sort order: 'asc' or 'desc' (default: 'desc')

Example: `GET /clients?sort=name&order=asc`

---

## Search

List endpoints support search with the `search` query parameter. Search is performed on relevant fields (name, email, description, etc.) depending on the resource.

Example: `GET /clients?search=acme`

---

## Notes for Backend Implementation

1. **JWT Token Expiry**: Access tokens expire after 1 hour. Refresh tokens expire after 7 days.

2. **Password Requirements**: Minimum 8 characters, must include uppercase, lowercase, number, and special character.

3. **Document Numbering**: Invoice and quotation numbers are auto-generated based on user's prefix settings and should be unique per user.

4. **Automatic Calculations**: Totals (subtotal, discount, tax, grand total) are automatically calculated when line items are added/updated.

5. **Status Updates**: Invoice status is automatically updated based on payment amounts and due dates.

6. **File Uploads**: Logo uploads should be validated (file type, size) and stored securely. Consider using cloud storage (S3, Cloudinary) for production.

7. **PDF Generation**: Use a library like `pdfkit`, `puppeteer`, or `jsPDF` for PDF generation. Include company branding and all document details.

8. **Email Sending**: Use a service like SendGrid, Mailgun, or AWS SES for sending emails. Include PDF attachments when sending invoices/quotations.

9. **Share Link Security**: Generate cryptographically secure random tokens (UUID v4). Hash passwords with bcrypt. Validate expiration dates and active status.

10. **CORS**: Configure CORS to allow requests from the frontend domain.

11. **Input Validation**: Validate all input data on the server side. Use a validation library like `joi` or `express-validator`.

12. **Error Handling**: Implement comprehensive error handling. Log errors for debugging but don't expose sensitive information to clients.

13. **Database Transactions**: Use database transactions for operations that modify multiple tables (e.g., creating invoice with items and payments).

14. **Caching**: Consider caching frequently accessed data (settings, dashboard stats) with Redis or similar.

15. **Webhooks**: Consider implementing webhooks for events like invoice paid, quotation accepted, etc.



