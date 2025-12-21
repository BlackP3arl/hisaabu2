# Authentication Documentation

## Overview

This document describes the authentication and authorization system for the Hisaabu application, including JWT token structure, authentication flows, password security, and secure share link authentication.

---

## Authentication Flow

### Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Enter registration details
    Frontend->>Frontend: Validate input (client-side)
    Frontend->>Backend: POST /auth/register
    Backend->>Backend: Validate input (server-side)
    Backend->>Backend: Check if email exists
    alt Email already exists
        Backend-->>Frontend: 409 Conflict
        Frontend-->>User: Show error message
    else Email is unique
        Backend->>Backend: Hash password (bcrypt, 10 rounds)
        Backend->>Database: Create user record
        Database-->>Backend: User created
        Backend->>Backend: Generate JWT tokens
        Backend-->>Frontend: 201 Created (user + tokens)
        Frontend->>Frontend: Store tokens in localStorage
        Frontend->>Frontend: Redirect to Dashboard
    end
```

### Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Enter email and password
    Frontend->>Frontend: Validate input (client-side)
    Frontend->>Backend: POST /auth/login
    Backend->>Database: Find user by email
    Database-->>Backend: User record
    Backend->>Backend: Compare password hash
    alt Invalid credentials
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show error message
    else Valid credentials
        Backend->>Backend: Generate JWT tokens
        Backend-->>Frontend: 200 OK (user + tokens)
        Frontend->>Frontend: Store tokens in localStorage
        Frontend->>Frontend: Redirect to Dashboard
    end
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Database

    Frontend->>Backend: API Request with expired token
    Backend-->>Frontend: 401 Unauthorized
    Frontend->>Backend: POST /auth/refresh (with refresh token)
    Backend->>Backend: Validate refresh token
    alt Invalid refresh token
        Backend-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Clear tokens, redirect to login
    else Valid refresh token
        Backend->>Backend: Generate new access token
        Backend-->>Frontend: 200 OK (new access token)
        Frontend->>Frontend: Update stored token
        Frontend->>Backend: Retry original request with new token
    end
```

### Protected Route Access Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend

    User->>Frontend: Navigate to protected route
    Frontend->>Frontend: Check localStorage for token
    alt No token
        Frontend->>Frontend: Redirect to /login
    else Token exists
        Frontend->>Backend: API Request with Authorization header
        Backend->>Backend: Verify JWT token
        alt Token invalid/expired
            Backend-->>Frontend: 401 Unauthorized
            Frontend->>Frontend: Attempt token refresh
        else Token valid
            Backend->>Backend: Extract user info from token
            Backend->>Backend: Process request
            Backend-->>Frontend: 200 OK (data)
            Frontend->>Frontend: Display data
        end
    end
```

---

## JWT Token Structure

### Access Token

**Purpose**: Authenticate API requests

**Expiration**: 1 hour

**Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 1,
    "email": "john@example.com",
    "role": "admin",
    "iat": 1640995200,
    "exp": 1640998800
  },
  "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret)"
}
```

**Payload Fields:**
- `userId` (integer): User ID
- `email` (string): User email
- `role` (string): User role ('admin' or 'staff')
- `iat` (integer): Issued at timestamp
- `exp` (integer): Expiration timestamp

**Example Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk4ODAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Refresh Token

**Purpose**: Obtain new access tokens without re-authentication

**Expiration**: 7 days

**Storage**: 
- Database: Stored in `refresh_tokens` table (optional) or as signed JWT
- Frontend: Stored in localStorage or httpOnly cookie

**Structure:** Similar to access token, but with longer expiration

---

## Password Security

### Password Requirements

1. **Minimum Length**: 8 characters
2. **Complexity Requirements**:
   - At least one uppercase letter (A-Z)
   - At least one lowercase letter (a-z)
   - At least one number (0-9)
   - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Password Hashing

**Algorithm**: bcrypt

**Rounds**: 10 (recommended minimum)

**Process:**
1. User provides plain text password
2. Generate random salt
3. Hash password with salt using bcrypt
4. Store hash in database (format: `$2b$10$...`)

**Example:**
```
Plain: "SecurePassword123!"
Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

### Password Verification

```javascript
// Pseudo-code
function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}
```

---

## Password Reset Flow

### Request Password Reset

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant EmailService

    User->>Frontend: Click "Forgot Password"
    Frontend->>Frontend: Show email input form
    User->>Frontend: Enter email
    Frontend->>Backend: POST /auth/forgot-password
    Backend->>Database: Find user by email
    alt User not found
        Backend-->>Frontend: 200 OK (don't reveal if user exists)
    else User found
        Backend->>Backend: Generate reset token (UUID v4)
        Backend->>Backend: Set token expiration (1 hour)
        Backend->>Database: Store reset token
        Backend->>EmailService: Send reset email with link
        Backend-->>Frontend: 200 OK
    end
```

### Reset Password

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Click reset link from email
    Frontend->>Frontend: Extract token from URL
    Frontend->>Frontend: Show password reset form
    User->>Frontend: Enter new password
    Frontend->>Backend: POST /auth/reset-password
    Backend->>Backend: Validate token
    alt Token invalid/expired
        Backend-->>Frontend: 400 Bad Request
    else Token valid
        Backend->>Backend: Validate password strength
        Backend->>Backend: Hash new password
        Backend->>Database: Update user password
        Backend->>Database: Invalidate reset token
        Backend-->>Frontend: 200 OK
        Frontend->>Frontend: Redirect to login
    end
```

**Reset Token Format:**
- UUID v4 (cryptographically secure random)
- Stored in database with expiration timestamp
- Single-use (invalidated after use)

---

## Secure Share Link Authentication

### Share Link Structure

**URL Format:**
```
https://app.hisaabu.com/share/{documentType}/{token}
```

**Example:**
```
https://app.hisaabu.com/share/invoice/550e8400-e29b-41d4-a716-446655440000
```

### Share Link Access Flow

```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant Database

    Client->>Frontend: Visit share link URL
    Frontend->>Frontend: Extract token from URL
    Frontend->>Backend: GET /public/share/:token
    Backend->>Database: Find share link by token
    alt Link not found
        Backend-->>Frontend: 404 Not Found
    else Link found
        Backend->>Backend: Check if link is active
        alt Link inactive
            Backend-->>Frontend: 410 Gone
        else Link active
            Backend->>Backend: Check if link has password
            alt Password required
                Backend-->>Frontend: 401 Unauthorized (password required)
                Client->>Frontend: Enter password
                Frontend->>Backend: POST /public/share/:token/verify
                Backend->>Backend: Verify password hash
                alt Password incorrect
                    Backend-->>Frontend: 401 Unauthorized
                else Password correct
                    Backend->>Database: Increment view_count
                    Backend->>Database: Get document data
                    Backend-->>Frontend: 200 OK (document data)
                end
            else No password
                Backend->>Database: Increment view_count
                Backend->>Database: Get document data
                Backend-->>Frontend: 200 OK (document data)
            end
        end
    end
```

### Share Link Password

**Storage**: Hashed with bcrypt (same as user passwords)

**Verification:**
```javascript
// Pseudo-code
function verifyShareLinkPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}
```

**Security:**
- Password is optional but recommended
- Password is hashed before storage
- Password verification is rate-limited (5 attempts per hour per token)

---

## Authorization & Role-Based Access Control

### User Roles

1. **Admin**
   - Full access to all features
   - Can manage users
   - Can access all settings
   - Can view all clients/invoices/quotations

2. **Staff**
   - Can create/edit invoices and quotations
   - Can view assigned clients (if multi-user)
   - Limited settings access
   - Cannot manage users

### Permission Checks

**Middleware Example:**
```javascript
// Pseudo-code
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.role // From JWT token
    if (allowedRoles.includes(userRole)) {
      next()
    } else {
      res.status(403).json({ error: 'Forbidden' })
    }
  }
}

// Usage
app.get('/admin/users', requireRole(['admin']), getUsers)
```

### Resource Ownership

**User-Scoped Resources:**
- Clients, Items, Categories, Quotations, Invoices belong to a user
- Users can only access their own resources (unless admin)
- Database queries filter by `user_id`

**Example:**
```sql
-- Staff user can only see their own invoices
SELECT * FROM invoices WHERE user_id = :current_user_id

-- Admin can see all invoices
SELECT * FROM invoices
```

---

## Token Storage & Security

### Frontend Token Storage

**Options:**
1. **localStorage** (Current Implementation)
   - Pros: Persists across browser sessions
   - Cons: Vulnerable to XSS attacks

2. **sessionStorage**
   - Pros: Cleared on browser close
   - Cons: Still vulnerable to XSS

3. **httpOnly Cookies** (Recommended for Production)
   - Pros: Not accessible via JavaScript (XSS protection)
   - Cons: Requires CSRF protection

**Current Implementation:**
- Access token: localStorage
- Refresh token: localStorage

**Security Considerations:**
- Use HTTPS in production
- Implement Content Security Policy (CSP)
- Sanitize user input to prevent XSS
- Consider httpOnly cookies for production

### Token Transmission

**Authorization Header:**
```
Authorization: Bearer <access_token>
```

**Example Request:**
```http
GET /api/v1/clients HTTP/1.1
Host: api.hisaabu.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Session Management

### Token Expiration

**Access Token:**
- Expires after 1 hour
- Frontend should refresh before expiration
- Backend returns 401 if expired

**Refresh Token:**
- Expires after 7 days
- Can be used to obtain new access tokens
- Should be rotated on each use (optional)

### Token Refresh Strategy

**Automatic Refresh:**
1. Frontend checks token expiration before each API call
2. If token expires in < 5 minutes, refresh automatically
3. If refresh fails, redirect to login

**On 401 Response:**
1. Frontend receives 401 Unauthorized
2. Frontend attempts token refresh
3. If refresh succeeds, retry original request
4. If refresh fails, redirect to login

### Logout

**Process:**
1. User clicks logout
2. Frontend clears tokens from storage
3. Frontend calls `POST /auth/logout` (optional - invalidate refresh token)
4. Frontend redirects to login

---

## Security Best Practices

### Password Security

1. **Never store plain text passwords**
2. **Use bcrypt with at least 10 rounds**
3. **Enforce strong password requirements**
4. **Implement password reset with secure tokens**
5. **Rate limit password reset requests**

### Token Security

1. **Use strong secret key for JWT signing**
2. **Set appropriate expiration times**
3. **Validate token signature on every request**
4. **Implement token refresh mechanism**
5. **Invalidate tokens on logout (optional)**

### API Security

1. **Use HTTPS in production**
2. **Implement rate limiting**
3. **Validate all input**
4. **Use parameterized queries (prevent SQL injection)**
5. **Implement CORS properly**
6. **Sanitize user input (prevent XSS)**

### Share Link Security

1. **Generate cryptographically secure tokens (UUID v4)**
2. **Hash passwords with bcrypt**
3. **Implement expiration dates**
4. **Track access (view count, last accessed)**
5. **Allow deactivation without deletion**
6. **Rate limit password attempts**

---

## Error Handling

### Authentication Errors

**401 Unauthorized:**
- Invalid credentials
- Expired token
- Invalid token signature
- Missing token

**Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**403 Forbidden:**
- Insufficient permissions
- Role not allowed

**Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### Frontend Error Handling

1. **401 Response**: Attempt token refresh, if fails redirect to login
2. **403 Response**: Show "Access Denied" message
3. **Network Error**: Show "Connection error" message
4. **Validation Error**: Display field-specific errors

---

## Implementation Notes

### Backend Implementation

1. **JWT Library**: Use `jsonwebtoken` (Node.js) or equivalent
2. **Password Hashing**: Use `bcrypt` library
3. **Token Secret**: Store in environment variable, never commit to code
4. **Token Validation**: Create middleware to verify tokens on protected routes
5. **Rate Limiting**: Use `express-rate-limit` or similar

### Frontend Implementation

1. **Token Storage**: Use localStorage or httpOnly cookies
2. **Token Refresh**: Implement automatic refresh before expiration
3. **Axios Interceptors**: Use interceptors to add token to requests and handle 401 responses
4. **Route Guards**: Protect routes that require authentication

### Example Axios Interceptor

```javascript
// Add token to requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken })
          localStorage.setItem('accessToken', data.token)
          // Retry original request
          return axios(error.config)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
```

---

## Future Enhancements

1. **Two-Factor Authentication (2FA)**: Add TOTP support
2. **OAuth Integration**: Support Google, GitHub, etc. login
3. **Session Management**: Track active sessions, allow logout from all devices
4. **Password History**: Prevent reuse of recent passwords
5. **Account Lockout**: Lock account after multiple failed login attempts
6. **IP Whitelisting**: Restrict access to specific IP addresses
7. **Audit Logging**: Log all authentication events

---

## Testing Authentication

### Test Cases

1. **Registration**
   - Valid registration
   - Duplicate email
   - Weak password
   - Missing required fields

2. **Login**
   - Valid credentials
   - Invalid email
   - Invalid password
   - Non-existent user

3. **Token Refresh**
   - Valid refresh token
   - Expired refresh token
   - Invalid refresh token

4. **Protected Routes**
   - Valid token
   - Expired token
   - Invalid token
   - Missing token

5. **Share Links**
   - Valid link without password
   - Valid link with correct password
   - Valid link with incorrect password
   - Expired link
   - Inactive link

---

## Troubleshooting

### Common Issues

1. **Token Expired Immediately**
   - Check token expiration time
   - Verify system clock synchronization

2. **401 on Every Request**
   - Verify token is being sent in Authorization header
   - Check token signature and secret key
   - Verify token hasn't expired

3. **Password Reset Not Working**
   - Check email service configuration
   - Verify reset token expiration
   - Check token storage in database

4. **Share Link Not Accessible**
   - Verify token is correct
   - Check if link is active
   - Verify expiration date
   - Check password if required



