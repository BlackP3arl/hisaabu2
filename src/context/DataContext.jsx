import { createContext, useContext, useState, useCallback } from 'react'
import apiClient from '../api/client'
import { handleApiError } from '../utils/errorHandler'

const DataContext = createContext()

export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  // State - all data starts as empty arrays
  const [clients, setClients] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [quotations, setQuotations] = useState([])
  const [invoices, setInvoices] = useState([])
  const [settings, setSettings] = useState(null)
  const [dashboardStats, setDashboardStats] = useState(null)

  // Loading and error states
  const [loading, setLoading] = useState({})
  const [error, setError] = useState(null)

  // Pagination metadata
  const [pagination, setPagination] = useState({})

  // Helper to set loading state for a specific key
  const setLoadingState = (key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  // ==================== CLIENTS ====================

  const fetchClients = useCallback(async (params = {}) => {
    setLoadingState('clients', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/clients', { params })
      if (data.success) {
        setClients(data.data.clients || [])
        setPagination(prev => ({ ...prev, clients: data.data.pagination }))
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('clients', false)
    }
  }, [])

  const getClient = useCallback(async (id) => {
    setLoadingState('client', true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/clients/${id}`)
      if (data.success) {
        return data.data.client
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('client', false)
    }
  }, [])

  const createClient = useCallback(async (clientData) => {
    setLoadingState('client', true)
    setError(null)
    try {
      const { data } = await apiClient.post('/clients', clientData)
      if (data.success) {
        const newClient = data.data.client
        setClients(prev => [...prev, newClient])
        return newClient
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('client', false)
    }
  }, [])

  const updateClient = useCallback(async (id, updates) => {
    setLoadingState('client', true)
    setError(null)
    try {
      const { data } = await apiClient.put(`/clients/${id}`, updates)
      if (data.success) {
        const updatedClient = data.data.client
        setClients(prev => prev.map(c => c.id === id ? updatedClient : c))
        return updatedClient
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('client', false)
    }
  }, [])

  const deleteClient = useCallback(async (id) => {
    setLoadingState('client', true)
    setError(null)
    try {
      await apiClient.delete(`/clients/${id}`)
      setClients(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('client', false)
    }
  }, [])

  // ==================== CATEGORIES ====================

  const fetchCategories = useCallback(async (params = {}) => {
    setLoadingState('categories', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/categories', { params })
      if (data.success) {
        setCategories(data.data.categories || [])
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('categories', false)
    }
  }, [])

  const getCategory = useCallback(async (id) => {
    setLoadingState('category', true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/categories/${id}`)
      if (data.success) {
        return data.data.category
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('category', false)
    }
  }, [])

  const createCategory = useCallback(async (categoryData) => {
    setLoadingState('category', true)
    setError(null)
    try {
      const { data } = await apiClient.post('/categories', categoryData)
      if (data.success) {
        const newCategory = data.data.category
        setCategories(prev => [...prev, newCategory])
        return newCategory
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('category', false)
    }
  }, [])

  const updateCategory = useCallback(async (id, updates) => {
    setLoadingState('category', true)
    setError(null)
    try {
      const { data } = await apiClient.put(`/categories/${id}`, updates)
      if (data.success) {
        const updatedCategory = data.data.category
        setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c))
        return updatedCategory
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('category', false)
    }
  }, [])

  const deleteCategory = useCallback(async (id) => {
    setLoadingState('category', true)
    setError(null)
    try {
      await apiClient.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('category', false)
    }
  }, [])

  // ==================== ITEMS ====================

  const fetchItems = useCallback(async (params = {}) => {
    setLoadingState('items', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/items', { params })
      if (data.success) {
        setItems(data.data.items || [])
        setPagination(prev => ({ ...prev, items: data.data.pagination }))
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('items', false)
    }
  }, [])

  const getItem = useCallback(async (id) => {
    setLoadingState('item', true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/items/${id}`)
      if (data.success) {
        return data.data.item
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('item', false)
    }
  }, [])

  const createItem = useCallback(async (itemData) => {
    setLoadingState('item', true)
    setError(null)
    try {
      const { data } = await apiClient.post('/items', itemData)
      if (data.success) {
        const newItem = data.data.item
        setItems(prev => [...prev, newItem])
        return newItem
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('item', false)
    }
  }, [])

  const updateItem = useCallback(async (id, updates) => {
    setLoadingState('item', true)
    setError(null)
    try {
      const { data } = await apiClient.put(`/items/${id}`, updates)
      if (data.success) {
        const updatedItem = data.data.item
        setItems(prev => prev.map(i => i.id === id ? updatedItem : i))
        return updatedItem
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('item', false)
    }
  }, [])

  const deleteItem = useCallback(async (id) => {
    setLoadingState('item', true)
    setError(null)
    try {
      await apiClient.delete(`/items/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('item', false)
    }
  }, [])

  // ==================== QUOTATIONS ====================

  const fetchQuotations = useCallback(async (params = {}) => {
    setLoadingState('quotations', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/quotations', { params })
      if (data.success) {
        setQuotations(data.data.quotations || [])
        setPagination(prev => ({ ...prev, quotations: data.data.pagination }))
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('quotations', false)
    }
  }, [])

  const getQuotation = useCallback(async (id) => {
    setLoadingState('quotation', true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/quotations/${id}`)
      if (data.success) {
        return data.data.quotation
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('quotation', false)
    }
  }, [])

  const createQuotation = useCallback(async (quotationData) => {
    setLoadingState('quotation', true)
    setError(null)
    try {
      const { data } = await apiClient.post('/quotations', quotationData)
      if (data.success) {
        const newQuotation = data.data.quotation
        setQuotations(prev => [...prev, newQuotation])
        return newQuotation
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('quotation', false)
    }
  }, [])

  const updateQuotation = useCallback(async (id, updates) => {
    setLoadingState('quotation', true)
    setError(null)
    try {
      const { data } = await apiClient.put(`/quotations/${id}`, updates)
      if (data.success) {
        const updatedQuotation = data.data.quotation
        setQuotations(prev => prev.map(q => q.id === id ? updatedQuotation : q))
        return updatedQuotation
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('quotation', false)
    }
  }, [])

  const deleteQuotation = useCallback(async (id) => {
    setLoadingState('quotation', true)
    setError(null)
    try {
      await apiClient.delete(`/quotations/${id}`)
      setQuotations(prev => prev.filter(q => q.id !== id))
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('quotation', false)
    }
  }, [])

  const convertQuotationToInvoice = useCallback(async (id) => {
    setLoadingState('quotation', true)
    setError(null)
    try {
      const { data } = await apiClient.post(`/quotations/${id}/convert`)
      if (data.success) {
        const invoice = data.data.invoice
        setInvoices(prev => [...prev, invoice])
        // Update quotation status
        setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'accepted' } : q))
        return invoice
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('quotation', false)
    }
  }, [])

  // ==================== INVOICES ====================

  const fetchInvoices = useCallback(async (params = {}) => {
    setLoadingState('invoices', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/invoices', { params })
      if (data.success) {
        setInvoices(data.data.invoices || [])
        setPagination(prev => ({ ...prev, invoices: data.data.pagination }))
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('invoices', false)
    }
  }, [])

  const getInvoice = useCallback(async (id) => {
    setLoadingState('invoice', true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/invoices/${id}`)
      if (data.success) {
        return data.data.invoice
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('invoice', false)
    }
  }, [])

  const createInvoice = useCallback(async (invoiceData) => {
    setLoadingState('invoice', true)
    setError(null)
    try {
      const { data } = await apiClient.post('/invoices', invoiceData)
      if (data.success) {
        const newInvoice = data.data.invoice
        setInvoices(prev => [...prev, newInvoice])
        return newInvoice
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('invoice', false)
    }
  }, [])

  const updateInvoice = useCallback(async (id, updates) => {
    setLoadingState('invoice', true)
    setError(null)
    try {
      const { data } = await apiClient.put(`/invoices/${id}`, updates)
      if (data.success) {
        const updatedInvoice = data.data.invoice
        setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i))
        return updatedInvoice
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('invoice', false)
    }
  }, [])

  const deleteInvoice = useCallback(async (id) => {
    setLoadingState('invoice', true)
    setError(null)
    try {
      await apiClient.delete(`/invoices/${id}`)
      setInvoices(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('invoice', false)
    }
  }, [])

  // ==================== PAYMENTS ====================

  const recordPayment = useCallback(async (invoiceId, paymentData) => {
    setLoadingState('payment', true)
    setError(null)
    try {
      const { data } = await apiClient.post(`/invoices/${invoiceId}/payments`, paymentData)
      if (data.success) {
        const payment = data.data.payment
        // Refresh invoice to get updated payment status
        const invoice = await getInvoice(invoiceId)
        setInvoices(prev => prev.map(i => i.id === invoiceId ? invoice : i))
        return payment
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('payment', false)
    }
  }, [getInvoice])

  const updatePayment = useCallback(async (invoiceId, paymentId, updates) => {
    setLoadingState('payment', true)
    setError(null)
    try {
      const { data } = await apiClient.put(`/invoices/${invoiceId}/payments/${paymentId}`, updates)
      if (data.success) {
        const payment = data.data.payment
        // Refresh invoice
        const invoice = await getInvoice(invoiceId)
        setInvoices(prev => prev.map(i => i.id === invoiceId ? invoice : i))
        return payment
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('payment', false)
    }
  }, [getInvoice])

  const deletePayment = useCallback(async (invoiceId, paymentId) => {
    setLoadingState('payment', true)
    setError(null)
    try {
      await apiClient.delete(`/invoices/${invoiceId}/payments/${paymentId}`)
      // Refresh invoice
      const invoice = await getInvoice(invoiceId)
      setInvoices(prev => prev.map(i => i.id === invoiceId ? invoice : i))
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('payment', false)
    }
  }, [getInvoice])

  // ==================== SETTINGS ====================

  const fetchSettings = useCallback(async () => {
    setLoadingState('settings', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/settings')
      if (data.success) {
        setSettings(data.data.settings)
        return data.data.settings
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('settings', false)
    }
  }, [])

  const updateSettings = useCallback(async (updates) => {
    setLoadingState('settings', true)
    setError(null)
    try {
      const { data } = await apiClient.put('/settings', updates)
      if (data.success) {
        const updatedSettings = data.data.settings
        setSettings(updatedSettings)
        return updatedSettings
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('settings', false)
    }
  }, [])

  const uploadLogo = useCallback(async (file) => {
    setLoadingState('settings', true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const { data } = await apiClient.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) {
        const updatedSettings = data.data.settings
        setSettings(updatedSettings)
        return updatedSettings
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('settings', false)
    }
  }, [])

  // ==================== DASHBOARD ====================

  const fetchDashboardStats = useCallback(async () => {
    setLoadingState('dashboard', true)
    setError(null)
    try {
      const { data } = await apiClient.get('/dashboard/stats')
      if (data.success) {
        setDashboardStats(data.data)
        return data.data
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('dashboard', false)
    }
  }, [])

  // ==================== SHARE LINKS ====================

  const generateShareLink = useCallback(async (documentType, documentId, options = {}) => {
    setLoadingState('shareLink', true)
    setError(null)
    try {
      const { data } = await apiClient.post('/share-links', {
        documentType,
        documentId,
        ...options
      })
      if (data.success) {
        return data.data.shareLink
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('shareLink', false)
    }
  }, [])

  const getShareLink = useCallback(async (token) => {
    setLoadingState('shareLink', true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/share-links/${token}`)
      if (data.success) {
        return data.data.shareLink
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('shareLink', false)
    }
  }, [])

  const verifyShareLinkPassword = useCallback(async (token, password) => {
    setLoadingState('shareLink', true)
    setError(null)
    try {
      const { data } = await apiClient.post(`/share-links/${token}/verify`, { password })
      if (data.success) {
        return data.data.shareLink
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('shareLink', false)
    }
  }, [])

  const deactivateShareLink = useCallback(async (token) => {
    setLoadingState('shareLink', true)
    setError(null)
    try {
      const { data } = await apiClient.post(`/share-links/${token}/deactivate`)
      if (data.success) {
        return data.data.shareLink
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message)
      throw err
    } finally {
      setLoadingState('shareLink', false)
    }
  }, [])

  // Legacy function names for backward compatibility
  const addClient = createClient
  const addCategory = createCategory
  const addItem = createItem
  const addQuotation = createQuotation
  const addInvoice = createInvoice
  
  // Settings aliases
  const fetchCompanySettings = fetchSettings
  const updateCompanySettings = updateSettings
  const uploadCompanyLogo = uploadLogo
  const companySettings = settings

  return (
    <DataContext.Provider value={{
      // Data
      clients,
      categories,
      items,
      quotations,
      invoices,
      settings,
      dashboardStats,
      // Loading and error states
      loading,
      error,
      pagination,
      // Clients
      fetchClients,
      getClient,
      createClient,
      updateClient,
      deleteClient,
      addClient, // Legacy
      // Categories
      fetchCategories,
      getCategory,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategory, // Legacy
      // Items
      fetchItems,
      getItem,
      createItem,
      updateItem,
      deleteItem,
      addItem, // Legacy
      // Quotations
      fetchQuotations,
      getQuotation,
      createQuotation,
      updateQuotation,
      deleteQuotation,
      convertQuotationToInvoice,
      addQuotation, // Legacy
      // Invoices
      fetchInvoices,
      getInvoice,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      addInvoice, // Legacy
      // Payments
      recordPayment,
      updatePayment,
      deletePayment,
      // Settings
      fetchSettings,
      updateSettings,
      uploadLogo,
      // Settings aliases
      fetchCompanySettings,
      updateCompanySettings,
      uploadCompanyLogo,
      companySettings,
      // Dashboard
      fetchDashboardStats,
      // Share Links
      generateShareLink,
      getShareLink,
      verifyShareLinkPassword,
      deactivateShareLink,
    }}>
      {children}
    </DataContext.Provider>
  )
}
