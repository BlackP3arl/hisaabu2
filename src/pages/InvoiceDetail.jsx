import { useParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { invoices, company } = useData()
  const invoice = invoices.find(i => i.id === parseInt(id))

  if (!invoice) return <div className="flex items-center justify-center min-h-screen">Invoice not found</div>

  const getStatusStyles = (status) => {
    const styles = {
      paid: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      draft: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
      partial: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
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
            <Link to="/invoices" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{invoice.number}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/invoices/${id}`}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download PDF
            </button>
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold">
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/invoices" className="text-gray-900 dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Details</h2>
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
                {/* Invoice Preview */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {/* Company Header */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-primary text-2xl">business</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{company.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{company.address}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{company.email}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{invoice.number}</h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 border ${getStatusStyles(invoice.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="p-6 lg:p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Bill To</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{invoice.clientName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Issue Date</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Due Date</p>
                        <p className={`text-sm font-semibold mt-1 ${invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                          {new Date(invoice.due).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Amount Due</p>
                        <p className="text-sm font-bold text-primary mt-1">${invoice.amount.toLocaleString()}.00</p>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Qty</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden sm:table-cell">Price</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          <tr>
                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-900 dark:text-white text-sm">Professional Services</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Invoice item description</p>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">1</td>
                            <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">${invoice.amount.toLocaleString()}.00</td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">${invoice.amount.toLocaleString()}.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                      <div className="w-full sm:w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                          <span className="font-medium text-slate-900 dark:text-white">${invoice.amount.toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Tax (0%)</span>
                          <span className="font-medium text-slate-900 dark:text-white">$0.00</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">Total</span>
                          <span className="text-xl font-bold text-primary">${invoice.amount.toLocaleString()}.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusStyles(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Amount Paid</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${invoice.paid?.toLocaleString() || '0'}.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Balance Due</span>
                      <span className="font-bold text-red-600 dark:text-red-400">${(invoice.amount - (invoice.paid || 0)).toLocaleString()}.00</span>
                    </div>
                    {invoice.status === 'partial' && (
                      <div className="pt-2">
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${((invoice.paid || 0) / invoice.amount) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                          {Math.round(((invoice.paid || 0) / invoice.amount) * 100)}% paid
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                      <span className="material-symbols-outlined text-emerald-600">payments</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Record Payment</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                      <span className="material-symbols-outlined text-primary">send</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Reminder</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                      <span className="material-symbols-outlined text-slate-500">content_copy</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Duplicate Invoice</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                      <span className="material-symbols-outlined text-red-500">delete</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:block space-y-3">
                  <Link
                    to={`/invoices/${id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Edit Invoice
                  </Link>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-3.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link
              to={`/invoices/${id}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </Link>
            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm">
              <span className="material-symbols-outlined text-[20px]">download</span>
              PDF
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md">
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
