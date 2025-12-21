import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientForm from './pages/ClientForm'
import ClientDetail from './pages/ClientDetail'
import QuotationsList from './pages/QuotationsList'
import QuotationForm from './pages/QuotationForm'
import InvoicesList from './pages/InvoicesList'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceDetail from './pages/InvoiceDetail'
import QuotationDetail from './pages/QuotationDetail'
import ItemsList from './pages/ItemsList'
import ItemForm from './pages/ItemForm'
import CategoriesList from './pages/CategoriesList'
import CategoryForm from './pages/CategoryForm'
import UOMsList from './pages/UOMsList'
import UOMForm from './pages/UOMForm'
import Settings from './pages/Settings'
import SecureShare from './pages/SecureShare'
import { DataProvider } from './context/DataContext'
import { isAuthenticated as checkAuth, clearAuth } from './utils/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth)

  useEffect(() => {
    // Check authentication status on mount and when storage changes
    const checkAuthStatus = () => {
      const authStatus = checkAuth()
      setIsAuthenticated(authStatus)
      
      // If not authenticated and not on login/signup page, clear any stale data
      if (!authStatus && !['/login', '/signup'].includes(window.location.pathname)) {
        clearAuth()
      }
    }

    checkAuthStatus()

    // Listen for storage changes (e.g., when login happens in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken') {
        checkAuthStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check periodically (every 5 minutes) to catch token expiration
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/share/:type/:id" element={<SecureShare />} />
          
          {isAuthenticated ? (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/new" element={<ClientForm />} />
              <Route path="/clients/:id" element={<ClientForm />} />
              <Route path="/clients/:id/view" element={<ClientDetail />} />
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/quotations/new" element={<QuotationForm />} />
              <Route path="/quotations/:id" element={<QuotationForm />} />
              <Route path="/quotations/:id/view" element={<QuotationDetail />} />
              <Route path="/invoices" element={<InvoicesList />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id" element={<InvoiceForm />} />
              <Route path="/invoices/:id/view" element={<InvoiceDetail />} />
              <Route path="/items" element={<ItemsList />} />
              <Route path="/items/new" element={<ItemForm />} />
              <Route path="/items/:id" element={<ItemForm />} />
              <Route path="/categories" element={<CategoriesList />} />
              <Route path="/categories/new" element={<CategoryForm />} />
              <Route path="/categories/:id" element={<CategoryForm />} />
              <Route path="/uoms" element={<UOMsList />} />
              <Route path="/uoms/new" element={<UOMForm />} />
              <Route path="/uoms/:id" element={<UOMForm />} />
              <Route path="/settings" element={<Settings />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
