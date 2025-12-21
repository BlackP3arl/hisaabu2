# Troubleshooting Guide: Connection Refused Error

## Problem

You're seeing `net::ERR_CONNECTION_REFUSED` when trying to login, with the error:
```
POST http://localhost:3000/api/v1/auth/login net::ERR_CONNECTION_REFUSED
```

## Root Cause

The backend server is **not running**. The frontend is trying to connect to `http://localhost:3000/api/v1/auth/login`, but there's no server listening on port 3000.

## Solution

### Step 1: Start the Backend Server

Open a **new terminal window** and run:

```bash
cd /Users/ahmedsalam/dev/hisaabu/backend
npm run dev
```

You should see:
```
✅ Database connection test successful
🚀 Server running on port 3000
📝 Environment: development
🌐 API Base URL: http://localhost:3000/api/v1
```

### Step 2: Verify Server is Running

In another terminal, check if the server is listening:

```bash
lsof -i :3000
```

You should see a `node` process listening on port 3000.

### Step 3: Test the Login Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"salle.kma@gmail.com","password":"your_password"}'
```

If the server is running correctly, you'll get a JSON response (either success with tokens or error with message).

### Step 4: Try Login Again in Browser

Once the backend is running:
1. Refresh your browser page
2. Try logging in again with `salle.kma@gmail.com`
3. The connection should work now

## Why This Happened

The backend server needs to be running **before** the frontend can make API calls. If you:
- Closed the terminal where the backend was running
- Restarted your computer
- Killed the backend process

Then you need to start it again.

## Development Workflow

### Recommended Setup (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/ahmedsalam/dev/hisaabu/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/ahmedsalam/dev/hisaabu
npm run dev
```

Keep both terminals open while developing.

## Common Issues

### Issue 1: Database Connection Error

If you see:
```
❌ Database connection test failed
```

**Fix:**
1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l | grep hisaabu
   ```

3. Check `.env` file in `backend/` directory has correct database credentials

### Issue 2: Port Already in Use

If you see:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### Issue 3: Missing .env File

If you see environment variable errors:

**Fix:**
1. Check if `.env` exists:
   ```bash
   ls -la backend/.env
   ```

2. If missing, create it from the template in `backend/ENV_SETUP.md`

## Quick Verification

Run this to check everything:

```bash
# Check if backend is running
lsof -i :3000

# Test API endpoint
curl http://localhost:3000/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

## Prevention

To avoid this issue in the future:

1. **Always start backend first** before testing frontend
2. **Keep backend terminal open** while developing
3. **Use a process manager** like PM2 for production:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name hisaabu-backend
   ```

## Status Check

✅ **Backend Running**: `lsof -i :3000` shows a node process
✅ **Database Connected**: Backend logs show "✅ Database connection test successful"
✅ **API Accessible**: `curl` to login endpoint returns JSON response
✅ **Frontend Ready**: Frontend can now make API calls

---

**Current Status**: Backend server is now running. Try logging in again!

