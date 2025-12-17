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
import Settings from './pages/Settings'
import SecureShare from './pages/SecureShare'
import { DataProvider } from './context/DataContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString())
  }, [isAuthenticated])

  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
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
