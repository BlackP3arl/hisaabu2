# Next Steps: Building the Backend & Wiring Frontend

## 🎯 Quick Summary

Your frontend is complete with mock data, and your database is set up. Now you need to:
1. Build the Express.js backend API
2. Wire the frontend to use the real API instead of mock data

---

## 📋 Immediate Action Items

### Step 1: Initialize Backend Project (15 minutes)

```bash
cd backend
npm init -y
npm install express pg jsonwebtoken bcrypt dotenv cors express-validator multer
npm install --save-dev nodemon
```

**Create `.env` file:**
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/hisaabu
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

### Step 2: Create Basic Server Structure (30 minutes)

**Create these files:**

1. **`server.js`** (entry point)
2. **`src/app.js`** (Express app setup)
3. **`src/config/database.js`** (PostgreSQL connection)
4. **`src/middleware/auth.js`** (JWT authentication)
5. **`src/middleware/errorHandler.js`** (Error handling)
6. **`src/utils/response.js`** (Standardized responses)

### Step 3: Implement Authentication (2-3 hours)

**Priority endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

**Key files:**
- `src/controllers/authController.js`
- `src/routes/auth.js`
- `src/utils/jwt.js`

### Step 4: Implement First CRUD - Clients (2-3 hours)

**Endpoints:**
- `GET /api/v1/clients`
- `GET /api/v1/clients/:id`
- `POST /api/v1/clients`
- `PUT /api/v1/clients/:id`
- `DELETE /api/v1/clients/:id`

**Test this fully before moving on** - it establishes patterns for other entities.

### Step 5: Wire Frontend to Backend (2-3 hours)

**Frontend changes:**

1. **Install axios:**
   ```bash
   cd ..  # back to root
   npm install axios
   ```

2. **Create API client** (`src/api/client.js`):
   - Configure base URL
   - Add JWT token to requests
   - Handle token refresh on 401

3. **Update DataContext** (`src/context/DataContext.jsx`):
   - Replace mock data with API calls
   - Add loading/error states

4. **Update Login/Signup** (`src/pages/Login.jsx`, `src/pages/Signup.jsx`):
   - Call real API endpoints
   - Store tokens in localStorage

### Step 6: Implement Remaining CRUD Operations (1-2 days)

**In order:**
1. Categories
2. Items
3. Quotations (with line items)
4. Invoices (with line items and payments)
5. Dashboard stats

### Step 7: Advanced Features (1-2 days)

1. Company Settings
2. Share Links
3. PDF Generation

---

## 🔧 Technical Implementation Details

### Database Connection Pattern

```javascript
// src/config/database.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);
```

### Authentication Middleware Pattern

```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token required' } });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};
```

### Standard Response Format

```javascript
// src/utils/response.js
export const successResponse = (res, data, message = null, statusCode = 200) => {
  const response = { success: true };
  if (message) response.message = message;
  response.data = data;
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, code, message, details = null, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  });
};
```

### User-Scoped Query Pattern

**Always filter by user_id:**
```javascript
// Example: Get user's clients
const getClients = async (userId, filters = {}) => {
  const { search, status, page = 1, limit = 20 } = filters;
  
  let query = 'SELECT * FROM clients WHERE user_id = $1';
  const params = [userId];
  let paramIndex = 2;
  
  if (search) {
    query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  if (status && status !== 'all') {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, (page - 1) * limit);
  
  const result = await db.query(query, params);
  return result.rows;
};
```

---

## 🧪 Testing Your Backend

### Test Authentication First

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!@#","confirmPassword":"Test123!@#"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Use token for protected route
curl -X GET http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test CRUD Operations

Test each endpoint:
- Create → Read → Update → Delete
- Verify user-scoping (users can only see their own data)
- Test validation errors
- Test error handling

---

## 🔗 Frontend Integration Checklist

### Phase 1: Setup
- [ ] Install axios
- [ ] Create API client with interceptors
- [ ] Set up environment variable `VITE_API_BASE_URL`

### Phase 2: Authentication
- [ ] Update Login component to call API
- [ ] Update Signup component to call API
- [ ] Store tokens in localStorage
- [ ] Add route protection based on token

### Phase 3: Data Fetching
- [ ] Update DataContext to use API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Update all list components

### Phase 4: CRUD Operations
- [ ] Update all form components
- [ ] Add success/error messages
- [ ] Handle validation errors from API

### Phase 5: Advanced Features
- [ ] Implement search (server-side)
- [ ] Add pagination
- [ ] Add file upload for logo
- [ ] Implement share links
- [ ] Add PDF download

---

## 🚨 Common Issues & Solutions

### CORS Errors
**Problem**: Browser blocks API requests  
**Solution**: Configure CORS in Express:
```javascript
import cors from 'cors';
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Database Connection Errors
**Problem**: Cannot connect to PostgreSQL  
**Solution**: 
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify database exists

### Token Not Working
**Problem**: 401 errors even with token  
**Solution**:
- Check token is in Authorization header: `Bearer <token>`
- Verify JWT_SECRET matches
- Check token hasn't expired

### Field Name Mismatches
**Problem**: Frontend expects camelCase, database has snake_case  
**Solution**: Convert in response utility:
```javascript
const toCamelCase = (obj) => {
  // Convert snake_case keys to camelCase
};
```

---

## 📚 Key Documentation References

- **API Specification**: `/docs/API_SPECIFICATION.md` - All endpoint details
- **Data Models**: `/docs/DATA_MODELS.md` - Field specifications
- **Authentication**: `/docs/AUTHENTICATION.md` - Auth flow details
- **Frontend Integration**: `/docs/FRONTEND_INTEGRATION.md` - Integration guide
- **Business Logic**: `/docs/APPLICATION_FUNCTIONALITY.md` - Calculation formulas

---

## 🎯 Success Criteria

You'll know you're done when:
- ✅ All API endpoints are implemented
- ✅ Frontend successfully calls backend API
- ✅ Authentication works (login, register, token refresh)
- ✅ All CRUD operations work for all entities
- ✅ Data persists in database
- ✅ Users can only see their own data
- ✅ Error handling works properly
- ✅ PDF generation works
- ✅ Share links work

---

## 💡 Pro Tips

1. **Start Small**: Get one endpoint working end-to-end before building more
2. **Test Frequently**: Test each endpoint as you build it
3. **Use Transactions**: For operations that modify multiple tables (e.g., creating invoice with items)
4. **Follow the Spec**: The API specification is your source of truth
5. **Handle Errors Early**: Implement error handling from the start
6. **Log Everything**: Use console.log or a logger for debugging
7. **User Scoping**: Always filter by user_id - security is critical

---

## 🆘 Need Help?

Refer to:
- `backend/IMPLEMENTATION_PLAN.md` - Detailed implementation plan
- `docs/API_SPECIFICATION.md` - Complete API reference
- `docs/FRONTEND_INTEGRATION.md` - Frontend integration patterns

Good luck! 🚀



