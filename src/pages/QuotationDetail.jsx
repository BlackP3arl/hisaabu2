import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'
import PrintPreview from '../components/PrintPreview'
import ShareLinkModal from '../components/ShareLinkModal'
import apiClient from '../api/client'
import { handleApiError, getErrorMessage } from '../utils/errorHandler'
import { getCurrencySymbol, formatCurrency } from '../utils/currency'

export default function QuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getQuotation, companySettings, convertQuotationToInvoice, deleteQuotation, generateShareLink, loading } = useData()
  const [quotation, setQuotation] = useState(null)
  const [client, setClient] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [error, setError] = useState(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showShareLinkModal, setShowShareLinkModal] = useState(false)

  useEffect(() => {
    const loadQuotation = async () => {
      try {
        setLoadingDetail(true)
        const quotationData = await getQuotation(parseInt(id))
        if (quotationData) {
          setQuotation(quotationData)
          // Fetch client data if available
          if (quotationData.clientId) {
            try {
              const { data } = await apiClient.get(`/clients/${quotationData.clientId}`)
              if (data.success && data.data.client) {
                setClient(data.data.client)
              }
            } catch (err) {
              console.error('Failed to load client:', err)
            }
          }
        } else {
          setError('Quotation not found')
        }
      } catch (err) {
        const errorMessage = handleApiError(err)
        setError(getErrorMessage(errorMessage))
      } finally {
        setLoadingDetail(false)
      }
    }
    loadQuotation()
  }, [id, getQuotation])

  const handleConvertToInvoice = async () => {
    if (window.confirm('Are you sure you want to convert this quotation to an invoice?')) {
      try {
        const newInvoice = await convertQuotationToInvoice(parseInt(id))
        navigate(`/invoices/${newInvoice.id}/view`)
      } catch (err) {
        const errorMessage = handleApiError(err)
        setError(getErrorMessage(errorMessage))
      }
    }
  }

  const handleDelete = async () => {
    try {
      await deleteQuotation(parseInt(id))
      navigate('/quotations')
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(getErrorMessage(errorMessage))
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await apiClient.get(`/quotations/${id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `quotation-${quotation?.number || id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(getErrorMessage(errorMessage))
    }
  }

  const handleGenerateShareLink = async (documentType, documentId, options = {}) => {
    try {
      const shareLink = await generateShareLink(documentType, documentId, options)
      return shareLink
    } catch (err) {
      const errorMessage = handleApiError(err)
      throw new Error(getErrorMessage(errorMessage))
    }
  }

  if (loadingDetail || loading.quotation) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
            <p className="text-slate-500 dark:text-slate-400">Loading quotation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quotation) {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'An error occurred')
    const errorTitle = !quotation && !error 
      ? 'Quotation not found' 
      : error 
        ? 'Error' 
        : 'Quotation not found'
    
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
            <p className="text-slate-900 dark:text-white text-lg mb-2">{errorTitle}</p>
            <p className="text-slate-500 dark:text-slate-400">{errorMessage}</p>
            <Link to="/quotations" className="mt-4 inline-block text-primary hover:underline">
              Back to Quotations
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusStyles = (status) => {
    const styles = {
      accepted: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      expired: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      draft: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    }
    return styles[status] || styles.draft
  }

  const issueDate = quotation.issueDate || quotation.date
  const expiryDate = quotation.expiryDate || quotation.expiry
  const isExpired = expiryDate && new Date(expiryDate) < new Date()
  
  // Get currency information
  const documentCurrency = quotation.currency || companySettings?.currency || 'MVR'
  const baseCurrency = companySettings?.baseCurrency || 'USD'
  const showExchangeRate = quotation.exchangeRate && documentCurrency !== baseCurrency
  
  // Calculate totals from line items
  const calculateTotals = () => {
    if (!quotation.items || quotation.items.length === 0) {
      return {
        subtotal: quotation.subtotal || quotation.amount || 0,
        discount: quotation.discountTotal || 0,
        tax: quotation.taxTotal || 0,
        total: quotation.totalAmount || quotation.amount || 0
      }
    }
    const subtotal = quotation.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price)
    }, 0)
    const discount = quotation.items.reduce((sum, item) => {
      const discountPercent = item.discountPercent || item.discount || 0
      return sum + (item.quantity * item.price * discountPercent / 100)
    }, 0)
    const afterDiscount = subtotal - discount
    const tax = quotation.items.reduce((sum, item) => {
      const discountPercent = item.discountPercent || item.discount || 0
      const taxPercent = item.taxPercent || item.tax || 0
      const itemTotal = item.quantity * item.price * (1 - discountPercent / 100)
      return sum + (itemTotal * taxPercent / 100)
    }, 0)
    const total = afterDiscount + tax
    return { subtotal, discount, tax, total }
  }
  
  const { subtotal, discount, tax, total } = calculateTotals()

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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{quotation.number}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{client?.name || quotation.clientName || 'Unknown Client'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/quotations/${id}`}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <button 
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download PDF
            </button>
            <button
              onClick={() => setShowShareLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share Link
            </button>
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Convert to Invoice
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/quotations" className="text-gray-900 dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quotation Details</h2>
          <button className="text-primary">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 pt-4 pb-4 px-4 lg:pt-8 lg:pb-8 lg:pl-8 lg:pr-0">
          <div className="w-full lg:mr-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quotation Preview */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {/* Company Header */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-primary text-2xl">business</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{companySettings?.companyName || 'Company Name'}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{companySettings?.address || ''}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{companySettings?.email || ''}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{quotation.number}</h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 border ${getStatusStyles(quotation.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {quotation.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quotation Details */}
                  <div className="p-6 lg:p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Quote For</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{quotation.clientName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Issue Date</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{issueDate ? new Date(issueDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Valid Until</p>
                        <p className={`text-sm font-semibold mt-1 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                          {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}
                          {isExpired && <span className="ml-2 text-xs">(Expired)</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Total Amount</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-bold text-primary">{formatCurrency(total, documentCurrency)}</p>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            {documentCurrency}
                          </span>
                        </div>
                        {showExchangeRate && (
                          <p className="text-xs text-slate-400 mt-1">
                            1 {documentCurrency} = {quotation.exchangeRate} {baseCurrency}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Qty</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Price</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {quotation.items && quotation.items.length > 0 ? (
                            quotation.items.map((item, index) => {
                              const itemDiscount = item.discountPercent || item.discount || 0
                              const itemTax = item.taxPercent || item.tax || 0
                              const itemSubtotal = item.quantity * item.price
                              const itemDiscountAmount = itemSubtotal * itemDiscount / 100
                              const itemAfterDiscount = itemSubtotal - itemDiscountAmount
                              const itemTaxAmount = itemAfterDiscount * itemTax / 100
                              const itemTotal = itemAfterDiscount + itemTaxAmount
                              return (
                                <tr key={index}>
                                  <td className="px-4 py-4">
                                    <p className="font-medium text-slate-900 dark:text-white text-sm">{item.name || 'Item'}</p>
                                    {item.description && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-center text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span>{item.quantity}</span>
                                      <span className="text-xs text-slate-400">{item.uomCode || 'PC'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{formatCurrency(item.price, documentCurrency)}</td>
                                  <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(itemTotal, documentCurrency)}</td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                No items found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                      <div className="w-full sm:w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                          <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal, documentCurrency)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Discount</span>
                            <span className="font-medium text-slate-900 dark:text-white">-{formatCurrency(discount, documentCurrency)}</span>
                          </div>
                        )}
                        {tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              {companySettings?.defaultTax?.name 
                                ? `Tax (${companySettings.defaultTax.name} ${companySettings.defaultTax.rate}%)`
                                : 'Tax'}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(tax, documentCurrency)}</span>
                          </div>
                        )}
                        {showExchangeRate && (
                          <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-400">Exchange Rate</span>
                            <span className="text-slate-500">1 {documentCurrency} = {quotation.exchangeRate} {baseCurrency}</span>
                          </div>
                        )}
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Total</span>
                          <span className="text-xl font-bold text-primary">{formatCurrency(total, documentCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quote Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusStyles(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Created</span>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">{issueDate ? new Date(issueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Valid Until</span>
                      <span className={`font-medium text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {isExpired && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">warning</span>
                          This quotation has expired
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleConvertToInvoice}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-primary">receipt_long</span>
                      <span className="text-sm font-medium text-primary">Convert to Invoice</span>
                    </button>
                    <button 
                      onClick={handleDownloadPdf}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-blue-600">download</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Download PDF</span>
                    </button>
                    <button 
                      onClick={() => setShowShareLinkModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-slate-500">share</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Share Link</span>
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-red-500">delete</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Quote</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:block space-y-3">
                  <button
                    onClick={handleConvertToInvoice}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    Convert to Invoice
                  </button>
                  <Link
                    to={`/quotations/${id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-3.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Edit Quotation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link
              to={`/quotations/${id}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <button 
              onClick={() => setShowPrintPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              PDF
            </button>
            <button
              onClick={handleConvertToInvoice}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Convert
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <PrintPreview
          type="quotation"
          data={{
            ...quotation,
            date: issueDate,
            expiry: expiryDate,
            amount: total,
          }}
          client={client}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Quotation</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  handleDelete()
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={showShareLinkModal}
        onClose={() => setShowShareLinkModal(false)}
        onGenerate={handleGenerateShareLink}
        documentType="quotation"
        documentId={parseInt(id)}
        loading={loading.shareLink}
      />
    </div>
  )
}
