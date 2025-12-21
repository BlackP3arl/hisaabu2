# Hisaabu - Invoice & Quotation Management System

Demo credentials:
Login: Any email/password (validation only)
Secure Share Password: demo123

A modern, mobile-responsive web application for managing invoices and quotations with comprehensive features for businesses.

## Features

### Core Functionality
- ✅ Secure user authentication with 2FA support
- ✅ User signup and login
- ✅ Dashboard with summary cards and recent activity
- ✅ Client management with search and filters
- ✅ Quotation creation, editing, and management
- ✅ Invoice creation, editing, and management
- ✅ Convert quotations to invoices
- ✅ Payment status tracking (Draft, Sent, Paid, Partially Paid, Overdue)
- ✅ Secure document sharing with password protection
- ✅ Settings for company profile, tax configuration, and invoice settings

### UI/UX
- ✅ Mobile-responsive design
- ✅ Dark mode support
- ✅ Clean, modern interface matching provided mockups
- ✅ Bottom navigation for easy access
- ✅ Material Symbols icons
- ✅ Tailwind CSS styling

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Material Symbols** - Icons
- **Context API** - State management

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable components (BottomNav, etc.)
├── context/         # Context providers (DataContext)
├── pages/           # Page components
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Clients.jsx
│   ├── QuotationsList.jsx
│   ├── QuotationForm.jsx
│   ├── QuotationDetail.jsx
│   ├── InvoicesList.jsx
│   ├── InvoiceForm.jsx
│   ├── InvoiceDetail.jsx
│   ├── Settings.jsx
│   └── SecureShare.jsx
├── App.jsx          # Main app component with routing
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Mock Data

The application uses mock data stored in `DataContext`. All data is stored in memory and will reset on page refresh. This is intentional for the frontend-only phase.

### Demo Credentials
- **Login**: Any email/password (validation only)
- **Secure Share Password**: `demo123`

## Features Implemented

### Authentication
- Login screen with email/password
- 2FA code input (demo)
- Signup screen
- Password visibility toggle
- Forgot password link

### Dashboard
- Total outstanding amount card
- Total quotations card
- Total invoices card
- Paid/Unpaid/Overdue status breakdown
- Quick actions (New Invoice, New Quote)
- Recent activity feed

### Clients
- Client list with search
- Filter by status (All, Active, Overdue, Archived)
- Client cards with contact info
- Total billed/outstanding amounts
- Quick contact actions

### Quotations
- List view with search and filters
- Status badges (Draft, Sent, Accepted, Expired)
- Create/Edit quotation form
- Line items with quantity, price, discount, tax
- Automatic total calculations
- Issue date and expiry date
- Notes and terms & conditions

### Invoices
- List view with search and filters
- Status badges (Draft, Sent, Paid, Partial, Overdue)
- Create/Edit invoice form
- Payment status selector
- Line items with calculations
- Issue date and due date
- Notes and terms & conditions

### Settings
- Company profile management
- Tax & finance configuration
- Invoice configuration (prefixes, terms)

### Secure Sharing
- Password-protected document view
- Read-only document preview
- Download PDF button
- Acknowledge button

## Next Steps (Backend Integration)

When connecting to backend:
1. Replace `DataContext` with API calls
2. Implement real authentication with JWT tokens
3. Add PDF generation service
4. Implement file upload for company logo
5. Add real-time notifications
6. Implement audit logging
7. Add export functionality (PDF/Excel)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT



