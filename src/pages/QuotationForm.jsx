import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'
import ItemSelector from '../components/ItemSelector'
import ClientSelector from '../components/ClientSelector'
import PrintPreview from '../components/PrintPreview'
import { getCurrencySymbol, getSupportedCurrencies } from '../utils/currency'

export default function QuotationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getQuotation, createQuotation, updateQuotation, fetchCategories, categories, fetchClients, clients, companySettings, fetchCompanySettings, loading } = useData()
  const [quotation, setQuotation] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [showItemSelector, setShowItemSelector] = useState(false)
  const [showClientSelector, setShowClientSelector] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    notes: '',
    terms: '',
    status: 'draft',
    currency: '',
    exchangeRate: null,
  })

  // Load categories, clients, and settings on mount
  useEffect(() => {
    fetchCategories()
    fetchClients()
    // Fetch settings if not already loaded
    if (!companySettings) {
      fetchCompanySettings()
    }
  }, [fetchCategories, fetchClients, fetchCompanySettings, companySettings])

  // Set default currency from company settings
  useEffect(() => {
    if (companySettings && !formData.currency && !id) {
      setFormData(prev => ({
        ...prev,
        currency: companySettings.currency || 'MVR',
      }))
    }
  }, [companySettings, id])

  // Load quotation data if editing
  useEffect(() => {
    if (id) {
      const loadQuotation = async () => {
        try {
          const quotationData = await getQuotation(parseInt(id))
          if (quotationData) {
            setQuotation(quotationData)
            setFormData({
              clientId: quotationData.clientId || '',
              issueDate: quotationData.issueDate || quotationData.date || new Date().toISOString().split('T')[0],
              expiryDate: quotationData.expiryDate || quotationData.expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              items: quotationData.items?.map(item => ({
                itemId: item.itemId,
                name: item.name,
                description: item.description || '',
                quantity: parseFloat(item.quantity) || 1,
                price: parseFloat(item.price) || 0,
                discountPercent: parseFloat(item.discountPercent || item.discount || 0),
                taxPercent: parseFloat(item.taxPercent || item.tax || 0),
                categoryId: item.categoryId,
              })) || [],
              notes: quotationData.notes || '',
              terms: quotationData.terms || '',
              status: quotationData.status || 'draft',
              currency: quotationData.currency || companySettings?.currency || 'MVR',
              exchangeRate: quotationData.exchangeRate || null,
            })
          }
        } catch (err) {
          setFormError('Failed to load quotation data')
        }
      }
      loadQuotation()
    }
  }, [id, getQuotation])

  const client = clients.find(c => c.id === formData.clientId)
  const number = quotation?.number || ''

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  const baseCurrency = companySettings?.baseCurrency || 'USD'
  const currencySymbol = getCurrencySymbol(formData.currency || companySettings?.currency || 'MVR')
  const currencyCode = formData.currency || companySettings?.currency || 'MVR'
  const showExchangeRate = formData.currency && formData.currency !== baseCurrency

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 1
      const price = parseFloat(item.price) || 0
      return sum + (qty * price)
    }, 0)
    const discount = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 1
      const price = parseFloat(item.price) || 0
      const itemDiscount = parseFloat(item.discountPercent || item.discount || 0)
      return sum + (qty * price * itemDiscount / 100)
    }, 0)
    const afterDiscount = subtotal - discount
    const tax = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 1
      const price = parseFloat(item.price) || 0
      const itemDiscount = parseFloat(item.discountPercent || item.discount || 0)
      const itemTax = parseFloat(item.taxPercent || item.tax || 0)
      const itemTotal = qty * price * (1 - itemDiscount / 100)
      return sum + (itemTotal * itemTax / 100)
    }, 0)
    const total = afterDiscount + tax
    return { subtotal, discount, tax, total }
  }

  const { subtotal, discount, tax, total } = calculateTotals()

  const handleAddItem = (item) => {
    // Items no longer have default prices - price must be entered manually in document currency
    const newItem = {
      itemId: item.id,
      name: item.name,
      description: item.description || '',
      quantity: 1,
      price: 0, // Price must be entered manually - no default from item
      discountPercent: 0,
      taxPercent: item.taxPercent !== undefined ? item.taxPercent : (item.tax !== undefined ? item.tax : 0),
      categoryId: item.categoryId,
    }
    setFormData({ ...formData, items: [...formData.items, newItem] })
  }

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...formData.items]
    if (field === 'discount' || field === 'discountPercent') {
      newItems[index] = { ...newItems[index], discountPercent: parseFloat(value) || 0 }
    } else if (field === 'tax' || field === 'taxPercent') {
      newItems[index] = { ...newItems[index], taxPercent: parseFloat(value) || 0 }
    } else if (field === 'price') {
      newItems[index] = { ...newItems[index], price: parseFloat(value) || 0 }
    } else if (field === 'quantity') {
      newItems[index] = { ...newItems[index], quantity: parseFloat(value) || 1 }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setFormData({ ...formData, items: newItems })
  }

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }

  const handleSelectClient = (client) => {
    setFormData({ ...formData, clientId: client.id })
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
    const data = {
      clientId: parseInt(formData.clientId),
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
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
      status: formData.status,
      currency: formData.currency,
      exchangeRate: formData.currency !== baseCurrency ? formData.exchangeRate : null,
    }

    try {
      if (id) {
        await updateQuotation(parseInt(id), data)
      } else {
        await createQuotation(data)
      }
      navigate('/quotations')
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save quotation')
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
            <Link to="/quotations" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Quotation' : 'New Quotation'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPrintPreview(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">visibility</span>
              Preview
            </button>
            <button 
              onClick={() => setShowPrintPreview(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              PDF
            </button>
            <button 
              onClick={handleSave} 
              disabled={submitting}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  Send Quotation
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/quotations" className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">{id ? 'Edit Quotation' : 'New Quotation'}</h2>
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
          {id && loading.quotation && !quotation && !formError && (
            <div className="max-w-[1600px] mx-auto flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
                <p className="text-slate-500 dark:text-slate-400">Loading quotation data...</p>
              </div>
            </div>
          )}
          {(!id || quotation) && (
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column - Main Form */}
              <div className="lg:col-span-8 space-y-6">
                {/* Document Info */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 hidden lg:block">Document Details</h3>
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quotation No.</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">{number}</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wide">
                      Draft
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</span>
                      <input
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</span>
                      <input
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency</span>
                      <select
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                        value={formData.currency}
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
                        <option value="">Select Currency</option>
                        {getSupportedCurrencies().map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} - {curr.symbol} {curr.name}
                          </option>
                        ))}
                      </select>
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
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Enter the exchange rate used for this document
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Client Selection */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">Client Details</h3>
                  <button 
                    onClick={() => setShowClientSelector(true)}
                    className="w-full flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-3 rounded-lg -mx-3 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 lg:size-12 rounded-full bg-gradient-to-br ${client ? getAvatarColor(client.name) : 'from-slate-300 to-slate-400'} flex items-center justify-center text-white font-bold text-lg`}>
                        {client?.name?.charAt(0) || <span className="material-symbols-outlined">person_add</span>}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">{client?.name || 'Select Client'}</span>
                        <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{client?.email || 'Click to select a client'}</span>
                        {client?.phone && (
                          <span className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">phone</span>
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">chevron_right</span>
                  </button>
                </div>

                {/* Line Items */}
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
                              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-16">Action</th>
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
                                  <input 
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                    className="w-16 text-center rounded border-slate-200 dark:border-slate-600 bg-transparent text-sm py-1" 
                                  />
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
                                  {currencySymbol}{((parseFloat(item.quantity) || 1) * (parseFloat(item.price) || 0) * (1 - (parseFloat(item.discountPercent || item.discount || 0)) / 100) * (1 + (parseFloat(item.taxPercent || item.tax || 0)) / 100)).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={() => handleRemoveItem(index)}
                                    title="Remove item"
                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
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
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{currencySymbol}{(item.quantity * item.price * (1 - (item.discountPercent || item.discount || 0) / 100) * (1 + (item.taxPercent || item.tax || 0) / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 font-medium">Qty: {item.quantity}</span>
                                <span>x {currencySymbol}{(parseFloat(item.price) || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleRemoveItem(index)}
                                  title="Remove item"
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
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
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28 space-y-6 lg:max-w-sm lg:mr-8">
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
                      onClick={() => {
                        setFormData({ ...formData, status: 'sent' })
                        handleSave()
                      }}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">send</span>
                          Send Quotation
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setFormData({ ...formData, status: 'draft' })
                        handleSave()
                      }}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-3.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">save</span>
                          Save as Draft
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
              onClick={() => setShowPrintPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">visibility</span>
              Preview
            </button>
            <button 
              onClick={() => {
                setFormData({ ...formData, status: 'sent' })
                handleSave()
              }}
              disabled={submitting}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-transform hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  Send Quotation
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

      {/* Client Selector Modal */}
      {showClientSelector && (
        <ClientSelector
          onSelect={handleSelectClient}
          onClose={() => setShowClientSelector(false)}
          selectedClientId={formData.clientId}
        />
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <PrintPreview
          type="quotation"
          data={{
            ...formData,
            id: id ? parseInt(id) : null,
            number: quotation?.number || number,
            status: formData.status,
            amount: total,
            date: formData.issueDate,
            expiry: formData.expiryDate,
            currency: formData.currency,
            exchangeRate: formData.exchangeRate,
          }}
          client={client}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  )
}
