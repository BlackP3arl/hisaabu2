# Quick Start Guide - Fix Application Not Running

## Issue
Application was working before but doesn't run after reopening in Cursor.

## Quick Fix Steps

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd /Users/ahmedsalam/dev/hisaabu/backend
npm run dev
```

**Expected Output:**
```
✅ Database connected successfully
✅ Database connection test successful
🚀 Server running on port 3000
📝 Environment: development
🌐 API Base URL: http://localhost:3000/api/v1
```

**If you see port conflict (port 3000 in use):**
- The backend will try to use port 3000 by default
- If port 3000 is busy, check what's using it: `lsof -i :3000`
- Or update `backend/.env` to use a different port: `PORT=4000`

### Step 2: Start Frontend Server

Open a **NEW terminal** (keep backend running) and run:

```bash
cd /Users/ahmedsalam/dev/hisaabu
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Verify Both Are Running

**Check Backend:**
```bash
curl http://localhost:3000/api/v1/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "development"
}
```

**Check Frontend:**
- Open browser to: `http://localhost:5173`
- Should see the login page

## Common Issues

### Issue 1: Backend Database Connection Error

**Error:**
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

3. Check backend `.env` file has correct credentials:
   ```bash
   cd backend
   cat .env | grep DB_
   ```

### Issue 2: Frontend Can't Connect to Backend

**Error in browser console:**
```
net::ERR_CONNECTION_REFUSED
```

**Fix:**
1. Make sure backend is running (Step 1)
2. Check backend is on the correct port
3. Verify frontend `.env` file (if exists) has correct API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

### Issue 3: Dashboard Import Error

**Error:**
```
The requested module '/src/pages/Dashboard.jsx' does not provide an export named 'default'
```

**Status:** ✅ **FIXED** - Dashboard.jsx has been created with proper default export.

### Issue 4: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use different port
cd backend
echo "PORT=4000" >> .env
```

## Development Workflow

**Always run both servers:**

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

## Verification Checklist

- [ ] Backend server running (check terminal output)
- [ ] Backend health endpoint responds: `curl http://localhost:3000/api/v1/health`
- [ ] Frontend server running (check terminal output)
- [ ] Frontend accessible: `http://localhost:5173`
- [ ] No console errors in browser
- [ ] Can navigate to login page

## If Still Not Working

1. **Check all processes:**
   ```bash
   # Backend
   lsof -i :3000
   
   # Frontend
   lsof -i :5173
   ```

2. **Restart everything:**
   ```bash
   # Kill all node processes
   pkill -f "node.*server"
   pkill -f "vite"
   
   # Restart backend
   cd backend && npm run dev
   
   # In new terminal, restart frontend
   cd .. && npm run dev
   ```

3. **Check for missing dependencies:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd .. && npm install
   ```

---

**Current Status:**
- ✅ Dashboard.jsx created and fixed
- ✅ Frontend structure verified
- ⚠️ **Action Required:** Start backend server if not running


