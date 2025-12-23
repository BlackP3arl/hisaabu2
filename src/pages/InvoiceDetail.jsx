import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'
import PrintPreview from '../components/PrintPreview'
import ShareLinkModal from '../components/ShareLinkModal'
import apiClient from '../api/client'
import { handleApiError, getErrorMessage } from '../utils/errorHandler'
import { formatCurrency } from '../utils/currency'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getInvoice, companySettings, deleteInvoice, recordPayment, deletePayment, generateShareLink, loading } = useData()
  const [invoice, setInvoice] = useState(null)
  const [client, setClient] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [error, setError] = useState(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showShareLinkModal, setShowShareLinkModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  })
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoadingDetail(true)
        const invoiceData = await getInvoice(parseInt(id))
        if (invoiceData) {
          setInvoice(invoiceData)
          // Fetch client data if available
          if (invoiceData.clientId) {
            try {
              const { data } = await apiClient.get(`/clients/${invoiceData.clientId}`)
              if (data.success && data.data.client) {
                setClient(data.data.client)
              }
            } catch (err) {
              console.error('Failed to load client:', err)
            }
          }
        } else {
          setError('Invoice not found')
        }
      } catch (err) {
        setError(getErrorMessage(handleApiError(err)))
      } finally {
        setLoadingDetail(false)
      }
    }
    loadInvoice()
  }, [id, getInvoice])

  const handleDelete = async () => {
    try {
      await deleteInvoice(parseInt(id))
      navigate('/invoices')
    } catch (err) {
      setError(getErrorMessage(handleApiError(err)))
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await apiClient.get(`/invoices/${id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoice?.number || id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(getErrorMessage(handleApiError(err)))
    }
  }

  const handleGenerateShareLink = async (documentType, documentId, options = {}) => {
    try {
      const shareLink = await generateShareLink(documentType, documentId, options)
      return shareLink
    } catch (err) {
      throw new Error(getErrorMessage(handleApiError(err)))
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError('Please enter a valid payment amount')
      return
    }
    
    setSubmittingPayment(true)
    setError(null)
    try {
      await recordPayment(parseInt(id), {
        amount: parseFloat(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || null,
        notes: paymentForm.notes || null,
      })
      // Reload invoice to get updated payment status
      const invoiceData = await getInvoice(parseInt(id))
      if (invoiceData) {
        setInvoice(invoiceData)
      }
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        reference: '',
        notes: '',
      })
    } catch (err) {
      setError(getErrorMessage(handleApiError(err)))
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await deletePayment(parseInt(id), paymentId)
        // Reload invoice
        const invoiceData = await getInvoice(parseInt(id))
        if (invoiceData) {
          setInvoice(invoiceData)
        }
      } catch (err) {
        setError(getErrorMessage(handleApiError(err)))
      }
    }
  }

  const calculateTotals = () => {
    if (!invoice || !invoice.items) return { subtotal: 0, discount: 0, tax: 0, total: 0 }
    
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const discount = invoice.items.reduce((sum, item) => {
      const itemDiscount = item.discountPercent || item.discount || 0
      return sum + (item.quantity * item.price * itemDiscount / 100)
    }, 0)
    const afterDiscount = subtotal - discount
    const tax = invoice.items.reduce((sum, item) => {
      const itemDiscount = item.discountPercent || item.discount || 0
      const itemTax = item.taxPercent || item.tax || 0
      const itemTotal = item.quantity * item.price * (1 - itemDiscount / 100)
      return sum + (itemTotal * itemTax / 100)
    }, 0)
    const total = afterDiscount + tax
    return { subtotal, discount, tax, total }
  }

  // Get currency information
  const documentCurrency = invoice?.currency || companySettings?.currency || 'MVR'
  const baseCurrency = companySettings?.baseCurrency || 'USD'
  const showExchangeRate = invoice?.exchangeRate && documentCurrency !== baseCurrency

  const getStatusStyles = (status) => {
    const styles = {
      paid: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      draft: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      partial: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    }
    return styles[status] || styles.draft
  }

  if (loadingDetail || loading.invoice) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
            <p className="text-slate-500 dark:text-slate-400">Loading invoice...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link to="/invoices" className="text-primary hover:underline">Back to Invoices</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Invoice not found</p>
            <Link to="/invoices" className="text-primary hover:underline">Back to Invoices</Link>
          </div>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()
  const paidAmount = invoice.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
  // Use balance_due from database (source of truth) instead of recalculating
  // This ensures frontend matches backend validation
  // Handle both camelCase (balanceDue) and snake_case (balance_due) for compatibility
  const balanceDue = invoice.balanceDue !== undefined 
    ? parseFloat(invoice.balanceDue) 
    : (invoice.balance_due !== undefined 
      ? parseFloat(invoice.balance_due) 
      : (totals.total - paidAmount))
  const company = companySettings || { name: 'Company Name', address: '', email: '' }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-24 lg:pb-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/invoices" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{invoice.number}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{client?.name || invoice.clientName || 'Client'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {invoice.status !== 'paid' && (
              <Link
                to={`/invoices/${id}`}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit
              </Link>
            )}
            <button 
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download PDF
            </button>
            <button
              onClick={() => setShowShareLinkModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/invoices" className="text-gray-900 dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Details</h2>
          <button className="text-primary">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 lg:mx-8 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Invoice Preview */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {/* Company Header */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-primary text-2xl">business</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{company.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{company.address}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{company.email}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{invoice.number}</h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 border ${getStatusStyles(invoice.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="p-6 lg:p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Bill To</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{client?.name || invoice.clientName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Issue Date</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                          {new Date(invoice.issueDate || invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Due Date</p>
                        <p className={`text-sm font-semibold mt-1 ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                          {new Date(invoice.dueDate || invoice.due).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Amount Due</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-bold text-primary">{formatCurrency(balanceDue, documentCurrency)}</p>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            {documentCurrency}
                          </span>
                        </div>
                        {showExchangeRate && (
                          <p className="text-xs text-slate-400 mt-1">
                            1 {documentCurrency} = {invoice.exchangeRate} {baseCurrency}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Line Items Table */}
                    {invoice.items && invoice.items.length > 0 ? (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
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
                            {invoice.items.map((item, idx) => {
                              const itemDiscount = item.discountPercent || item.discount || 0
                              const itemTax = item.taxPercent || item.tax || 0
                              const itemSubtotal = item.quantity * item.price
                              const itemDiscountAmount = itemSubtotal * itemDiscount / 100
                              const itemAfterDiscount = itemSubtotal - itemDiscountAmount
                              const itemTaxAmount = itemAfterDiscount * itemTax / 100
                              const itemTotal = itemAfterDiscount + itemTaxAmount
                              
                              return (
                                <tr key={item.id || idx}>
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
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center mb-6">
                        <p className="text-slate-500 dark:text-slate-400">No items found</p>
                      </div>
                    )}

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                      <div className="w-full sm:w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                          <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(totals.subtotal, documentCurrency)}</span>
                        </div>
                        {totals.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Discount</span>
                            <span className="font-medium text-slate-900 dark:text-white">-{formatCurrency(totals.discount, documentCurrency)}</span>
                          </div>
                        )}
                        {totals.tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              {companySettings?.defaultTax?.name 
                                ? `Tax (${companySettings.defaultTax.name} ${companySettings.defaultTax.rate}%)`
                                : 'Tax'}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(totals.tax, documentCurrency)}</span>
                          </div>
                        )}
                        {showExchangeRate && (
                          <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-400">Exchange Rate</span>
                            <span className="text-slate-500">1 {documentCurrency} = {invoice.exchangeRate} {baseCurrency}</span>
                          </div>
                        )}
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Total</span>
                          <span className="text-xl font-bold text-primary">{formatCurrency(totals.total, documentCurrency)}</span>
                        </div>
                        {paidAmount > 0 && (
                          <>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Paid</span>
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmount, documentCurrency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">Balance Due</span>
                              <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(balanceDue, documentCurrency)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payments History */}
                {invoice.payments && invoice.payments.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 lg:p-8">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment History</h3>
                      <div className="space-y-3">
                        {invoice.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">${parseFloat(payment.amount).toFixed(2)}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(payment.paymentDate).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                  {payment.paymentMethod}
                                </span>
                                {payment.reference && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Ref: {payment.reference}
                                  </span>
                                )}
                              </div>
                              {payment.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{payment.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusStyles(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total Amount</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(totals.total, documentCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Amount Paid</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmount, documentCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Balance Due</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(balanceDue, documentCurrency)}</span>
                    </div>
                    {(invoice.status === 'partial' || paidAmount > 0) && (
                      <div className="pt-2">
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${Math.min((paidAmount / totals.total) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                          {Math.round((paidAmount / totals.total) * 100)}% paid
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
                      onClick={() => {
                        setPaymentForm({ ...paymentForm, amount: balanceDue > 0 ? balanceDue.toFixed(2) : '' })
                        setShowPaymentModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-emerald-600">payments</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Record Payment</span>
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
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:block space-y-3">
                  {invoice.status !== 'paid' && (
                    <Link
                      to={`/invoices/${id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                      Edit Invoice
                    </Link>
                  )}
                  <button 
                    onClick={handleDownloadPdf}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-3.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            {invoice.status !== 'paid' && (
              <Link
                to={`/invoices/${id}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit
              </Link>
            )}
            <button 
              onClick={handleDownloadPdf}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              PDF
            </button>
            <button 
              onClick={() => setShowShareLinkModal(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <PrintPreview
          type="invoice"
          data={invoice}
          client={client}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Invoice</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceDue}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Balance due: ${balanceDue.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                  placeholder="Transaction ID, Check #, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary px-3 py-2"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentForm({
                    amount: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    paymentMethod: 'cash',
                    reference: '',
                    notes: '',
                  })
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                disabled={submittingPayment}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={submittingPayment || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPayment ? 'Recording...' : 'Record Payment'}
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
        documentType="invoice"
        documentId={parseInt(id)}
        loading={loading.shareLink}
      />
    </div>
  )
}
