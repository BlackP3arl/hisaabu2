# Hisaabu - Invoice & Quotation Management System

## Project Overview

Hisaabu is a modern, full-stack web application for managing invoices, quotations, clients, and business operations. The application provides a comprehensive solution for small to medium businesses to streamline their billing and quotation processes.

### Purpose

Hisaabu enables businesses to:
- Create and manage professional invoices and quotations
- Track client information and payment history
- Generate secure share links for client document access
- Manage service/product items and categories
- Track payments and outstanding balances
- Generate PDF documents
- Configure company settings and branding

---

## Technology Stack

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols (Google Fonts)

### Backend (To Be Implemented)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **PDF Generation**: pdfkit / puppeteer
- **Email**: SendGrid / Mailgun / AWS SES

---

## Project Structure

```
hisaabu/
├── docs/                          # Documentation
│   ├── README.md                  # This file
│   ├── DATABASE_SCHEMA.md         # Database schema and ERD
│   ├── API_SPECIFICATION.md       # Complete API documentation
│   ├── APPLICATION_FUNCTIONALITY.md # Business logic and workflows
│   ├── SCREENS_AND_VIEWS.md       # Frontend routes and screens
│   ├── DATA_MODELS.md             # Data model specifications
│   ├── AUTHENTICATION.md          # Auth flow and security
│   └── FRONTEND_INTEGRATION.md    # Frontend-backend integration guide
├── src/
│   ├── components/                # Reusable React components
│   ├── context/                   # React Context providers
│   ├── pages/                     # Page components
│   └── App.jsx                    # Main app component
└── package.json                   # Dependencies and scripts
```

---

## Documentation Index

### 1. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
Complete database schema documentation including:
- Entity Relationship Diagram (ERD)
- All database tables with field specifications
- Relationships and foreign keys
- Indexes and constraints
- Database triggers and functions
- Sample data structures

**Use this when**: Designing the database, writing migrations, or understanding data relationships.

---

### 2. [API_SPECIFICATION.md](./API_SPECIFICATION.md)
Complete REST API documentation including:
- All API endpoints with request/response formats
- Authentication endpoints
- CRUD operations for all entities
- Special endpoints (dashboard, PDF generation, share links)
- Error handling and status codes
- Pagination and sorting
- Rate limiting

**Use this when**: Implementing the backend API or integrating frontend with backend.

---

### 3. [APPLICATION_FUNCTIONALITY.md](./APPLICATION_FUNCTIONALITY.md)
Business logic and feature documentation including:
- Core features and workflows
- Calculation formulas (totals, taxes, discounts)
- Status management and transitions
- Quotation to invoice conversion
- Secure share link generation
- PDF generation process
- Email sending workflows
- Validation rules and business rules

**Use this when**: Implementing business logic, understanding workflows, or debugging calculations.

---

### 4. [SCREENS_AND_VIEWS.md](./SCREENS_AND_VIEWS.md)
Frontend screen documentation including:
- Complete route mapping (frontend → backend)
- Screen-by-screen requirements
- User interactions and data flow
- Component data requirements
- Navigation flow diagrams
- Error handling patterns

**Use this when**: Understanding frontend requirements, implementing new screens, or debugging user flows.

---

### 5. [DATA_MODELS.md](./DATA_MODELS.md)
Data model specifications including:
- Detailed entity definitions
- Field types, constraints, and validation rules
- Default values
- Example JSON payloads
- Data transformation requirements
- Enum values
- Relationships

**Use this when**: Understanding data structures, implementing validation, or debugging data issues.

---

### 6. [AUTHENTICATION.md](./AUTHENTICATION.md)
Authentication and security documentation including:
- Authentication flows (registration, login, password reset)
- JWT token structure and management
- Password security requirements
- Secure share link authentication
- Role-based access control
- Token storage and security
- Security best practices

**Use this when**: Implementing authentication, understanding security requirements, or debugging auth issues.

---

### 7. [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
Frontend-backend integration guide including:
- Current frontend architecture (mock data)
- Expected backend integration
- API client setup
- Data structure mapping
- Component update requirements
- Migration checklist
- Common issues and solutions

**Use this when**: Migrating from mock data to real backend, integrating frontend with API, or debugging integration issues.

---

## Key Features

### 1. Client Management
- Create, edit, and delete clients
- Track client contact information
- View client financial summary (total billed, paid, outstanding)
- View client invoice and quotation history

### 2. Item & Category Management
- Manage service/product items with rates
- Organize items into categories
- Search and filter items
- Quick item creation from quotation/invoice forms

### 3. Quotation Management
- Create professional quotations
- Add line items with quantity, price, discount, and tax
- Automatic total calculations
- Convert quotations to invoices
- Generate PDF quotations
- Share quotations via secure links

### 4. Invoice Management
- Create and manage invoices
- Track payment status (draft, sent, paid, partial, overdue)
- Record payments
- Automatic status updates based on payments and due dates
- Generate PDF invoices
- Share invoices via secure links

### 5. Secure Share Links
- Generate password-protected share links
- Optional expiration dates
- Track view counts
- Public access (no login required for clients)

### 6. Dashboard
- Key metrics (total outstanding, quotations, invoices)
- Status breakdown (paid, unpaid, overdue)
- Recent activity feed
- Quick actions

### 7. Settings
- Company profile management
- Tax configuration
- Invoice/quotation numbering
- Terms & conditions templates

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (for backend)
- Git

### Frontend Setup

```bash
# Clone repository
git clone https://github.com/BlackP3arl/hisaabu2.git
cd hisaabu

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Backend Setup (To Be Implemented)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Run migrations
npm run migrate

# Start development server
npm run dev
```

Backend will be available at `http://localhost:3000`

---

## Development Workflow

### Current Status

✅ **Completed:**
- Frontend UI with all screens
- Mock data and state management
- Responsive design (mobile and desktop)
- Component architecture
- Routing and navigation

🚧 **In Progress:**
- Backend API implementation
- Database setup
- Authentication system
- PDF generation
- Email sending

### Next Steps

1. **Backend Setup**
   - Set up Express.js server
   - Configure PostgreSQL database
   - Implement database migrations
   - Set up authentication middleware

2. **API Implementation**
   - Implement authentication endpoints
   - Implement CRUD endpoints for all entities
   - Implement dashboard statistics endpoint
   - Implement PDF generation
   - Implement share link generation

3. **Frontend Integration**
   - Replace mock data with API calls
   - Implement authentication flow
   - Add loading states
   - Add error handling
   - Implement token refresh

4. **Testing**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - End-to-end tests for critical flows

5. **Deployment**
   - Set up production database
   - Configure environment variables
   - Deploy backend API
   - Deploy frontend
   - Set up CI/CD pipeline

---

## API Base URL

**Development**: `http://localhost:3000/api/v1`

**Production**: `https://api.hisaabu.com/v1` (to be configured)

---

## Database

**Development**: PostgreSQL on localhost

**Production**: PostgreSQL (managed service recommended)

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

---

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Expires after 1 hour
- **Refresh Token**: Expires after 7 days
- **Password Hashing**: bcrypt with 10 rounds

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete authentication documentation.

---

## Environment Variables

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Hisaabu
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hisaabu

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Email (optional)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-api-key
EMAIL_FROM=noreply@hisaabu.com

# File Upload (optional)
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif
```

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request

---

## License

[To be determined]

---

## Support

For questions or issues:
- Check the documentation in `/docs`
- Review API specifications
- Check existing issues on GitHub

---

## Roadmap

### Phase 1: Core Backend (Current)
- [x] Database schema design
- [x] API specification
- [ ] Backend implementation
- [ ] Authentication system
- [ ] Basic CRUD operations

### Phase 2: Advanced Features
- [ ] PDF generation
- [ ] Email sending
- [ ] Share link system
- [ ] Payment tracking
- [ ] Dashboard statistics

### Phase 3: Frontend Integration
- [ ] Replace mock data with API
- [ ] Implement authentication
- [ ] Add loading/error states
- [ ] Test all features

### Phase 4: Production Ready
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Comprehensive testing
- [ ] Deployment setup
- [ ] Monitoring and logging

### Phase 5: Future Enhancements
- [ ] Recurring invoices
- [ ] Multi-currency support
- [ ] Payment gateway integration
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Inventory management

---

## Documentation Maintenance

This documentation should be updated when:
- New features are added
- API endpoints change
- Database schema is modified
- Business logic is updated
- New screens/views are added

---

## Quick Reference

### Common Tasks

**View Database Schema**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**Check API Endpoints**: [API_SPECIFICATION.md](./API_SPECIFICATION.md)

**Understand Business Logic**: [APPLICATION_FUNCTIONALITY.md](./APPLICATION_FUNCTIONALITY.md)

**See Frontend Routes**: [SCREENS_AND_VIEWS.md](./SCREENS_AND_VIEWS.md)

**Check Data Models**: [DATA_MODELS.md](./DATA_MODELS.md)

**Understand Authentication**: [AUTHENTICATION.md](./AUTHENTICATION.md)

**Integrate Frontend**: [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

---

## Notes

- All documentation uses Mermaid diagrams for visual representation
- Code examples are in JavaScript/TypeScript
- Database examples use PostgreSQL syntax
- API examples use REST conventions
- Dates are in ISO 8601 format
- Monetary values are in decimal format (DECIMAL(10,2))

---

**Last Updated**: 2024-01-25

**Version**: 1.0.0




