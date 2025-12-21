import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getClient, deleteClient, loading } = useData()
  const [client, setClient] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const loadClient = async () => {
      try {
        const clientData = await getClient(parseInt(id))
        setClient(clientData)
      } catch (err) {
        console.error('Failed to load client:', err)
      }
    }
    if (id) {
      loadClient()
    }
  }, [id, getClient])

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(parseInt(id))
        navigate('/clients')
      } catch (err) {
        console.error('Failed to delete client:', err)
      }
    }
  }

  if (loading.client && !client) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
            <p className="text-slate-500 dark:text-slate-400">Loading client data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">person_off</span>
            <p className="text-slate-500 dark:text-slate-400">Client not found</p>
            <Link to="/clients" className="mt-4 text-primary hover:underline">Back to Clients</Link>
          </div>
        </div>
      </div>
    )
  }

  // Use data from API response
  const totalInvoiced = client.totalBilled || 0
  const totalOutstanding = client.outstanding || 0
  const totalPaid = totalInvoiced - totalOutstanding
  const clientInvoices = client.recentInvoices || []
  const clientQuotations = client.recentQuotations || []

  const getStatusStyles = (status) => {
    const styles = {
      active: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      new: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
    }
    return styles[status] || styles.new
  }

  const getInvoiceStatusStyles = (status) => {
    const styles = {
      paid: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      draft: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      partial: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    }
    return styles[status] || styles.draft
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
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {client.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{client.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/clients/${id}`}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <Link
              to="/invoices/new"
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              New Invoice
            </Link>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/clients" className="text-gray-900 dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Client Details</h2>
          <button className="text-primary">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {/* Client Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{client.name}</h2>
                          <p className="text-blue-100 text-sm mt-0.5">{client.companyName || 'Individual Client'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${getStatusStyles(client.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {client.status}
                      </span>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="p-6 lg:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">mail</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Email</p>
                          <a href={`mailto:${client.email}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">
                            {client.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[20px]">call</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Phone</p>
                          <a href={`tel:${client.phone}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">
                            {client.phone || 'Not provided'}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">location_on</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Address</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {client.address || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      {client.taxId && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[20px]">badge</span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Tax ID</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{client.taxId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Invoices */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                      Recent Invoices
                    </h3>
                    <Link to="/invoices" className="text-sm font-medium text-primary hover:underline">View All</Link>
                  </div>
                  {clientInvoices.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {clientInvoices.slice(0, 5).map(invoice => (
                        <Link 
                          key={invoice.id}
                          to={`/invoices/${invoice.id}/view`}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-500 text-[20px]">receipt</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.number}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">${invoice.amount.toLocaleString()}</p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getInvoiceStatusStyles(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">receipt_long</span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">No invoices yet</p>
                    </div>
                  )}
                </div>

                {/* Recent Quotations */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">request_quote</span>
                      Recent Quotations
                    </h3>
                    <Link to="/quotations" className="text-sm font-medium text-primary hover:underline">View All</Link>
                  </div>
                  {clientQuotations.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {clientQuotations.slice(0, 5).map(quote => (
                        <Link 
                          key={quote.id}
                          to={`/quotations/${quote.id}/view`}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-500 text-[20px]">description</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{quote.number}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(quote.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">${quote.amount.toLocaleString()}</p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getInvoiceStatusStyles(quote.status)}`}>
                              {quote.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">request_quote</span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">No quotations yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Financial Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Financial Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total Invoiced</span>
                      <span className="font-bold text-slate-900 dark:text-white">${totalInvoiced.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total Paid</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">${totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Outstanding</span>
                      <span className={`text-lg font-bold ${totalOutstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        ${totalOutstanding.toLocaleString()}
                      </span>
                    </div>
                    {totalOutstanding > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">warning</span>
                          Outstanding balance requires attention
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{client.totalInvoices || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Invoices</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{client.totalQuotations || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quotations</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to="/invoices/new"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                      <span className="text-sm font-medium text-primary">Create Invoice</span>
                    </Link>
                    <Link
                      to="/quotations/new"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-purple-600">description</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Create Quotation</span>
                    </Link>
                    <a
                      href={`mailto:${client.email}`}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-blue-600">mail</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Email</span>
                    </a>
                    <a
                      href={`tel:${client.phone}`}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-green-600">call</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Call Client</span>
                    </a>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-red-500">delete</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Client</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:block space-y-3">
                  <Link
                    to={`/clients/${id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Edit Client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link
              to={`/clients/${id}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <a
              href={`mailto:${client.email}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
              Email
            </a>
            <Link
              to="/invoices/new"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">delete</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Client?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


