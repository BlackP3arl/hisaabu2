import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function QuotationsList() {
  const { quotations } = useData()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = !search || q.clientName.toLowerCase().includes(search.toLowerCase()) || q.number.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || q.status === filter
    return matchesSearch && matchesFilter
  })

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

  return (
    <Layout 
      title="Quotations" 
      subtitle={`${filteredQuotations.length} Active Quotes`}
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quote #</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiry</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {quotation.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{quotation.clientName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{quotation.number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(quotation.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(quotation.expiry).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">${quotation.amount.toLocaleString()}.00</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${getStatusBadge(quotation.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(quotation.status)}`}></span>
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
                      <button
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Convert to Invoice"
                      >
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </button>
                      <button
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

          {filteredQuotations.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">description</span>
              <p className="text-slate-500 dark:text-slate-400">No quotations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-4">
        {filteredQuotations.map((quotation) => (
          <Link
            key={quotation.id}
            to={`/quotations/${quotation.id}/view`}
            className="group bg-white dark:bg-card-dark rounded-2xl p-4 shadow-sm border border-transparent hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden block"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(quotation.status)}`}></div>
            <div className="flex justify-between items-start mb-3 pl-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-1 border border-gray-100 dark:border-gray-700">
                  <div className="text-slate-500 font-bold text-xs">{quotation.clientName.charAt(0)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{quotation.clientName}</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{quotation.number}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="text-gray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
            <div className="flex items-end justify-between pl-2">
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5">{new Date(quotation.date).toLocaleDateString()}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">${quotation.amount.toLocaleString()}.00</p>
              </div>
              <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${getStatusBadge(quotation.status)}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(quotation.status)}`}></div>
                <span className="text-[11px] font-semibold uppercase tracking-wide">{quotation.status}</span>
              </div>
            </div>
          </Link>
        ))}

        {filteredQuotations.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">description</span>
            <p className="text-slate-500 dark:text-slate-400">No quotations found</p>
          </div>
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
