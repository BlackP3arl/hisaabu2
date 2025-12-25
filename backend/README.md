# Hisaabu Backend API

Backend API for the Hisaabu Invoice & Quotation Management System.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Database already set up (see `database/README.md`)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # PostgreSQL connection
│   ├── middleware/        # Express middleware
│   │   ├── auth.js      # JWT authentication
│   │   └── errorHandler.js # Error handling
│   ├── controllers/     # Request handlers (to be implemented)
│   ├── routes/          # API routes (to be implemented)
│   ├── utils/           # Utility functions
│   │   ├── response.js  # Standardized responses
│   │   └── jwt.js       # JWT utilities
│   ├── queries/         # Database queries (to be implemented)
│   └── app.js           # Express app setup
├── database/            # Database migrations and setup
├── server.js            # Entry point
├── .env.example         # Environment variables template
└── package.json         # Dependencies
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

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
```

## 📝 API Documentation

See `/docs/API_SPECIFICATION.md` for complete API documentation.

**Base URL**: `http://localhost:3000/api/v1`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server

### Health Check

Test if the server is running:

```bash
curl http://localhost:3000/health
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database

The database schema is already set up. See `database/README.md` for details.

Connection is configured in `src/config/database.js` and uses environment variables.

## 🏗️ Implementation Status

### ✅ Completed
- Project structure
- Database connection
- Express app setup
- Error handling middleware
- JWT utilities
- Authentication middleware
- Response utilities

### 🚧 In Progress
- Authentication endpoints (register, login, refresh)
- CRUD endpoints for all entities

### 📋 Next Steps
1. Implement authentication endpoints
2. Implement Clients API
3. Implement Items & Categories API
4. Implement Quotations API
5. Implement Invoices API
6. Implement Payments API
7. Implement Dashboard API
8. Implement Settings API
9. Implement Share Links API
10. Implement PDF generation

See `NEXT_STEPS.md` for detailed implementation plan.

## 🧪 Testing

```bash
# Test database connection
npm run dev
# Check health endpoint
curl http://localhost:3000/health
```

## 📚 Documentation

- [API Specification](../../docs/API_SPECIFICATION.md)
- [Database Schema](../../docs/DATABASE_SCHEMA.md)
- [Authentication Guide](../../docs/AUTHENTICATION.md)
- [Implementation Plan](./NEXT_STEPS.md)

## 🐛 Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l | grep hisaabu`

### Port Already in Use

Change `PORT` in `.env` file or kill the process using port 3000.

### JWT Errors

Ensure `JWT_SECRET` is set in `.env` and is at least 32 characters long.

## 📄 License

[To be determined]
