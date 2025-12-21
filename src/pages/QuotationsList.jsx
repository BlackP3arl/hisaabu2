import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function QuotationsList() {
  const { quotations, loading, pagination, fetchQuotations, deleteQuotation, convertQuotationToInvoice } = useData()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch quotations when filters change
  useEffect(() => {
    const params = {
      page,
      limit: 20,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filter !== 'all' && { status: filter })
    }
    fetchQuotations(params)
  }, [page, debouncedSearch, filter, fetchQuotations])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(id)
        const params = {
          page,
          limit: 20,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filter !== 'all' && { status: filter })
        }
        fetchQuotations(params)
      } catch (err) {
        console.error('Failed to delete quotation:', err)
      }
    }
  }

  const handleConvert = async (id) => {
    if (window.confirm('Convert this quotation to an invoice?')) {
      try {
        const invoice = await convertQuotationToInvoice(id)
        navigate(`/invoices/${invoice.id}/view`)
      } catch (err) {
        console.error('Failed to convert quotation:', err)
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      accepted: 'bg-green-500',
      sent: 'bg-primary',
      draft: 'bg-gray-400',
      expired: 'bg-red-400',
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusBadge = (status) => {
    const badges = {
      accepted: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400',
      sent: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-primary dark:text-blue-400',
      draft: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
      expired: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400',
    }
    return badges[status] || badges.draft
  }

  const headerActions = (
    <Link
      to="/quotations/new"
      className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span className="hidden sm:inline">New Quotation</span>
    </Link>
  )

  const quotationsPagination = pagination?.quotations || {}

  return (
    <Layout 
      title="Quotations" 
      subtitle={`${quotationsPagination.total || quotations.length} Active Quotes`}
      actions={headerActions}
    >
      {/* Search & Filters */}
      <div className="px-4 lg:px-8 py-4 space-y-4 bg-background-light dark:bg-background-dark lg:bg-white lg:dark:bg-slate-900 lg:border-b lg:border-slate-200 lg:dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 lg:py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
              placeholder="Search client, ID, or amount..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'draft', 'sent', 'accepted', 'expired'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  setPage(1)
                }}
                className={`shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-all active:scale-95 capitalize whitespace-nowrap ${
                  filter === f
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block px-8 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading.quotations ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quote #</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiry</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            {quotation.clientName?.charAt(0) || quotation.client?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{quotation.clientName || quotation.client?.name || 'Unknown Client'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{quotation.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {quotation.issueDate ? new Date(quotation.issueDate).toLocaleDateString() : quotation.date ? new Date(quotation.date).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : quotation.expiry ? new Date(quotation.expiry).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ${quotation.totalAmount?.toLocaleString() || quotation.amount?.toLocaleString() || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusBadge(quotation.status)}`}>
                            {quotation.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/quotations/${quotation.id}/view`}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="View"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </Link>
                          <Link
                            to={`/quotations/${quotation.id}`}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </Link>
                          {quotation.status !== 'accepted' && (
                            <button
                              onClick={() => handleConvert(quotation.id)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Convert to Invoice"
                            >
                              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {quotations.length === 0 && !loading.quotations && (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">request_quote</span>
                  <p className="text-slate-500 dark:text-slate-400">No quotations found</p>
                </div>
              )}

              {/* Pagination */}
              {quotationsPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {((quotationsPagination.page - 1) * quotationsPagination.limit) + 1} to {Math.min(quotationsPagination.page * quotationsPagination.limit, quotationsPagination.total)} of {quotationsPagination.total}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!quotationsPagination.hasPrev || loading.quotations}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(quotationsPagination.totalPages, p + 1))}
                      disabled={!quotationsPagination.hasNext || loading.quotations}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-3">
        {loading.quotations ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {quotations.map((quotation) => (
              <Link 
                key={quotation.id} 
                to={`/quotations/${quotation.id}/view`}
                className="group block bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg border border-slate-100 dark:border-slate-600">
                      {quotation.clientName?.charAt(0) || quotation.client?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{quotation.number}</h3>
                        <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${getStatusBadge(quotation.status)}`}>
                          {quotation.status?.toUpperCase() || 'DRAFT'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {quotation.clientName || quotation.client?.name || 'Unknown Client'}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-slate-400 p-1 -mr-2">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      ${quotation.totalAmount?.toLocaleString() || quotation.amount?.toLocaleString() || '0.00'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Expiry</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : quotation.expiry ? new Date(quotation.expiry).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {quotations.length === 0 && !loading.quotations && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">request_quote</span>
                <p className="text-slate-500 dark:text-slate-400">No quotations found</p>
              </div>
            )}

            {/* Mobile Pagination */}
            {quotationsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!quotationsPagination.hasPrev || loading.quotations}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {quotationsPagination.page} of {quotationsPagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(quotationsPagination.totalPages, p + 1))}
                  disabled={!quotationsPagination.hasNext || loading.quotations}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <Link 
        to="/quotations/new"
        className="lg:hidden fixed z-30 bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </Layout>
  )
}
