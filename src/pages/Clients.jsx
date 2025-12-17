import { useState } from 'react'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function Clients() {
  const { clients } = useData()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredClients = clients.filter(client => {
    const matchesSearch = !search || client.name.toLowerCase().includes(search.toLowerCase()) || client.email.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || client.status === filter
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-300 ring-green-600/20',
      overdue: 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 ring-red-600/10',
      new: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-500/10',
    }
    return badges[status] || badges.new
  }

  const getStatusText = (status) => status.toUpperCase()

  const headerActions = (
    <button className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold">
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span className="hidden sm:inline">New Client</span>
    </button>
  )

  return (
    <Layout 
      title="Clients" 
      subtitle={`${filteredClients.length} Total Clients`}
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
              placeholder="Search clients by name, email..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'active', 'overdue', 'new'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-all active:scale-95 capitalize whitespace-nowrap ${
                  filter === f
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                }`}
              >
                {f === 'all' ? 'All Clients' : f}
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Billed</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{client.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{client.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{client.address}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {client.outstanding ? (
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">${client.outstanding.toLocaleString()}</span>
                    ) : client.totalBilled ? (
                      <span className="text-sm font-bold text-slate-900 dark:text-white">${client.totalBilled.toLocaleString()}</span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ring-1 ring-inset ${getStatusBadge(client.status)}`}>
                        {getStatusText(client.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="View"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Call"
                      >
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Email"
                      >
                        <span className="material-symbols-outlined text-[20px]">mail</span>
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

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">group</span>
              <p className="text-slate-500 dark:text-slate-400">No clients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-3">
        {filteredClients.map((client) => (
          <div key={client.id} className="group bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden active:scale-[0.99] transition-transform">
            <div className="flex justify-between items-start gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg border border-slate-100 dark:border-slate-600">
                  {client.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{client.name}</h3>
                    <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getStatusBadge(client.status)}`}>
                      {getStatusText(client.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{client.email} • {client.address}</p>
                </div>
              </div>
              <button className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-2">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
              <div className="flex flex-col">
                {client.outstanding ? (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Outstanding</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">${client.outstanding.toLocaleString()}.00</span>
                  </>
                ) : client.totalBilled ? (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Billed</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">${client.totalBilled.toLocaleString()}.00</span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span className="text-xs font-medium">No recent activity</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </button>
                <button className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">group</span>
            <p className="text-slate-500 dark:text-slate-400">No clients found</p>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button className="lg:hidden fixed z-30 bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </Layout>
  )
}
