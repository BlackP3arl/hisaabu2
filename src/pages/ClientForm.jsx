import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getClient, createClient, updateClient, loading } = useData()
  const [client, setClient] = useState(null)
  const [formError, setFormError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    companyName: '',
    taxId: '',
    notes: '',
    status: 'active',
  })

  // Load client data if editing
  useEffect(() => {
    if (id) {
      const loadClient = async () => {
        try {
          const clientData = await getClient(parseInt(id))
          if (clientData) {
            setClient(clientData)
            setFormData({
              name: clientData.name || '',
              email: clientData.email || '',
              phone: clientData.phone || '',
              address: clientData.address || '',
              city: clientData.city || '',
              country: clientData.country || '',
              postalCode: clientData.postalCode || '',
              companyName: clientData.companyName || '',
              taxId: clientData.taxId || '',
              notes: clientData.notes || '',
              status: clientData.status || 'active',
            })
          }
        } catch (err) {
          setFormError('Failed to load client data')
        }
      }
      loadClient()
    }
  }, [id, getClient])

  const handleSave = async () => {
    setFormError(null)
    try {
      if (id) {
        await updateClient(parseInt(id), formData)
      } else {
        await createClient(formData)
      }
      navigate('/clients')
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save client')
    }
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-24 lg:pb-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/clients" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Client' : 'New Client'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{id ? 'Update client information' : 'Add a new client to your list'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/clients" className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </Link>
            <button 
              onClick={handleSave} 
              disabled={loading.client}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.client ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Client
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/clients" className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {id ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={handleSave} className="flex items-center justify-end px-2">
            <p className="text-primary text-base font-bold leading-normal tracking-wide shrink-0">Save</p>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8">
          {formError && (
            <div className="max-w-4xl mx-auto mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
            </div>
          )}
          {id && loading.client && !client && (
            <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
                <p className="text-slate-500 dark:text-slate-400">Loading client data...</p>
              </div>
            </div>
          )}
          {(!id || client) && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Personal Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">business</span>
                  Company Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Acme Corporation"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tax ID / VAT Number</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="GB123456789"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="new">New</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  Address
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street, Suite 100"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="San Francisco"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="94102"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">notes</span>
                  Additional Notes
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any internal notes about this client..."
                  rows="4"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3 resize-none"
                />
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex lg:col-span-2 justify-end gap-3">
                <Link to="/clients" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </Link>
                <button 
                  onClick={handleSave} 
                  disabled={loading.client}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.client ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Save Client
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link to="/clients" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm active:scale-95 transition-transform">
              Cancel
            </Link>
            <button 
              onClick={handleSave} 
              disabled={loading.client}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-transform hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.client ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Client
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


