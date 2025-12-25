# Environment Variables Setup Guide

## .env File Contents

Copy this template to your `.env` file and update the values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
# Option 1: Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hisaabu

# Option 2: Use individual variables (alternative)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hisaabu
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
# IMPORTANT: Generate strong random secrets (at least 32 characters)
# You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# File Upload Configuration (optional - for future logo uploads)
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif
UPLOAD_DIR=./uploads
```

## Required Values to Update

### 1. Database Password
Replace `your_password` with your actual PostgreSQL password.

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/hisaabu
# OR
DB_PASSWORD=mypassword123
```

### 2. JWT Secrets
**CRITICAL:** Generate strong random secrets. Never use the example values in production!

**Generate secrets using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets:
- One for `JWT_SECRET`
- One for `REFRESH_TOKEN_SECRET`

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
REFRESH_TOKEN_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
```

### 3. Frontend URL
If your frontend runs on a different port, update `FRONTEND_URL`:

```env
FRONTEND_URL=http://localhost:5173  # Default Vite port
# OR
FRONTEND_URL=http://localhost:3000  # If using different port
```

## Quick Setup

1. **Copy the template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit .env file:**
   ```bash
   # Use your preferred editor
   nano .env
   # OR
   code .env
   ```

3. **Update these values:**
   - `DB_PASSWORD` or `DATABASE_URL` - Your PostgreSQL password
   - `JWT_SECRET` - Generate a random secret (32+ characters)
   - `REFRESH_TOKEN_SECRET` - Generate another random secret (32+ characters)

## Verify Your Setup

After creating `.env`, test the connection:

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

If you see database connection errors, check:
- PostgreSQL is running: `pg_isready`
- Database exists: `psql -U postgres -l | grep hisaabu`
- Password is correct in `.env`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` to version control (it's in `.gitignore`)
- Use strong, random secrets in production
- Change default passwords
- Use different secrets for development and production
- Keep `.env` file secure and private

## Example .env for Development

Here's a complete example (replace with your actual values):

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hisaabu

JWT_SECRET=dev-secret-key-123456789012345678901234567890
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=dev-refresh-secret-123456789012345678901234567890
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify database name: `psql -U postgres -l`
- Test connection: `psql -U postgres -d hisaabu`
- Check password in `.env` matches your PostgreSQL password

### JWT Errors
- Ensure `JWT_SECRET` is at least 32 characters
- Ensure `REFRESH_TOKEN_SECRET` is at least 32 characters
- Both secrets should be different

### CORS Errors
- Verify `FRONTEND_URL` matches your frontend's actual URL
- Check frontend is running on the specified port



