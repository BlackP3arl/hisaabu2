import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { getRecurringInvoice, getRecurringInvoiceSchedule, getGeneratedInvoices, startRecurringInvoice, stopRecurringInvoice, deleteRecurringInvoice } from '../api/recurringInvoices.js'
import { formatCurrency } from '../utils/currency'

export default function RecurringInvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recurringInvoice, setRecurringInvoice] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [generatedInvoices, setGeneratedInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [riResponse, scheduleResponse, invoicesResponse] = await Promise.all([
          getRecurringInvoice(parseInt(id)),
          getRecurringInvoiceSchedule(parseInt(id), 12),
          getGeneratedInvoices(parseInt(id), { page: 1, limit: 20 })
        ])
        
        if (riResponse.data?.recurringInvoice) {
          setRecurringInvoice(riResponse.data.recurringInvoice)
        }
        if (scheduleResponse.data?.schedule) {
          setSchedule(scheduleResponse.data.schedule)
        }
        if (invoicesResponse.data?.invoices) {
          setGeneratedInvoices(invoicesResponse.data.invoices)
        }
      } catch (err) {
        setError('Failed to load recurring invoice data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleStart = async () => {
    try {
      await startRecurringInvoice(parseInt(id))
      const response = await getRecurringInvoice(parseInt(id))
      if (response.data?.recurringInvoice) {
        setRecurringInvoice(response.data.recurringInvoice)
      }
    } catch (err) {
      setError('Failed to start recurring invoice')
    }
  }

  const handleStop = async () => {
    try {
      await stopRecurringInvoice(parseInt(id))
      const response = await getRecurringInvoice(parseInt(id))
      if (response.data?.recurringInvoice) {
        setRecurringInvoice(response.data.recurringInvoice)
      }
    } catch (err) {
      setError('Failed to stop recurring invoice')
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recurring invoice?')) {
      try {
        await deleteRecurringInvoice(parseInt(id))
        navigate('/recurring-invoices')
      } catch (err) {
        setError('Failed to delete recurring invoice')
      }
    }
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

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
      stopped: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300',
    }
    return badges[status] || badges.stopped
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
            <p className="text-slate-500 dark:text-slate-400">Loading recurring invoice...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !recurringInvoice) {
    return (
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">error</span>
            <p className="text-slate-500 dark:text-slate-400">{error || 'Recurring invoice not found'}</p>
            <Link to="/recurring-invoices" className="mt-4 inline-block text-primary hover:underline">
              Back to Recurring Invoices
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const client = recurringInvoice.client
  const clientName = client?.name || 'Unknown Client'

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/recurring-invoices" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recurring Invoice</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{clientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${getStatusBadge(recurringInvoice.status)}`}>
                {recurringInvoice.status}
              </span>
              {recurringInvoice.status === 'active' ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[20px]">pause</span>
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  Start
                </button>
              )}
              <Link
                to={`/recurring-invoices/${id}`}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
                Delete
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'invoices'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Generated Invoices
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:px-8 lg:py-8">
          {error && (
            <div className="max-w-[1600px] mx-auto mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Recurring Invoice Info */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recurring Invoice Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Frequency</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{getFrequencyText(recurringInvoice.frequency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Auto Bill</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{getAutoBillText(recurringInvoice.autoBill)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Start Date</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {recurringInvoice.startDate ? new Date(recurringInvoice.startDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">End Date</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {recurringInvoice.endDate ? new Date(recurringInvoice.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Payment Terms</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">Day {recurringInvoice.dueDateDays}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Next Generation</p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {recurringInvoice.nextGenerationDate ? new Date(recurringInvoice.nextGenerationDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                {recurringInvoice.items && recurringInvoice.items.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Line Items</h3>
                    <div className="space-y-3">
                      {recurringInvoice.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {formatCurrency((item.quantity * item.price * (1 - (item.discountPercent || 0) / 100)) * (1 + (item.taxPercent || 0) / 100), recurringInvoice.currency || 'MVR')}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.quantity} x {formatCurrency(item.price, recurringInvoice.currency || 'MVR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes & Terms */}
                {(recurringInvoice.notes || recurringInvoice.terms) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {recurringInvoice.notes && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Notes</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{recurringInvoice.notes}</p>
                      </div>
                    )}
                    {recurringInvoice.terms && (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Terms & Conditions</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{recurringInvoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="max-w-[1600px] mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Future Invoice Schedule</h3>
                {schedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Issue Date</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {schedule.map((sched, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                              {new Date(sched.issueDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                              {new Date(sched.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No future invoices scheduled</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="max-w-[1600px] mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generated Invoices</h3>
                {generatedInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {generatedInvoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        to={`/invoices/${invoice.id}/view`}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{invoice.number}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(invoice.totalAmount || 0, invoice.currency || 'MVR')}
                          </p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                            invoice.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No invoices generated yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

