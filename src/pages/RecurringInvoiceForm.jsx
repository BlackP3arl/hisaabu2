import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'
import ItemSelector from '../components/ItemSelector'
import { getCurrencySymbol, getSupportedCurrencies } from '../utils/currency'
import { getRecurringInvoice, createRecurringInvoice, updateRecurringInvoice } from '../api/recurringInvoices.js'

export default function RecurringInvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchClients, fetchCategories, clients, categories, companySettings, fetchCompanySettings, loading } = useData()
  const [recurringInvoice, setRecurringInvoice] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [showItemSelector, setShowItemSelector] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDateDays: 30,
    autoBill: 'disabled',
    items: [],
    notes: '',
    terms: '',
    currency: '',
    exchangeRate: null,
  })

  // Load clients, categories, and settings on mount
  useEffect(() => {
    fetchClients()
    fetchCategories()
    if (!companySettings) {
      fetchCompanySettings()
    }
  }, [fetchClients, fetchCategories, fetchCompanySettings, companySettings])

  // Set default currency from company settings
  useEffect(() => {
    if (companySettings && !formData.currency && !id) {
      setFormData(prev => ({
        ...prev,
        currency: companySettings.currency || 'MVR',
      }))
    }
  }, [companySettings, id])

  // Ensure clients are loaded
  useEffect(() => {
    if (clients.length === 0) {
      fetchClients({ limit: 1000 })
    }
  }, [clients.length, fetchClients])

  // Load recurring invoice data if editing
  useEffect(() => {
    if (id) {
      const loadRecurringInvoice = async () => {
        try {
          const response = await getRecurringInvoice(parseInt(id))
          if (response.data?.recurringInvoice) {
            const ri = response.data.recurringInvoice
            setRecurringInvoice(ri)
            setFormData({
              clientId: ri.clientId || ri.client?.id || '',
              frequency: ri.frequency || 'monthly',
              startDate: ri.startDate || new Date().toISOString().split('T')[0],
              endDate: ri.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              dueDateDays: ri.dueDateDays || 30,
              autoBill: ri.autoBill || 'disabled',
              items: ri.items?.map(item => ({
                itemId: item.itemId,
                name: item.name,
                description: item.description || '',
                quantity: item.quantity || 1,
                price: item.price || 0,
                discountPercent: item.discountPercent || 0,
                taxPercent: item.taxPercent || 0,
                categoryId: item.categoryId,
                uomCode: item.uomCode || 'PC',
                uomId: item.uomId,
              })) || [],
              notes: ri.notes || '',
              terms: ri.terms || '',
              currency: ri.currency || companySettings?.currency || 'MVR',
              exchangeRate: ri.exchangeRate || null,
            })
          }
        } catch (err) {
          setFormError('Failed to load recurring invoice data')
        }
      }
      loadRecurringInvoice()
    }
  }, [id, companySettings])

  const client = clients.find(c => c.id === formData.clientId)

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  const baseCurrency = companySettings?.baseCurrency || 'USD'
  const currencySymbol = getCurrencySymbol(formData.currency || companySettings?.currency || 'MVR')
  const currencyCode = formData.currency || companySettings?.currency || 'MVR'
  const showExchangeRate = formData.currency && formData.currency !== baseCurrency

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.price) || 0)), 0)
    const discount = formData.items.reduce((sum, item) => {
      const itemDiscount = item.discountPercent || item.discount || 0
      return sum + (item.quantity * (parseFloat(item.price) || 0) * itemDiscount / 100)
    }, 0)
    const afterDiscount = subtotal - discount
    const tax = formData.items.reduce((sum, item) => {
      const itemDiscount = item.discountPercent || item.discount || 0
      const itemTax = item.taxPercent || item.tax || 0
      const itemTotal = item.quantity * (parseFloat(item.price) || 0) * (1 - itemDiscount / 100)
      return sum + (itemTotal * itemTax / 100)
    }, 0)
    const total = afterDiscount + tax
    return { subtotal, discount, tax, total }
  }

  const { subtotal, discount, tax, total } = calculateTotals()

  const handleAddItem = (item) => {
    const newItem = {
      itemId: item.id,
      name: item.name,
      description: item.description || '',
      quantity: 1,
      price: 0,
      discountPercent: 0,
      taxPercent: item.taxPercent !== undefined ? item.taxPercent : (item.tax !== undefined ? item.tax : 0),
      categoryId: item.categoryId,
      uomCode: item.uomCode || 'PC',
      uomId: item.uomId,
    }
    setFormData({ ...formData, items: [...formData.items, newItem] })
  }

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...formData.items]
    if (field === 'discount' || field === 'discountPercent') {
      newItems[index] = { ...newItems[index], discountPercent: parseFloat(value) || 0 }
    } else if (field === 'tax' || field === 'taxPercent') {
      newItems[index] = { ...newItems[index], taxPercent: parseFloat(value) || 0 }
    } else {
      newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 }
    }
    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }


  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-400 to-indigo-600',
      'from-emerald-400 to-teal-600',
      'from-purple-400 to-pink-600',
      'from-amber-400 to-orange-600',
    ]
    const index = name?.charCodeAt(0) % colors.length || 0
    return colors[index]
  }

  const handleSave = async () => {
    setFormError(null)
    
    if (!formData.clientId) {
      setFormError('Please select a client')
      return
    }
    if (formData.items.length === 0) {
      setFormError('Please add at least one item')
      return
    }
    if (!formData.currency) {
      setFormError('Please select a currency')
      return
    }

    // Validate all items have prices
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
      if (!item.price || item.price <= 0) {
        setFormError(`Item ${i + 1} (${item.name}): Price is required and must be > 0`)
        return
      }
    }

    // Validate exchange rate if currency is not base currency
    if (formData.currency !== baseCurrency) {
      if (!formData.exchangeRate || formData.exchangeRate <= 0) {
        setFormError('Exchange rate is required when currency differs from base currency')
        return
      }
    }
    
    setSubmitting(true)
    try {
      const data = {
        clientId: parseInt(formData.clientId),
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        dueDateDays: parseInt(formData.dueDateDays),
        autoBill: formData.autoBill,
        items: formData.items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          discountPercent: parseFloat(item.discountPercent || 0),
          taxPercent: parseFloat(item.taxPercent || 0),
        })),
        notes: formData.notes,
        terms: formData.terms,
        currency: formData.currency,
        exchangeRate: formData.currency !== baseCurrency ? formData.exchangeRate : null,
      }
      
      if (id) {
        await updateRecurringInvoice(parseInt(id), data)
      } else {
        await createRecurringInvoice(data)
      }
      navigate('/recurring-invoices')
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save recurring invoice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-24 lg:pb-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/recurring-invoices" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave} 
              disabled={submitting || loading.invoice}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/recurring-invoices" className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {id ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}
          </h2>
          <button onClick={handleSave} className="flex items-center justify-end px-2">
            <p className="text-primary text-base font-bold leading-normal tracking-wide shrink-0">Save</p>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:px-8 lg:py-8">
          {formError && (
            <div className="max-w-[1600px] mx-auto mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
            </div>
          )}
          {id && loading.invoice && !recurringInvoice && (
            <div className="max-w-[1600px] mx-auto flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
                <p className="text-slate-500 dark:text-slate-400">Loading recurring invoice data...</p>
              </div>
            </div>
          )}
          {(!id || recurringInvoice) && (
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recurring Invoice Details */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 hidden lg:block">Recurring Invoice Details</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        required
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Every 3 Months</option>
                        <option value="annually">Annually</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date (Payment Terms)</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        value={formData.dueDateDays}
                        onChange={(e) => setFormData({ ...formData, dueDateDays: parseInt(e.target.value) })}
                        required
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Day {day}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</span>
                      <input
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</span>
                      <input
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 lg:col-span-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Bill</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        value={formData.autoBill}
                        onChange={(e) => setFormData({ ...formData, autoBill: e.target.value })}
                        required
                      >
                        <option value="disabled">Disabled</option>
                        <option value="enabled">Enabled</option>
                        <option value="opt_in">Opt-In</option>
                      </select>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.autoBill === 'disabled' && 'Auto invoice will not be created'}
                        {formData.autoBill === 'enabled' && 'Auto invoice will be created and sent'}
                        {formData.autoBill === 'opt_in' && 'Auto invoice will be created as draft for review'}
                      </span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        value={formData.currency || companySettings?.currency || 'MVR'}
                        onChange={(e) => {
                          const newCurrency = e.target.value
                          setFormData({ 
                            ...formData, 
                            currency: newCurrency,
                            exchangeRate: newCurrency !== baseCurrency ? formData.exchangeRate : null
                          })
                        }}
                        required
                      >
                        {getSupportedCurrencies().map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} - {curr.symbol} {curr.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Default: {companySettings?.currency || 'MVR'}
                      </span>
                    </label>
                    {showExchangeRate && (
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Exchange Rate (1 {formData.currency} = ? {baseCurrency})
                        </span>
                        <input
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={formData.exchangeRate || ''}
                          onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || null })}
                          placeholder="0.0000"
                          required
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Client Selection */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">Client Details</h3>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Client</span>
                    <select
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Line Items - Same as InvoiceForm */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">Line Items</h3>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{formData.items.length} Items</span>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">inventory_2</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-2">No items added yet</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click the button below to add items from your catalog</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Item</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-20">Qty</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-28">Price</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-24">Disc %</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-24">Tax %</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-28">Total</th>
                              <th className="w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {formData.items.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                                      style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                                    >
                                      {item.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{item.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{item.description}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <input 
                                      type="number" 
                                      value={item.quantity} 
                                      onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                      className="w-16 text-center rounded border-slate-200 dark:border-slate-600 bg-transparent text-sm py-1" 
                                    />
                                    <span className="text-xs text-slate-400">{item.uomCode || 'PC'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input 
                                    type="number" 
                                    value={item.price} 
                                    onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                                    className="w-24 text-right rounded border-slate-200 dark:border-slate-600 bg-transparent text-sm py-1" 
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input 
                                    type="number" 
                                    value={item.discountPercent || item.discount || 0} 
                                    onChange={(e) => handleUpdateItem(index, 'discountPercent', e.target.value)}
                                    className="w-16 text-right rounded border-slate-200 dark:border-slate-600 bg-transparent text-sm py-1" 
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input 
                                    type="number" 
                                    value={item.taxPercent || item.tax || 0} 
                                    onChange={(e) => handleUpdateItem(index, 'taxPercent', e.target.value)}
                                    className="w-16 text-right rounded border-slate-200 dark:border-slate-600 bg-transparent text-sm py-1" 
                                  />
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                                  {currencySymbol}{((item.quantity * (parseFloat(item.price) || 0) * (1 - (item.discountPercent || item.discount || 0) / 100)) * (1 + (item.taxPercent || item.tax || 0) / 100)).toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                  <button 
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {formData.items.map((item, index) => (
                          <div key={index} className="relative bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                                  style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                                >
                                  {item.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                                </div>
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{currencySymbol}{(item.quantity * (parseFloat(item.price) || 0) * (1 - (item.discountPercent || item.discount || 0) / 100) * (1 + (item.taxPercent || item.tax || 0) / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 font-medium">Qty: {item.quantity} <span className="text-gray-400">{item.uomCode || 'PC'}</span></span>
                                <span>x {currencySymbol}{(parseFloat(item.price) || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleRemoveItem(index)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button 
                    onClick={() => setShowItemSelector(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 dark:bg-primary/10 py-3.5 text-primary hover:bg-primary/10 hover:border-primary transition-all mt-4"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    <span className="text-sm font-semibold">Add Line Item</span>
                  </button>
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                    <textarea
                      className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm p-3 resize-none"
                      placeholder="Add any notes for the client..."
                      rows="4"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms & Conditions</label>
                    <textarea
                      className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm p-3 resize-none"
                      placeholder="Payment terms, delivery details..."
                      rows="4"
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-28 space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white">{currencySymbol}{subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Discount</span>
                          <span className="font-medium text-green-600 dark:text-green-400">-{currencySymbol}{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Tax</span>
                        <span className="font-medium text-gray-900 dark:text-white">{currencySymbol}{tax.toFixed(2)}</span>
                      </div>
                      <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-3"></div>
                      <div className="flex justify-between items-end">
                        <span className="text-base font-bold text-gray-900 dark:text-white">Grand Total</span>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-bold text-primary">{currencySymbol}{total.toFixed(2)}</span>
                          <span className="text-xs text-gray-400">{currencyCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden lg:block space-y-3">
                    <button 
                      onClick={handleSave} 
                      disabled={submitting || loading.invoice}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">save</span>
                          Save Recurring Invoice
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button 
              onClick={handleSave} 
              disabled={submitting || loading.invoice}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-transform hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Item Selector Modal */}
      {showItemSelector && (
        <ItemSelector
          onSelect={handleAddItem}
          onClose={() => setShowItemSelector(false)}
        />
      )}

    </div>
  )
}

