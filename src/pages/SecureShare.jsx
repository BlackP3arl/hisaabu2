import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import apiClient from '../api/client'
import { handleApiError } from '../utils/errorHandler'

export default function SecureShare() {
  const { type, id } = useParams()
  const [token, setToken] = useState(id) // The id param is actually the token
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState(null)
  const [company, setCompany] = useState(null)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await apiClient.get(`/public/share/${token}`)
        if (data.success) {
          const shareLink = data.data.shareLink
          const doc = data.data.document
          
          setDocument(doc)
          setCompany(data.data.company || {})
          
          // If password is required and not authenticated, show password form
          if (shareLink.hasPassword && !authenticated) {
            setLoading(false)
            return
          }
          
          // If no password required, authenticate automatically
          if (!shareLink.hasPassword) {
            setAuthenticated(true)
          }
        }
      } catch (err) {
        const errorMessage = handleApiError(err)
        setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }
    
    if (token) {
      loadDocument()
    }
  }, [token, authenticated])

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await apiClient.post(`/public/share/${token}/verify`, { password })
      if (data.success) {
        setAuthenticated(true)
        // Reload document after authentication
        const { data: docData } = await apiClient.get(`/public/share/${token}`)
        if (docData.success) {
          setDocument(docData.data.document)
          setCompany(docData.data.company || {})
        }
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Incorrect password')
    }
  }

  const handleAcknowledge = async () => {
    try {
      await apiClient.post(`/public/share/${token}/acknowledge`)
      alert('Document acknowledged successfully!')
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Failed to acknowledge')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const endpoint = document?.documentType === 'quotation' 
        ? `/quotations/${document.documentId}/pdf`
        : `/invoices/${document.documentId}/pdf`
      
      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${document?.documentType || 'document'}-${document?.number || token}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Failed to download PDF')
    }
  }

  const getStatusStyles = (status) => {
    const styles = {
      paid: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      accepted: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      expired: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      draft: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    }
    return styles[status] || styles.draft
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
          <p className="text-slate-500 dark:text-slate-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">error</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">{error}</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Company Branding */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{company?.companyName || 'Company'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Secure Document Portal</p>
          </div>

          {/* Password Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">lock</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Protected Document</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter the password to view this {document?.documentType === 'quotation' ? 'quotation' : 'invoice'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-800 dark:text-red-200 text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">key</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 pl-12 pr-4 transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
              >
                View Document
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-6">
              Powered by <span className="font-semibold">Hisaabu</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">description</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">Document not found</p>
        </div>
      </div>
    )
  }

  const docType = document.documentType || type
  const client = document.client || {}
  const items = document.items || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{company?.companyName || 'Company'}</h1>
        </div>

        {/* Document Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Document Header */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">
                  {docType === 'quotation' ? 'Quotation' : 'Invoice'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{document.number}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{client.name || document.clientName}</p>
              </div>
              <span className={`self-start px-4 py-1.5 rounded-full text-xs font-bold uppercase ${getStatusStyles(document.status)}`}>
                {document.status}
              </span>
            </div>
          </div>

          {/* Document Body */}
          <div className="p-6 sm:p-8">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">From</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{company?.companyName || 'Company'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{company?.address || ''}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">To</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{client.name || document.clientName}</p>
                {client.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Date</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {document.issueDate || document.date ? new Date(document.issueDate || document.date).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                  {docType === 'quotation' ? 'Valid Until' : 'Due Date'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {docType === 'quotation' 
                    ? (document.expiryDate || document.expiry ? new Date(document.expiryDate || document.expiry).toLocaleDateString() : '—')
                    : (document.dueDate || document.due ? new Date(document.dueDate || document.due).toLocaleDateString() : '—')
                  }
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300">{item.quantity || 1}</td>
                        <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300">${(item.price || 0).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right font-semibold text-slate-900 dark:text-white">
                          ${((item.quantity || 1) * (item.price || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                {document.subtotal !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                    <span className="text-slate-900 dark:text-white">${(document.subtotal || 0).toLocaleString()}</span>
                  </div>
                )}
                {document.discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Discount</span>
                    <span className="text-slate-900 dark:text-white">-${(document.discountTotal || 0).toLocaleString()}</span>
                  </div>
                )}
                {document.taxTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Tax</span>
                    <span className="text-slate-900 dark:text-white">${(document.taxTotal || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">${(document.totalAmount || document.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(document.notes || document.terms) && (
              <div className="mb-8 space-y-4">
                {document.notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Notes</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{document.notes}</p>
                  </div>
                )}
                {document.terms && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Terms & Conditions</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{document.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleDownloadPdf}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-3.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                Download PDF
              </button>
              <button 
                onClick={handleAcknowledge}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {docType === 'quotation' ? 'Accept Quotation' : 'Acknowledge Receipt'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-6">
          This document was shared securely via <span className="font-semibold">Hisaabu</span>
        </p>
      </div>
    </div>
  )
}
