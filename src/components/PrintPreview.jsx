import { useRef, useState } from 'react'
import { useData } from '../context/DataContext'
import { handleApiError } from '../utils/errorHandler'
import apiClient from '../api/client'

export default function PrintPreview({ 
  type = 'invoice', // 'invoice' or 'quotation'
  data,
  client,
  onClose 
}) {
  const { companySettings, loading, generateShareLink } = useData()
  const printRef = useRef(null)
  const [showShareLink, setShowShareLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [error, setError] = useState(null)

  const isQuotation = type === 'quotation'
  const documentTitle = isQuotation ? 'QUOTATION' : 'INVOICE'
  const documentNumber = data.number || (isQuotation ? '#Q-2024-001' : 'INV-0001')

  // Calculate totals from items
  const calculateTotals = () => {
    if (!data.items || data.items.length === 0) {
      return { subtotal: data.amount || 0, discount: 0, tax: 0, total: data.amount || 0 }
    }
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const discount = data.items.reduce((sum, item) => {
      const discountPercent = item.discountPercent || item.discount || 0
      return sum + (item.quantity * item.price * discountPercent / 100)
    }, 0)
    const afterDiscount = subtotal - discount
    const tax = data.items.reduce((sum, item) => {
      const discountPercent = item.discountPercent || item.discount || 0
      const taxPercent = item.taxPercent || item.tax || 0
      const itemTotal = item.quantity * item.price * (1 - discountPercent / 100)
      return sum + (itemTotal * taxPercent / 100)
    }, 0)
    const total = afterDiscount + tax
    return { subtotal, discount, tax, total }
  }

  const { subtotal, discount, tax, total } = calculateTotals()

  const getStatusStyles = (status) => {
    const styles = {
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      overdue: 'bg-red-100 text-red-700 border-red-300',
      draft: 'bg-slate-100 text-slate-600 border-slate-300',
      partial: 'bg-amber-100 text-amber-700 border-amber-300',
      sent: 'bg-blue-100 text-blue-700 border-blue-300',
      accepted: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      expired: 'bg-red-100 text-red-700 border-red-300',
    }
    return styles[data.status] || styles.draft
  }

  // Generate secure share link via API
  const handleGenerateShareLink = async () => {
    if (shareLink) {
      setShowShareLink(true)
      return
    }
    setGeneratingLink(true)
    setError(null)
    try {
      const link = await generateShareLink(
        type === 'quotation' ? 'quotation' : 'invoice',
        data.id,
        null // No password for now, can be added later
      )
      const baseUrl = window.location.origin
      setShareLink(`${baseUrl}/share/${type}/${link.token}`)
      setShowShareLink(true)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareLink
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy link:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle} - ${documentNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #1e293b;
              background: white;
              padding: 40px;
            }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-info h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            .company-info p { color: #64748b; font-size: 14px; margin: 2px 0; }
            .document-info { text-align: right; }
            .document-info h2 { font-size: 32px; font-weight: 700; color: #3b82f6; margin-bottom: 8px; }
            .document-number { font-size: 18px; font-weight: 600; color: #334155; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 8px; }
            .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; padding: 24px; background: #f8fafc; border-radius: 8px; }
            .detail-item label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; }
            .detail-item p { font-size: 14px; font-weight: 600; color: #1e293b; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .items-table th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .items-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .items-table .text-right { text-align: right; }
            .items-table .text-center { text-align: center; }
            .totals { margin-left: auto; width: 280px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals-row.total { border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 8px; }
            .totals-row.total span:last-child { font-size: 20px; font-weight: 700; color: #3b82f6; }
            .notes { margin-top: 40px; padding: 24px; background: #f8fafc; border-radius: 8px; }
            .notes h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
            .notes p { font-size: 13px; color: #64748b; }
            .footer { margin-top: 60px; text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; }
            .footer p { font-size: 12px; color: #94a3b8; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">print</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Print Preview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{documentTitle} {documentNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGenerateShareLink}
              disabled={generatingLink}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {generatingLink ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Share Link
                </>
              )}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print
            </button>
            <button 
              onClick={async () => {
                try {
                  const endpoint = `/${type === 'quotation' ? 'quotations' : 'invoices'}/${data.id}/pdf`
                  const response = await apiClient.get(endpoint, {
                    responseType: 'blob'
                  })
                  const url = window.URL.createObjectURL(new Blob([response.data]))
                  const link = document.createElement('a')
                  link.href = url
                  link.setAttribute('download', `${type}-${data.number || data.id}.pdf`)
                  document.body.appendChild(link)
                  link.click()
                  link.remove()
                  window.URL.revokeObjectURL(url)
                } catch (err) {
                  const errorMessage = handleApiError(err)
                  alert(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Failed to download PDF')
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-2"
            >
              <span className="material-symbols-outlined text-slate-500">close</span>
            </button>
          </div>
        </div>

        {/* Share Link Section */}
        {showShareLink && (
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            {error && (
              <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">link</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Secure Share Link</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Share this link with your client. They'll need a password to view the document.
                </p>
                {shareLink ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">link</span>
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white min-w-0 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors shrink-0 ${
                        linkCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-primary text-white hover:bg-blue-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {linkCopied ? 'check_circle' : 'content_copy'}
                      </span>
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generating link...</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>Password Protected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">security</span>
                    <span>Secure Access</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowShareLink(false)}
                className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900">
          <div 
            ref={printRef}
            className="bg-white rounded-lg shadow-lg p-8 lg:p-12 max-w-[800px] mx-auto"
            style={{ minHeight: '1000px' }}
          >
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b-2 border-slate-100">
              <div className="flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-white text-3xl">business</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{companySettings?.companyName || 'Company Name'}</h1>
                <p className="text-slate-500 text-sm mt-1">{companySettings?.address || ''}</p>
                <p className="text-slate-500 text-sm">{companySettings?.email || ''}</p>
                <p className="text-slate-500 text-sm">{companySettings?.phone || ''}</p>
                {companySettings?.gst && (
                  <p className="text-slate-400 text-xs mt-2">GST: {companySettings.gst}</p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <h2 className="text-4xl font-bold text-primary tracking-tight">{documentTitle}</h2>
                <p className="text-xl font-semibold text-slate-700 mt-1">{documentNumber}</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase mt-3 border ${getStatusStyles(data.status)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {data.status || 'draft'}
                </span>
              </div>
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 mb-10 p-5 bg-slate-50 rounded-xl">
              <div>
                <label className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  {isQuotation ? 'Quote For' : 'Bill To'}
                </label>
                <p className="text-sm font-semibold text-slate-900">{client?.name || data.clientName || 'N/A'}</p>
                {client?.email && <p className="text-xs text-slate-500 mt-0.5">{client.email}</p>}
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Issue Date</label>
                <p className="text-sm font-semibold text-slate-900">
                  {data.date ? new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  {isQuotation ? 'Valid Until' : 'Due Date'}
                </label>
                <p className="text-sm font-semibold text-slate-900">
                  {(isQuotation ? data.expiry : data.due) 
                    ? new Date(isQuotation ? data.expiry : data.due).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  {isQuotation ? 'Total Amount' : 'Amount Due'}
                </label>
                <p className="text-sm font-bold text-primary">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide rounded-tl-lg">Description</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide w-16">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide w-24">Rate</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide w-20">Tax</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide w-28 rounded-tr-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items && data.items.length > 0 ? (
                    data.items.map((item, index) => {
                      const discountPercent = item.discountPercent || item.discount || 0
                      const taxPercent = item.taxPercent || item.tax || 0
                      const itemSubtotal = item.quantity * item.price
                      const itemDiscountAmount = itemSubtotal * discountPercent / 100
                      const itemAfterDiscount = itemSubtotal - itemDiscountAmount
                      const itemTaxAmount = itemAfterDiscount * taxPercent / 100
                      const lineTotal = itemAfterDiscount + itemTaxAmount
                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                          <td className="px-4 py-4 text-right text-sm text-slate-600">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right text-sm text-slate-600">{taxPercent.toFixed(2)}%</td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">${lineTotal.toFixed(2)}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900 text-sm">Professional Services</p>
                        <p className="text-xs text-slate-500 mt-0.5">{documentTitle.toLowerCase()} item description</p>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-600">1</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-600">${total.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-600">0%</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">${total.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-72 space-y-2 p-5 bg-slate-50 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium text-slate-900">${tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">{companySettings?.currency || 'MVR'}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(data.notes || data.terms || companySettings?.terms) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                {(data.notes) && (
                  <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">note</span>
                      Notes
                    </h4>
                    <p className="text-sm text-slate-600">{data.notes}</p>
                  </div>
                )}
                <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-[18px]">gavel</span>
                      Terms & Conditions
                    </h4>
                    <p className="text-sm text-slate-600">{data.terms || companySettings?.terms || ''}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Thank you for your business!</p>
              <p className="text-xs text-slate-400">
                {companySettings?.companyName || ''} • {companySettings?.email || ''} • {companySettings?.phone || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="lg:hidden flex flex-col gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
          {showShareLink && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Secure Share Link</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">link</span>
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white min-w-0 outline-none truncate"
                  />
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors shrink-0 ${
                    linkCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {linkCopied ? 'check_circle' : 'content_copy'}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>Protected</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">security</span>
                  <span>Secure</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={() => setShowShareLink(!showShareLink)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              Print
            </button>
            <button 
              onClick={async () => {
                try {
                  const endpoint = `/${type === 'quotation' ? 'quotations' : 'invoices'}/${data.id}/pdf`
                  const response = await apiClient.get(endpoint, {
                    responseType: 'blob'
                  })
                  const url = window.URL.createObjectURL(new Blob([response.data]))
                  const link = document.createElement('a')
                  link.href = url
                  link.setAttribute('download', `${type}-${data.number || data.id}.pdf`)
                  document.body.appendChild(link)
                  link.click()
                  link.remove()
                  window.URL.revokeObjectURL(url)
                } catch (err) {
                  const errorMessage = handleApiError(err)
                  alert(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Failed to download PDF')
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

