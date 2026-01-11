import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getRecurringInvoices, deleteRecurringInvoice, startRecurringInvoice, stopRecurringInvoice } from '../api/recurringInvoices.js'

export default function RecurringInvoicesList() {
  const [recurringInvoices, setRecurringInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState(() => {
    const statusParam = searchParams.get('status')
    return statusParam && ['active', 'stopped'].includes(statusParam) ? statusParam : 'all'
  })
  const [page, setPage] = useState(1)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Update URL when filter changes
  useEffect(() => {
    if (filter !== 'all') {
      setSearchParams({ status: filter })
    } else {
      setSearchParams({})
    }
  }, [filter, setSearchParams])

  // Fetch recurring invoices when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = {
          page,
          limit: 20,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filter !== 'all' && { status: filter })
        }
        const response = await getRecurringInvoices(params)
        setRecurringInvoices(response.data.recurringInvoices || [])
        setPagination(response.data.pagination)
      } catch (err) {
        console.error('Failed to fetch recurring invoices:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [page, debouncedSearch, filter])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring invoice?')) {
      try {
        await deleteRecurringInvoice(id)
        const params = {
          page,
          limit: 20,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filter !== 'all' && { status: filter })
        }
        const response = await getRecurringInvoices(params)
        setRecurringInvoices(response.data.recurringInvoices || [])
        setPagination(response.data.pagination)
      } catch (err) {
        console.error('Failed to delete recurring invoice:', err)
        alert('Failed to delete recurring invoice')
      }
    }
  }

  const handleStart = async (id) => {
    try {
      await startRecurringInvoice(id)
      const params = {
        page,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filter !== 'all' && { status: filter })
      }
      const response = await getRecurringInvoices(params)
      setRecurringInvoices(response.data.recurringInvoices || [])
      setPagination(response.data.pagination)
    } catch (err) {
      console.error('Failed to start recurring invoice:', err)
      alert('Failed to start recurring invoice')
    }
  }

  const handleStop = async (id) => {
    try {
      await stopRecurringInvoice(id)
      const params = {
        page,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filter !== 'all' && { status: filter })
      }
      const response = await getRecurringInvoices(params)
      setRecurringInvoices(response.data.recurringInvoices || [])
      setPagination(response.data.pagination)
    } catch (err) {
      console.error('Failed to stop recurring invoice:', err)
      alert('Failed to stop recurring invoice')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
      stopped: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300',
    }
    return badges[status] || badges.stopped
  }

  const getFrequencyText = (frequency) => {
    const frequencies = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Every 3 Months',
      annually: 'Annually',
    }
    return frequencies[frequency] || frequency
  }

  const getAutoBillText = (autoBill) => {
    const autoBills = {
      disabled: 'Disabled',
      enabled: 'Enabled',
      opt_in: 'Opt-In',
    }
    return autoBills[autoBill] || autoBill
  }

  const headerActions = (
    <Link
      to="/recurring-invoices/new"
      className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span className="hidden sm:inline">New Recurring Invoice</span>
    </Link>
  )

  if (loading && recurringInvoices.length === 0) {
    return (
      <Layout title="Recurring Invoices" actions={headerActions}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
            <p className="text-slate-500 dark:text-slate-400">Loading recurring invoices...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Recurring Invoices" 
      subtitle={`${pagination?.total || 0} Total Recurring Invoices`}
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
              placeholder="Search client..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'active', 'stopped'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
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
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Frequency</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Generation</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recurringInvoices.map((ri) => {
                const clientName = ri.client?.name || ri.clientName || 'Unknown Client'
                return (
                  <tr key={ri.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {clientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{clientName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{getAutoBillText(ri.autoBill)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{getFrequencyText(ri.frequency)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {ri.startDate ? new Date(ri.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {ri.endDate ? new Date(ri.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {ri.nextGenerationDate ? new Date(ri.nextGenerationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${getStatusBadge(ri.status)}`}>
                          {ri.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/recurring-invoices/${ri.id}/view`}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                        {ri.status === 'active' ? (
                          <button
                            onClick={() => handleStop(ri.id)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Stop"
                          >
                            <span className="material-symbols-outlined text-[20px]">pause</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(ri.id)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Start"
                          >
                            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(ri.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {recurringInvoices.length === 0 && !loading && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">repeat</span>
              <p className="text-slate-500 dark:text-slate-400">No recurring invoices found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || loading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNext || loading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-4">
        {recurringInvoices.map((ri) => {
          const clientName = ri.client?.name || ri.clientName || 'Unknown Client'
          return (
            <Link
              key={ri.id}
              to={`/recurring-invoices/${ri.id}/view`}
              className="relative flex flex-col gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {clientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">{clientName}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{getFrequencyText(ri.frequency)}</p>
                  </div>
                </div>
                <div className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(ri.status)}`}>
                  {ri.status}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-1">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Start: {ri.startDate ? new Date(ri.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Next: {ri.nextGenerationDate ? new Date(ri.nextGenerationDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {ri.status === 'active' ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleStop(ri.id)
                      }}
                      className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors rounded-full"
                    >
                      <span className="material-symbols-outlined text-[20px]">pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleStart(ri.id)
                      }}
                      className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors rounded-full"
                    >
                      <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>
            </Link>
          )
        })}

        {recurringInvoices.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">repeat</span>
            <p className="text-slate-500 dark:text-slate-400">No recurring invoices found</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="px-4 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        to="/recurring-invoices/new"
        className="lg:hidden fixed z-30 bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </Layout>
  )
}

