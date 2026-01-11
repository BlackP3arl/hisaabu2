import apiClient from './client.js'

/**
 * Get list of recurring invoices
 */
export const getRecurringInvoices = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.search) params.append('search', filters.search)
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.clientId) params.append('clientId', filters.clientId)
  if (filters.sort) params.append('sort', filters.sort)
  if (filters.order) params.append('order', filters.order)

  const response = await apiClient.get(`/recurring-invoices?${params.toString()}`)
  return response.data
}

/**
 * Get recurring invoice by ID
 */
export const getRecurringInvoice = async (id) => {
  const response = await apiClient.get(`/recurring-invoices/${id}`)
  return response.data
}

/**
 * Create new recurring invoice
 */
export const createRecurringInvoice = async (data) => {
  const response = await apiClient.post('/recurring-invoices', data)
  return response.data
}

/**
 * Update recurring invoice
 */
export const updateRecurringInvoice = async (id, data) => {
  const response = await apiClient.put(`/recurring-invoices/${id}`, data)
  return response.data
}

/**
 * Delete recurring invoice
 */
export const deleteRecurringInvoice = async (id) => {
  const response = await apiClient.delete(`/recurring-invoices/${id}`)
  return response.data
}

/**
 * Start recurring invoice
 */
export const startRecurringInvoice = async (id) => {
  const response = await apiClient.post(`/recurring-invoices/${id}/start`)
  return response.data
}

/**
 * Stop recurring invoice
 */
export const stopRecurringInvoice = async (id) => {
  const response = await apiClient.post(`/recurring-invoices/${id}/stop`)
  return response.data
}

/**
 * Get schedule for recurring invoice
 */
export const getRecurringInvoiceSchedule = async (id, count = 12) => {
  const response = await apiClient.get(`/recurring-invoices/${id}/schedule?count=${count}`)
  return response.data
}

/**
 * Get invoices generated from recurring invoice
 */
export const getGeneratedInvoices = async (id, filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.sort) params.append('sort', filters.sort)
  if (filters.order) params.append('order', filters.order)

  const response = await apiClient.get(`/recurring-invoices/${id}/generated-invoices?${params.toString()}`)
  return response.data
}

