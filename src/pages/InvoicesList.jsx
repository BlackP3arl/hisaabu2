import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function InvoicesList() {
  const { invoices } = useData()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = !search || i.clientName.toLowerCase().includes(search.toLowerCase()) || i.number.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || i.status === filter
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
      overdue: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400',
      draft: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300',
      partial: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400',
      sent: 'bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800 text-sky-600 dark:text-sky-400',
    }
    return badges[status] || badges.draft
  }

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-emerald-500',
      overdue: 'bg-red-500',
      draft: 'bg-slate-400',
      partial: 'bg-amber-500',
      sent: 'bg-sky-500',
    }
    return colors[status] || 'bg-slate-400'
  }

  const getStatusText = (status) => {
    return status === 'partial' ? 'Partial' : status.toUpperCase()
  }

  const headerActions = (
    <Link
      to="/invoices/new"
      className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span className="hidden sm:inline">New Invoice</span>
    </Link>
  )

  return (
    <Layout 
      title="Invoices" 
      subtitle={`${filteredInvoices.length} Total Invoices`}
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
              placeholder="Search client, ID or amount..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'draft', 'sent', 'paid', 'partial', 'overdue'].map((f) => (
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {invoice.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{invoice.clientName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{invoice.number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(invoice.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${invoice.status === 'overdue' ? 'text-red-500 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                      {new Date(invoice.due).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">${invoice.amount.toLocaleString()}.00</span>
                    {invoice.status === 'partial' && invoice.paid && (
                      <p className="text-xs text-amber-600 mt-0.5">Paid: ${invoice.paid.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${getStatusBadge(invoice.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(invoice.status)}`}></span>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/invoices/${invoice.id}/view`}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="View"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </Link>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                      <button
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Share"
                      >
                        <span className="material-symbols-outlined text-[20px]">share</span>
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
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

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">receipt_long</span>
              <p className="text-slate-500 dark:text-slate-400">No invoices found</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-4">
        {filteredInvoices.map((invoice) => (
          <Link
            key={invoice.id}
            to={`/invoices/${invoice.id}/view`}
            className="relative flex flex-col gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 block"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {invoice.clientName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">{invoice.clientName}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{invoice.number}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-900 dark:text-white font-bold text-base">${invoice.amount.toLocaleString()}.00</span>
                <span className={`text-[10px] font-medium mt-0.5 ${
                  invoice.status === 'overdue' ? 'text-red-500 dark:text-red-400' :
                  invoice.status === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                  'text-slate-400 dark:text-slate-500'
                }`}>
                  Due {new Date(invoice.due).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-1">
              <div className={`flex items-center justify-center px-2.5 py-0.5 rounded-md border ${getStatusBadge(invoice.status)}`}>
                <span className="text-[10px] font-bold uppercase tracking-wide">{getStatusText(invoice.status)}</span>
              </div>
              {invoice.status === 'partial' && (
                <div className="flex-1 mx-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-2/3 rounded-full"></div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
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
        ))}

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">receipt_long</span>
            <p className="text-slate-500 dark:text-slate-400">No invoices found</p>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        to="/invoices/new"
        className="lg:hidden fixed z-30 bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </Layout>
  )
}
