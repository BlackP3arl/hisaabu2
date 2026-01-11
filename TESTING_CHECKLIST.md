# Frontend Integration Testing Checklist

## Pre-Testing Setup

### Backend Setup
- [ ] Backend server is running on port 3000
- [ ] Database connection is established
- [ ] Environment variables are configured (`.env` file exists)
- [ ] All database migrations have been run

### Frontend Setup
- [ ] Frontend server is running (Vite dev server)
- [ ] `.env` file exists with `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- [ ] No console errors on initial load
- [ ] Browser console is open for monitoring

---

## 1. User Registration and Login ✅

### Registration Test
- [ ] Navigate to `/signup`
- [ ] Fill in registration form with valid data
- [ ] Submit form
- [ ] Verify success message/redirect
- [ ] Verify tokens are stored in localStorage
- [ ] Verify user data is stored

**Test Cases:**
- [ ] Valid registration (new email)
- [ ] Duplicate email (should show error)
- [ ] Invalid email format
- [ ] Password too short (< 8 characters)
- [ ] Password mismatch
- [ ] Missing required fields

### Login Test
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Verify tokens in localStorage
- [ ] Verify user data in localStorage

**Test Cases:**
- [ ] Valid credentials
- [ ] Invalid email
- [ ] Invalid password
- [ ] Non-existent user
- [ ] Empty fields

---

## 2. Token Refresh on 401 Errors ✅

### Automatic Token Refresh
- [ ] Login successfully
- [ ] Wait for access token to expire (or manually expire it)
- [ ] Make an API call (e.g., navigate to clients page)
- [ ] Verify token refresh happens automatically
- [ ] Verify new tokens are stored
- [ ] Verify original request succeeds

**Test Cases:**
- [ ] Token refresh on expired access token
- [ ] Token refresh failure (invalid refresh token)
- [ ] Redirect to login on refresh failure
- [ ] No infinite refresh loop

---

## 3. Client CRUD Operations ✅

### Create Client
- [ ] Navigate to `/clients/new`
- [ ] Fill in client form
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify redirect to client list or detail
- [ ] Verify client appears in list

**Test Cases:**
- [ ] Valid client data
- [ ] Missing required fields (name, email)
- [ ] Invalid email format
- [ ] Duplicate email

### Read Clients
- [ ] Navigate to `/clients`
- [ ] Verify clients list loads
- [ ] Verify loading state shows initially
- [ ] Verify clients are displayed correctly
- [ ] Click on a client to view details
- [ ] Verify client detail page loads

**Test Cases:**
- [ ] Empty client list
- [ ] Client list with data
- [ ] Client detail page
- [ ] Non-existent client ID (404)

### Update Client
- [ ] Navigate to `/clients/:id`
- [ ] Modify client data
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify changes are reflected in list

**Test Cases:**
- [ ] Valid updates
- [ ] Invalid email format
- [ ] Missing required fields

### Delete Client
- [ ] Navigate to client detail page
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify success message
- [ ] Verify redirect to list
- [ ] Verify client removed from list

**Test Cases:**
- [ ] Delete with confirmation
- [ ] Cancel deletion
- [ ] Delete client with invoices (should show error)

---

## 4. Category CRUD Operations ✅

### Create Category
- [ ] Navigate to `/categories/new`
- [ ] Fill in category form (name, color)
- [ ] Submit form
- [ ] Verify success and redirect

### Read Categories
- [ ] Navigate to `/categories`
- [ ] Verify categories list loads
- [ ] Verify search functionality

### Update Category
- [ ] Navigate to `/categories/:id`
- [ ] Modify category data
- [ ] Submit and verify changes

### Delete Category
- [ ] Delete a category
- [ ] Verify deletion and redirect

---

## 5. Item CRUD Operations ✅

### Create Item
- [ ] Navigate to `/items/new`
- [ ] Fill in item form (name, rate, category)
- [ ] Submit form
- [ ] Verify success

### Read Items
- [ ] Navigate to `/items`
- [ ] Verify items list loads
- [ ] Test search functionality
- [ ] Test category filter
- [ ] Test pagination

### Update Item
- [ ] Navigate to `/items/:id`
- [ ] Modify item data
- [ ] Submit and verify

### Delete Item
- [ ] Delete an item
- [ ] Verify deletion

---

## 6. Quotation CRUD Operations ✅

### Create Quotation
- [ ] Navigate to `/quotations/new`
- [ ] Select client
- [ ] Add line items
- [ ] Fill in dates and terms
- [ ] Submit form
- [ ] Verify quotation created

**Test Cases:**
- [ ] Quotation with multiple items
- [ ] Quotation with discounts
- [ ] Quotation with taxes
- [ ] Quotation without client (should show error)

### Read Quotations
- [ ] Navigate to `/quotations`
- [ ] Verify quotations list loads
- [ ] Test search
- [ ] Test status filter
- [ ] Test pagination

### Update Quotation
- [ ] Navigate to `/quotations/:id`
- [ ] Modify quotation
- [ ] Submit and verify

### Delete Quotation
- [ ] Delete a quotation
- [ ] Verify deletion

### Convert to Invoice
- [ ] Navigate to quotation detail
- [ ] Click "Convert to Invoice"
- [ ] Verify invoice is created
- [ ] Verify redirect to invoice

---

## 7. Invoice CRUD Operations ✅

### Create Invoice
- [ ] Navigate to `/invoices/new`
- [ ] Select client
- [ ] Add line items
- [ ] Fill in dates
- [ ] Submit form
- [ ] Verify invoice created

### Read Invoices
- [ ] Navigate to `/invoices`
- [ ] Verify invoices list loads (no errors)
- [ ] Test search
- [ ] Test status filter
- [ ] Test pagination

### Update Invoice
- [ ] Navigate to `/invoices/:id`
- [ ] Modify invoice
- [ ] Submit and verify

### Delete Invoice
- [ ] Delete an invoice
- [ ] Verify deletion

---

## 8. Payment Recording and Management ✅

### Record Payment
- [ ] Navigate to invoice detail
- [ ] Click "Record Payment"
- [ ] Fill in payment form (amount, date, method)
- [ ] Submit
- [ ] Verify payment recorded
- [ ] Verify invoice status updated

**Test Cases:**
- [ ] Full payment
- [ ] Partial payment
- [ ] Payment exceeding invoice amount (should show error)
- [ ] Invalid payment date

### Update Payment
- [ ] Navigate to invoice detail
- [ ] Click edit on a payment
- [ ] Modify payment data
- [ ] Submit and verify

### Delete Payment
- [ ] Delete a payment
- [ ] Verify payment removed
- [ ] Verify invoice status updated

---

## 9. PDF Download for Quotations and Invoices ✅

### Quotation PDF
- [ ] Navigate to quotation detail
- [ ] Click "Download PDF"
- [ ] Verify PDF downloads
- [ ] Verify PDF content is correct
- [ ] Verify PDF includes company logo (if set)

### Invoice PDF
- [ ] Navigate to invoice detail
- [ ] Click "Download PDF"
- [ ] Verify PDF downloads
- [ ] Verify PDF content is correct
- [ ] Verify payments are shown (if any)

**Test Cases:**
- [ ] PDF with logo
- [ ] PDF without logo
- [ ] PDF with multiple line items
- [ ] PDF with discounts and taxes

---

## 10. Share Link Generation and Access ✅

### Generate Share Link
- [ ] Navigate to quotation/invoice detail
- [ ] Click "Generate Share Link"
- [ ] Verify link is generated
- [ ] Verify link can be copied
- [ ] Test with password protection

### Access Shared Document
- [ ] Open share link in incognito/private window
- [ ] Verify document loads (if no password)
- [ ] Enter password (if protected)
- [ ] Verify document displays correctly
- [ ] Test "Acknowledge" functionality

**Test Cases:**
- [ ] Share link without password
- [ ] Share link with password
- [ ] Invalid password
- [ ] Expired share link
- [ ] Deactivated share link

---

## 11. Company Settings Update and Logo Upload ✅

### Update Settings
- [ ] Navigate to `/settings`
- [ ] Modify company information
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify changes are saved

### Upload Logo
- [ ] Navigate to `/settings`
- [ ] Click "Upload Logo"
- [ ] Select image file
- [ ] Submit
- [ ] Verify logo uploads
- [ ] Verify logo appears in settings
- [ ] Verify logo appears in PDFs

**Test Cases:**
- [ ] Valid image file (PNG, JPG)
- [ ] Invalid file type
- [ ] File too large
- [ ] No file selected

---

## 12. Dashboard Statistics Display ✅

### Dashboard Load
- [ ] Navigate to `/` (dashboard)
- [ ] Verify dashboard loads
- [ ] Verify loading state shows initially
- [ ] Verify statistics cards display
- [ ] Verify recent activity shows

**Test Cases:**
- [ ] Dashboard with data
- [ ] Dashboard with no data (empty state)
- [ ] Dashboard with loading state
- [ ] Dashboard with error state

---

## 13. Search and Filtering on All List Pages ✅

### Clients Search
- [ ] Navigate to `/clients`
- [ ] Type in search box
- [ ] Verify debounce (300ms delay)
- [ ] Verify results update
- [ ] Test status filter

### Items Search
- [ ] Navigate to `/items`
- [ ] Test search functionality
- [ ] Test category filter
- [ ] Verify filters work together

### Quotations Search
- [ ] Navigate to `/quotations`
- [ ] Test search
- [ ] Test status filter

### Invoices Search
- [ ] Navigate to `/invoices`
- [ ] Test search
- [ ] Test status filter

**Test Cases:**
- [ ] Search with results
- [ ] Search with no results
- [ ] Search with special characters
- [ ] Clear search
- [ ] Multiple filters combined

---

## 14. Pagination on All List Pages ✅

### Clients Pagination
- [ ] Navigate to `/clients`
- [ ] Verify pagination controls appear (if > 1 page)
- [ ] Click "Next"
- [ ] Verify page changes
- [ ] Click "Previous"
- [ ] Verify page changes
- [ ] Verify page info displays correctly

### Items Pagination
- [ ] Test pagination on items list

### Quotations Pagination
- [ ] Test pagination on quotations list

### Invoices Pagination
- [ ] Test pagination on invoices list

**Test Cases:**
- [ ] First page (Previous disabled)
- [ ] Last page (Next disabled)
- [ ] Middle pages
- [ ] Page info display
- [ ] Pagination with search/filters

---

## 15. Error Handling and Display ✅

### Network Errors
- [ ] Stop backend server
- [ ] Try to load a page
- [ ] Verify error message displays
- [ ] Verify error is user-friendly

### Validation Errors
- [ ] Submit form with invalid data
- [ ] Verify validation errors display
- [ ] Verify field-specific errors

### 404 Errors
- [ ] Navigate to non-existent resource
- [ ] Verify 404 error displays

### 401 Errors
- [ ] Expire token
- [ ] Make API call
- [ ] Verify token refresh or redirect

**Test Cases:**
- [ ] Network timeout
- [ ] Server error (500)
- [ ] Not found (404)
- [ ] Unauthorized (401)
- [ ] Validation errors (422)

---

## 16. Loading States on All Pages ✅

### List Pages
- [ ] Navigate to any list page
- [ ] Verify loading skeleton/spinner shows
- [ ] Verify loading disappears when data loads

### Detail Pages
- [ ] Navigate to detail page
- [ ] Verify loading indicator shows
- [ ] Verify loading disappears

### Form Submissions
- [ ] Submit any form
- [ ] Verify loading indicator displays
- [ ] Verify loading disappears on completion

**Test Cases:**
- [ ] Initial page load
- [ ] Data refresh
- [ ] Form submission
- [ ] Search/filter operations

---

## Browser Compatibility Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Testing

- [ ] Page load times
- [ ] API response times
- [ ] Large dataset handling
- [ ] Image upload performance

---

## Security Testing

- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Token security
- [ ] Password security
- [ ] Share link security

---

## Notes

- Test in both light and dark mode
- Test on different screen sizes (mobile, tablet, desktop)
- Test with slow network (throttle in DevTools)
- Monitor browser console for errors
- Monitor network tab for API calls

---

**Testing Date**: $(date)
**Tester**: 
**Status**: In Progress


