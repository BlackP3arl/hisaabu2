import { useState, useRef, useEffect } from 'react'
import { useData } from '../context/DataContext'

export default function ClientSelector({ onSelect, onClose, selectedClientId }) {
  const { clients, addClient } = useData()
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'active'
  })
  const searchRef = useRef(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const filteredClients = clients.filter(client => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return client.name.toLowerCase().includes(searchLower) || 
           client.email.toLowerCase().includes(searchLower) ||
           client.phone?.toLowerCase().includes(searchLower) ||
           client.address?.toLowerCase().includes(searchLower)
  })

  const getStatusStyles = (status) => {
    const styles = {
      active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      new: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      overdue: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    }
    return styles[status] || styles.active
  }

  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-400 to-indigo-600',
      'from-emerald-400 to-teal-600',
      'from-purple-400 to-pink-600',
      'from-amber-400 to-orange-600',
      'from-cyan-400 to-blue-600',
      'from-rose-400 to-red-600',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleSelectClient = (client) => {
    onSelect(client)
    onClose()
  }

  const handleCreateAndSelect = () => {
    if (!newClient.name || !newClient.email) return
    
    const createdClient = addClient({
      ...newClient,
      totalBilled: 0
    })
    
    onSelect(createdClient)
    onClose()
  }

  const handleCreateNew = () => {
    setNewClient({ ...newClient, name: search })
    setShowCreateForm(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {showCreateForm ? 'Add New Client' : 'Select Client'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {!showCreateForm ? (
          <>
            {/* Search */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients by name, email, phone..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Clients List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredClients.length > 0 ? (
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                        selectedClientId === client.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(client.name)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{client.name}</h3>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getStatusStyles(client.status)}`}>
                            {client.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{client.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">phone</span>
                              {client.phone}
                            </span>
                          )}
                          {client.address && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {client.address}
                            </span>
                          )}
                        </div>
                      </div>
                      {client.totalBilled > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">Total Billed</p>
                          <p className="font-bold text-slate-900 dark:text-white">${client.totalBilled.toLocaleString()}</p>
                        </div>
                      )}
                      <span className={`material-symbols-outlined transition-colors ${
                        selectedClientId === client.id ? 'text-primary' : 'text-slate-300 group-hover:text-primary'
                      }`}>
                        {selectedClientId === client.id ? 'check_circle' : 'arrow_forward'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">person_search</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-4">
                    {search ? `No clients found for "${search}"` : 'No clients available'}
                  </p>
                </div>
              )}
            </div>

            {/* Create New Client Button */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-primary/40 text-primary font-semibold hover:bg-primary/10 hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined">person_add</span>
                Add New Client {search && `"${search}"`}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Create Client Form */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      placeholder="e.g., John Smith"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 px-4"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 px-4"
                    />
                  </div>
                </div>

                {/* Phone & Company Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 px-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      placeholder="Company Inc."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 px-4"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
                  <textarea
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="Street, City, Country"
                    rows="2"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary p-4 resize-none"
                  />
                </div>

                {/* Preview Card */}
                {newClient.name && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Preview</p>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(newClient.name)} flex items-center justify-center text-white font-bold text-lg`}>
                        {newClient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{newClient.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{newClient.email || 'No email'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {newClient.phone && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">phone</span>
                              {newClient.phone}
                            </span>
                          )}
                          {newClient.company && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">business</span>
                              {newClient.company}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyles('new')}`}>
                        new
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Search
              </button>
              <button
                onClick={handleCreateAndSelect}
                disabled={!newClient.name || !newClient.email}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Add & Select
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

