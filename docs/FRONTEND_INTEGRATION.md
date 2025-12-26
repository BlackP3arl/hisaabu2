# Frontend Integration Documentation

## Overview

This document explains how the frontend currently works with mock data and how it expects the backend to integrate. It describes the data structures, state management, API expectations, and migration path from mock data to real backend.

---

## Current Frontend Architecture

### Technology Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols (Google Fonts)

### Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx       # Main layout wrapper
│   ├── Sidebar.jsx      # Desktop sidebar navigation
│   ├── BottomNav.jsx    # Mobile bottom navigation
│   ├── ItemSelector.jsx # Item selection modal
│   ├── ClientSelector.jsx # Client selection modal
│   └── PrintPreview.jsx # Print preview modal
├── context/
│   └── DataContext.jsx  # Global state management (mock data)
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Clients.jsx
│   ├── ClientForm.jsx
│   ├── ClientDetail.jsx
│   ├── ItemsList.jsx
│   ├── ItemForm.jsx
│   ├── CategoriesList.jsx
│   ├── CategoryForm.jsx
│   ├── QuotationsList.jsx
│   ├── QuotationForm.jsx
│   ├── QuotationDetail.jsx
│   ├── InvoicesList.jsx
│   ├── InvoiceForm.jsx
│   ├── InvoiceDetail.jsx
│   ├── Settings.jsx
│   └── SecureShare.jsx
└── App.jsx             # Main app component with routing
```

---

## Current State Management (Mock Data)

### DataContext.jsx

**Location**: `src/context/DataContext.jsx`

**Purpose**: Provides global state with mock data and CRUD operations

**Current Implementation:**
- Uses React `useState` for all data
- Stores data in memory (lost on page refresh)
- Provides CRUD functions for all entities
- No API calls (all operations are synchronous)

**Data Structures:**
```javascript
{
  clients: [...],
  items: [...],
  categories: [...],
  quotations: [...],
  invoices: [...],
  company: {...},
  settings: {...},
  // CRUD functions
  addClient, updateClient, deleteClient,
  addItem, updateItem, deleteItem,
  // ... etc
}
```

**Usage in Components:**
```javascript
import { useData } from '../context/DataContext'

function MyComponent() {
  const { clients, addClient } = useData()
  // Use clients and functions
}
```

---

## Expected Backend Integration

### API Client Setup

**Recommended Library**: Axios

**Base Configuration:**
```javascript
// src/api/client.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses (token refresh)
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken })
          localStorage.setItem('accessToken', data.token)
          return apiClient(error.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### Updated DataContext

**New Implementation:**
```javascript
// src/context/DataContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../api/client'

const DataContext = createContext()

export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const [clients, setClients] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/clients')
      setClients(data.data.clients)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add client
  const addClient = async (clientData) => {
    try {
      const { data } = await apiClient.post('/clients', clientData)
      setClients(prev => [...prev, data.data.client])
      return data.data.client
    } catch (err) {
      throw err
    }
  }

  // Update client
  const updateClient = async (id, updates) => {
    try {
      const { data } = await apiClient.put(`/clients/${id}`, updates)
      setClients(prev => prev.map(c => c.id === id ? data.data.client : c))
      return data.data.client
    } catch (err) {
      throw err
    }
  }

  // Delete client
  const deleteClient = async (id) => {
    try {
      await apiClient.delete(`/clients/${id}`)
      setClients(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      throw err
    }
  }

  // Load initial data
  useEffect(() => {
    fetchClients()
    // ... fetch other data
  }, [])

  return (
    <DataContext.Provider value={{
      clients,
      items,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      // ... other functions
    }}>
      {children}
    </DataContext.Provider>
  )
}
```

---

## Data Structure Mapping

### Frontend → Backend Field Mapping

**Client:**
```javascript
// Frontend (camelCase)
{
  id: 1,
  name: "Acme Corp",
  email: "contact@acme.com",
  phone: "+1 234 567 8900",
  address: "123 Main St",
  city: "New York",
  postalCode: "10001",
  country: "USA",
  companyName: "Acme Corporation",
  taxId: "TAX-12345",
  status: "active",
  totalBilled: 50000.00,
  outstanding: 5000.00
}

// Backend API Response (camelCase)
// Same format (backend converts snake_case to camelCase)
```

**Quotation/Invoice:**
```javascript
// Frontend
{
  id: 1,
  number: "QT-2024-001",
  clientId: 1,
  clientName: "Acme Corp",
  date: "2024-01-15",
  expiry: "2024-02-15", // or "due" for invoices
  amount: 1045.00,
  status: "sent",
  items: [
    {
      name: "Web Development",
      description: "...",
      quantity: 5,
      price: 120.00,
      discount: 5, // percent
      tax: 10, // percent
      // lineTotal calculated
    }
  ]
}

// Backend API Response
// Same format, but dates as ISO strings
```

---

## API Response Format Expectations

### Success Response

**Standard Format:**
```json
{
  "success": true,
  "data": {
    "client": { /* ... */ }
  }
}
```

**List Response:**
```json
{
  "success": true,
  "data": {
    "clients": [ /* ... */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### Error Response

**Standard Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Email must be valid"]
    }
  }
}
```

---

## Component Updates Required

### List Components (Clients, Items, Quotations, Invoices)

**Current:**
```javascript
const { clients } = useData()
// Display clients
```

**Updated:**
```javascript
const { clients, loading, error, fetchClients } = useData()

useEffect(() => {
  fetchClients()
}, [])

if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
// Display clients
```

### Form Components

**Current:**
```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  addClient(formData)
  navigate('/clients')
}
```

**Updated:**
```javascript
const [submitting, setSubmitting] = useState(false)
const [formError, setFormError] = useState(null)

const handleSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)
  setFormError(null)
  try {
    await addClient(formData)
    navigate('/clients')
  } catch (err) {
    setFormError(err.response?.data?.error?.message || 'Failed to save')
  } finally {
    setSubmitting(false)
  }
}
```

### Detail Components

**Current:**
```javascript
const { id } = useParams()
const { clients } = useData()
const client = clients.find(c => c.id === parseInt(id))
```

**Updated:**
```javascript
const { id } = useParams()
const [client, setClient] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchClient = async () => {
    try {
      const { data } = await apiClient.get(`/clients/${id}`)
      setClient(data.data.client)
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }
  fetchClient()
}, [id])
```

---

## Authentication Integration

### Login Component

**Current:**
```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  onLogin() // Sets localStorage flag
  navigate('/')
}
```

**Updated:**
```javascript
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError(null)
  try {
    const { data } = await apiClient.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.data.token)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.data.user))
    navigate('/')
  } catch (err) {
    setError(err.response?.data?.error?.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}
```

### Protected Routes

**Current:**
```javascript
// App.jsx
{isAuthenticated ? (
  <Route path="/" element={<Dashboard />} />
) : (
  <Route path="*" element={<Navigate to="/login" />} />
)}
```

**Updated:**
```javascript
// Check token validity
const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return false
  // Optionally verify token hasn't expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
```

---

## Loading States

### Implementation Pattern

```javascript
const [loading, setLoading] = useState(false)

// In component
{loading && <LoadingSpinner />}

// In functions
const fetchData = async () => {
  setLoading(true)
  try {
    // API call
  } finally {
    setLoading(false)
  }
}
```

### Skeleton Loaders

**For List Pages:**
```javascript
{loading ? (
  <div className="space-y-3">
    {[1,2,3].map(i => <SkeletonCard key={i} />)}
  </div>
) : (
  // Actual content
)}
```

---

## Error Handling

### Global Error Handler

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.clear()
        window.location.href = '/login'
        break
      case 403:
        return 'Access denied'
      case 404:
        return 'Resource not found'
      case 422:
        // Validation errors
        return data.error?.details || 'Validation failed'
      default:
        return data.error?.message || 'An error occurred'
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.'
  } else {
    // Error setting up request
    return 'An unexpected error occurred'
  }
}
```

### Component Error Display

```javascript
const [error, setError] = useState(null)

// In component
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <p className="text-red-800">{error}</p>
  </div>
)}
```

---

## Search and Filtering

### Current Implementation (Client-side)

```javascript
const [search, setSearch] = useState('')
const filteredClients = clients.filter(client => 
  client.name.toLowerCase().includes(search.toLowerCase())
)
```

### Updated Implementation (Server-side)

```javascript
const [search, setSearch] = useState('')
const [clients, setClients] = useState([])

useEffect(() => {
  const fetchClients = async () => {
    const params = { search }
    const { data } = await apiClient.get('/clients', { params })
    setClients(data.data.clients)
  }
  
  // Debounce search
  const timeoutId = setTimeout(fetchClients, 300)
  return () => clearTimeout(timeoutId)
}, [search])
```

---

## Pagination

### Current Implementation

No pagination (all data loaded at once)

### Updated Implementation

```javascript
const [page, setPage] = useState(1)
const [pagination, setPagination] = useState(null)

const fetchClients = async () => {
  const { data } = await apiClient.get('/clients', {
    params: { page, limit: 20 }
  })
  setClients(data.data.clients)
  setPagination(data.data.pagination)
}

// Pagination controls
{pagination && (
  <div className="flex items-center gap-2">
    <button 
      onClick={() => setPage(p => p - 1)}
      disabled={!pagination.hasPrev}
    >
      Previous
    </button>
    <span>Page {pagination.page} of {pagination.totalPages}</span>
    <button 
      onClick={() => setPage(p => p + 1)}
      disabled={!pagination.hasNext}
    >
      Next
    </button>
  </div>
)}
```

---

## File Upload (Logo)

### Implementation

```javascript
const handleLogoUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('logo', file)
  
  try {
    const { data } = await apiClient.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // Update logo URL
  } catch (err) {
    // Handle error
  }
}
```

---

## Environment Variables

### Required Variables

```env
# .env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Hisaabu
```

### Usage

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Install axios
- [ ] Create API client with interceptors
- [ ] Set up environment variables
- [ ] Create error handler utility

### Phase 2: Authentication
- [ ] Update Login component
- [ ] Update Signup component
- [ ] Implement token storage
- [ ] Add route protection
- [ ] Implement token refresh

### Phase 3: Data Fetching
- [ ] Update DataContext to use API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Update all list components
- [ ] Update all detail components

### Phase 4: CRUD Operations
- [ ] Update all form components
- [ ] Add form validation
- [ ] Add success/error messages
- [ ] Update delete operations

### Phase 5: Advanced Features
- [ ] Implement search (server-side)
- [ ] Implement pagination
- [ ] Add file upload for logo
- [ ] Implement share link generation
- [ ] Add PDF download

### Phase 6: Testing & Polish
- [ ] Test all CRUD operations
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test authentication flow
- [ ] Remove mock data

---

## Testing Backend Integration

### Development Setup

1. **Backend Running**: Ensure backend is running on `http://localhost:3000`
2. **CORS Configured**: Backend must allow requests from frontend origin
3. **Environment Variables**: Set `VITE_API_BASE_URL` in `.env`

### Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Register new user
- [ ] Fetch clients list
- [ ] Create new client
- [ ] Update client
- [ ] Delete client
- [ ] Search clients
- [ ] Filter clients
- [ ] Test all CRUD operations for all entities
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test token refresh
- [ ] Test protected routes

---

## Common Issues & Solutions

### CORS Errors

**Issue**: Browser blocks API requests due to CORS policy

**Solution**: Configure backend CORS to allow frontend origin

### Token Not Sent

**Issue**: API requests return 401 even with valid token

**Solution**: Check axios interceptor is adding Authorization header

### Infinite Loop in useEffect

**Issue**: Component keeps re-fetching data

**Solution**: Add proper dependencies to useEffect, use useCallback for functions

### State Not Updating

**Issue**: Data doesn't update after API call

**Solution**: Ensure state is updated with API response data

---

## Performance Optimization

### Data Caching

```javascript
// Cache data in context to avoid unnecessary API calls
const [clientsCache, setClientsCache] = useState(null)
const [cacheTimestamp, setCacheTimestamp] = useState(null)

const fetchClients = async (force = false) => {
  const cacheAge = Date.now() - cacheTimestamp
  if (!force && clientsCache && cacheAge < 60000) {
    // Use cache if less than 1 minute old
    return clientsCache
  }
  // Fetch from API
}
```

### Debouncing Search

```javascript
import { useDebounce } from '../hooks/useDebounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

useEffect(() => {
  if (debouncedSearch) {
    fetchClients({ search: debouncedSearch })
  }
}, [debouncedSearch])
```

---

## Notes for Backend Team

1. **Response Format**: Ensure all responses follow the documented format
2. **Error Messages**: Provide clear, user-friendly error messages
3. **CORS**: Configure CORS to allow frontend origin
4. **Token Expiration**: Set appropriate expiration times
5. **Rate Limiting**: Implement reasonable rate limits
6. **Validation**: Validate all input on server side
7. **Pagination**: Support pagination for all list endpoints
8. **Search**: Implement full-text search on relevant fields
9. **Date Format**: Return dates as ISO 8601 strings
10. **Field Naming**: Use camelCase in API responses (convert from snake_case)




