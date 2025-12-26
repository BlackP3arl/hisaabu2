# Backend Server Startup Guide

## Issue: Connection Refused Error

If you see `net::ERR_CONNECTION_REFUSED` when trying to login, it means the backend server is not running.

## Quick Fix

### 1. Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see output like:
```
✅ Database connection test successful
🚀 Server running on port 3000
📝 Environment: development
🌐 API Base URL: http://localhost:3000/api/v1
```

### 2. Verify Server is Running

Check if the server is listening on port 3000:

```bash
lsof -i :3000
```

Or test the API endpoint:

```bash
curl http://localhost:3000/api/v1/health
```

## Common Issues and Solutions

### Issue 1: Database Connection Error

**Error Message:**
```
❌ Database connection test failed: ...
```

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l | grep hisaabu
   ```

3. Check `.env` file has correct database credentials:
   ```bash
   cd backend
   cat .env | grep DATABASE
   ```

4. Test database connection manually:
   ```bash
   psql -U postgres -d hisaabu
   ```

### Issue 2: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Find the process using port 3000:
   ```bash
   lsof -i :3000
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

3. Or use a different port by updating `.env`:
   ```env
   PORT=3001
   ```

### Issue 3: Missing Environment Variables

**Error Message:**
```
JWT_SECRET is not defined
```

**Solution:**
1. Ensure `.env` file exists in `backend/` directory
2. Check all required variables are set:
   - `DATABASE_URL` or `DB_*` variables
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `PORT` (optional, defaults to 3000)

3. See `backend/ENV_SETUP.md` for complete `.env` template

### Issue 4: Missing Dependencies

**Error Message:**
```
Cannot find module 'express'
```

**Solution:**
```bash
cd backend
npm install
```

## Development Workflow

### Recommended Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Using PM2 (Optional)

For production-like development:

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start server.js --name hisaabu-backend

# View logs
pm2 logs hisaabu-backend

# Stop server
pm2 stop hisaabu-backend
```

## Verification Checklist

Before testing the frontend, verify:

- [ ] Backend server is running (`npm run dev` in backend directory)
- [ ] Server shows "✅ Database connection test successful"
- [ ] Server shows "🚀 Server running on port 3000"
- [ ] No errors in backend console
- [ ] Port 3000 is accessible: `lsof -i :3000`
- [ ] Frontend `.env` has `VITE_API_BASE_URL=http://localhost:3000/api/v1`

## Testing the Connection

Once backend is running, test the login endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"salle.kma@gmail.com","password":"your_password"}'
```

If successful, you should get a JSON response with tokens.

## Troubleshooting Steps

1. **Check Backend Logs**
   - Look for error messages in the terminal where `npm run dev` is running
   - Common errors: database connection, missing env variables, port conflicts

2. **Check Frontend Console**
   - Open browser DevTools (F12)
   - Check Network tab for failed requests
   - Check Console for error messages

3. **Verify Environment Variables**
   ```bash
   cd backend
   # Check if .env exists
   ls -la .env
   
   # Verify database connection string
   cat .env | grep DATABASE
   ```

4. **Test Database Connection**
   ```bash
   # Check PostgreSQL is running
   pg_isready
   
   # Test connection with credentials from .env
   psql -U postgres -d hisaabu
   ```

5. **Check Port Availability**
   ```bash
   # See what's using port 3000
   lsof -i :3000
   ```

## Quick Start Script

Create a script to start both servers:

**`start-dev.sh`:**
```bash
#!/bin/bash

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd .. && npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
wait
```

Make it executable:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

**Last Updated**: $(date)
**Status**: Backend server must be running for frontend to work


