# Backend Implementation Plan & Next Steps

## Current Status

✅ **Completed:**
- Frontend UI (React) with all screens
- Database schema created and migrated
- Complete API specification documentation
- Data models and validation rules documented

🚧 **To Be Implemented:**
- Express.js backend server
- All API endpoints
- Authentication system (JWT)
- Database connection and queries
- PDF generation
- Share link system

---

## Phase 1: Backend Foundation Setup

### Step 1.1: Initialize Backend Project

**Location**: `/backend/`

**Tasks:**
1. Create `package.json` with dependencies:
   - express
   - pg (PostgreSQL client)
   - jsonwebtoken
   - bcrypt
   - dotenv
   - cors
   - express-validator (or joi)
   - multer (for file uploads)
   - pdfkit or puppeteer (for PDF generation)

2. Create project structure:
   ```
   backend/
   ├── src/
   │   ├── config/
   │   │   ├── database.js      # PostgreSQL connection
   │   │   └── jwt.js            # JWT configuration
   │   ├── middleware/
   │   │   ├── auth.js           # JWT authentication middleware
   │   │   ├── errorHandler.js  # Global error handler
   │   │   └── validator.js     # Request validation
   │   ├── controllers/
   │   │   ├── authController.js
   │   │   ├── clientController.js
   │   │   ├── itemController.js
   │   │   ├── categoryController.js
   │   │   ├── quotationController.js
   │   │   ├── invoiceController.js
   │   │   ├── paymentController.js
   │   │   ├── settingsController.js
   │   │   ├── shareLinkController.js
   │   │   └── dashboardController.js
   │   ├── routes/
   │   │   ├── auth.js
   │   │   ├── clients.js
   │   │   ├── items.js
   │   │   ├── categories.js
   │   │   ├── quotations.js
   │   │   ├── invoices.js
   │   │   ├── payments.js
   │   │   ├── settings.js
   │   │   ├── shareLinks.js
   │   │   └── dashboard.js
   │   ├── utils/
   │   │   ├── response.js      # Standardized response format
   │   │   ├── calculations.js  # Business logic calculations
   │   │   ├── pdfGenerator.js  # PDF generation
   │   │   └── validators.js    # Custom validation functions
   │   ├── queries/
   │   │   ├── users.js
   │   │   ├── clients.js
   │   │   ├── items.js
   │   │   ├── categories.js
   │   │   ├── quotations.js
   │   │   ├── invoices.js
   │   │   └── payments.js
   │   └── app.js                # Express app setup
   ├── .env.example
   └── server.js                # Entry point
   ```

### Step 1.2: Environment Configuration

**Create `.env` file:**
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/hisaabu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hisaabu
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173

# File Upload (optional)
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif
UPLOAD_DIR=./uploads
```

### Step 1.3: Database Connection

**File**: `src/config/database.js`
- Set up PostgreSQL connection pool
- Handle connection errors
- Export query helper functions

### Step 1.4: Express App Setup

**File**: `src/app.js`
- Initialize Express
- Configure CORS
- Add body parser middleware
- Set up error handling middleware
- Register all routes

---

## Phase 2: Authentication System

### Step 2.1: JWT Utilities

**File**: `src/utils/jwt.js`
- Generate access token
- Generate refresh token
- Verify token
- Extract user from token

### Step 2.2: Authentication Middleware

**File**: `src/middleware/auth.js`
- Verify JWT token
- Extract user info
- Handle token expiration
- Protect routes

### Step 2.3: Auth Controller & Routes

**Endpoints to implement:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (optional)
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

**Key Features:**
- Password hashing with bcrypt (10 rounds)
- Email uniqueness validation
- Password strength validation
- JWT token generation

---

## Phase 3: Core CRUD Operations

### Step 3.1: Clients API

**Endpoints:**
- `GET /api/v1/clients` - List clients (with pagination, search, filter)
- `GET /api/v1/clients/:id` - Get client details
- `POST /api/v1/clients` - Create client
- `PUT /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client

**Features:**
- User-scoped queries (users can only see their own clients)
- Search by name, email, phone
- Filter by status
- Calculate financial summary (totalBilled, outstanding, etc.)

### Step 3.2: Categories API

**Endpoints:**
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/:id` - Get category details
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Step 3.3: Items API

**Endpoints:**
- `GET /api/v1/items` - List items (with category filter)
- `GET /api/v1/items/:id` - Get item details
- `POST /api/v1/items` - Create item
- `PUT /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item

### Step 3.4: Quotations API

**Endpoints:**
- `GET /api/v1/quotations` - List quotations
- `GET /api/v1/quotations/:id` - Get quotation with items
- `POST /api/v1/quotations` - Create quotation
- `PUT /api/v1/quotations/:id` - Update quotation
- `DELETE /api/v1/quotations/:id` - Delete quotation
- `POST /api/v1/quotations/:id/convert` - Convert to invoice

**Key Features:**
- Auto-generate quotation number (based on user's prefix)
- Calculate totals automatically
- Handle line items (quotation_items table)
- Status management

### Step 3.5: Invoices API

**Endpoints:**
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/:id` - Get invoice with items and payments
- `POST /api/v1/invoices` - Create invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice

**Key Features:**
- Auto-generate invoice number
- Calculate totals
- Auto-update status based on payments and due date
- Handle line items and payments

### Step 3.6: Payments API

**Endpoints:**
- `POST /api/v1/invoices/:id/payments` - Record payment
- `PUT /api/v1/invoices/:id/payments/:paymentId` - Update payment
- `DELETE /api/v1/invoices/:id/payments/:paymentId` - Delete payment

**Key Features:**
- Validate payment amount (cannot exceed balance)
- Auto-update invoice totals and status
- Use database triggers for calculations

---

## Phase 4: Advanced Features

### Step 4.1: Dashboard Statistics

**Endpoint:** `GET /api/v1/dashboard/stats`

**Calculate:**
- Total quotations count
- Total invoices count
- Total outstanding amount
- Paid/unpaid/overdue invoice counts
- Recent activity feed

### Step 4.2: Company Settings

**Endpoints:**
- `GET /api/v1/settings` - Get user's company settings
- `PUT /api/v1/settings` - Update settings
- `POST /api/v1/settings/logo` - Upload logo

**Features:**
- One settings record per user
- Default values on first access
- Logo file upload handling

### Step 4.3: Share Links

**Endpoints:**
- `POST /api/v1/share-links` - Generate share link
- `GET /api/v1/share-links/:token` - Get share link details
- `POST /api/v1/share-links/:token/verify` - Verify password
- `DELETE /api/v1/share-links/:token` - Deactivate link
- `GET /api/v1/public/share/:token` - Public access (no auth)

**Features:**
- Generate UUID v4 tokens
- Optional password protection (bcrypt hashed)
- Expiration date support
- View count tracking
- Public endpoint for client access

### Step 4.4: PDF Generation

**Endpoints:**
- `GET /api/v1/quotations/:id/pdf` - Generate quotation PDF
- `GET /api/v1/invoices/:id/pdf` - Generate invoice PDF

**Features:**
- Use pdfkit or puppeteer
- Include company branding (logo, colors)
- Format with all document details
- Return as binary response

---

## Phase 5: Data Transformation & Utilities

### Step 5.1: Response Formatting

**File**: `src/utils/response.js`
- Standardize success responses
- Standardize error responses
- Convert snake_case to camelCase
- Format dates to ISO 8601

### Step 5.2: Calculation Utilities

**File**: `src/utils/calculations.js`
- Line item total calculation
- Document totals calculation
- Invoice status calculation
- Payment validation

### Step 5.3: Validation

**File**: `src/utils/validators.js`
- Email validation
- Password strength validation
- Date validation
- Decimal precision handling

---

## Phase 6: Frontend Integration

### Step 6.1: API Client Setup

**File**: `src/api/client.js` (in frontend)
- Install axios
- Configure base URL
- Add request interceptor (JWT token)
- Add response interceptor (token refresh, error handling)

### Step 6.2: Update DataContext

**File**: `src/context/DataContext.jsx`
- Replace mock data with API calls
- Add loading states
- Add error handling
- Implement all CRUD operations via API

### Step 6.3: Update Authentication

**Files**: `src/pages/Login.jsx`, `src/pages/Signup.jsx`
- Replace mock authentication with API calls
- Store JWT tokens in localStorage
- Handle token refresh
- Redirect on authentication

### Step 6.4: Update All Components

**Update all pages to:**
- Use async API calls instead of sync mock functions
- Add loading states
- Add error handling
- Handle pagination
- Implement server-side search

---

## Implementation Priority

### High Priority (MVP)
1. ✅ Backend foundation setup
2. ✅ Authentication system
3. ✅ Clients CRUD
4. ✅ Items & Categories CRUD
5. ✅ Quotations CRUD
6. ✅ Invoices CRUD
7. ✅ Payments CRUD
8. ✅ Dashboard stats

### Medium Priority
9. Company settings
10. Share links (basic)
11. PDF generation

### Low Priority (Nice to Have)
12. Email sending
13. Advanced share link features
14. File upload for logo

---

## Testing Strategy

### Unit Tests
- Test calculation functions
- Test validation functions
- Test JWT utilities

### Integration Tests
- Test API endpoints
- Test authentication flow
- Test database queries

### Manual Testing Checklist
- [ ] User registration
- [ ] User login
- [ ] Token refresh
- [ ] All CRUD operations for each entity
- [ ] Search and filtering
- [ ] Pagination
- [ ] Error handling
- [ ] PDF generation
- [ ] Share links

---

## Database Query Patterns

### User-Scoped Queries
All queries should filter by `user_id`:
```sql
SELECT * FROM clients WHERE user_id = $1
```

### Joins for Related Data
```sql
SELECT 
  i.*,
  c.name as category_name,
  c.color as category_color
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.user_id = $1
```

### Computed Fields
Use database views or calculate in application:
- Client financial summary
- Invoice status
- Document totals

---

## Error Handling Standards

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., duplicate email)
- `INTERNAL_ERROR` - Server error

---

## Security Considerations

1. **Password Security**
   - Hash with bcrypt (10+ rounds)
   - Never return password hashes in responses
   - Validate password strength

2. **JWT Security**
   - Use strong secret keys
   - Set appropriate expiration times
   - Validate token signature

3. **SQL Injection Prevention**
   - Use parameterized queries
   - Never concatenate user input into SQL

4. **Input Validation**
   - Validate all input on server side
   - Sanitize user input
   - Use validation library (joi or express-validator)

5. **CORS Configuration**
   - Allow only frontend origin
   - Configure proper headers

6. **Rate Limiting**
   - Implement rate limiting for auth endpoints
   - Prevent brute force attacks

---

## Next Immediate Steps

1. **Initialize Backend Project**
   ```bash
   cd backend
   npm init -y
   npm install express pg jsonwebtoken bcrypt dotenv cors express-validator
   ```

2. **Create Basic Server**
   - Set up Express app
   - Configure database connection
   - Create basic route structure

3. **Implement Authentication**
   - User registration
   - User login
   - JWT token generation
   - Auth middleware

4. **Implement First CRUD (Clients)**
   - Test full flow
   - Establish patterns for other entities

5. **Wire Frontend**
   - Set up API client
   - Update DataContext
   - Test integration

---

## Estimated Timeline

- **Phase 1 (Foundation)**: 1-2 days
- **Phase 2 (Authentication)**: 1 day
- **Phase 3 (CRUD Operations)**: 3-4 days
- **Phase 4 (Advanced Features)**: 2-3 days
- **Phase 5 (Utilities)**: 1 day
- **Phase 6 (Frontend Integration)**: 2-3 days

**Total**: ~10-15 days for complete implementation

---

## Notes

- Follow the API specification exactly as documented
- Use database triggers for automatic calculations where possible
- Implement proper error handling from the start
- Write clean, maintainable code with proper separation of concerns
- Test each endpoint as you build it
- Use transactions for operations that modify multiple tables



