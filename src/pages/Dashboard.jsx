import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { dashboardStats, loading, fetchDashboardStats } = useData()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status) => {
    const colors = {
      paid: 'emerald',
      sent: 'blue',
      draft: 'slate',
      partial: 'amber',
      overdue: 'red',
      accepted: 'emerald',
      expired: 'red',
    }
    return colors[status] || 'slate'
  }

  const getStatusIcon = (status) => {
    const icons = {
      paid: 'check_circle',
      sent: 'send',
      draft: 'draft',
      partial: 'pending',
      overdue: 'error',
      accepted: 'check_circle',
      expired: 'schedule',
    }
    return icons[status] || 'circle'
  }

  const getStatusStyles = (status) => {
    const styles = {
      paid: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400'
      },
      sent: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400'
      },
      draft: {
        bg: 'bg-slate-100 dark:bg-slate-700',
        text: 'text-slate-600 dark:text-slate-300'
      },
      partial: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400'
      },
      overdue: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400'
      },
      accepted: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400'
      },
      expired: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400'
      },
    }
    return styles[status] || styles.draft
  }

  if (loading.dashboard && !dashboardStats) {
    return (
      <Layout title="Dashboard">
        <div className="p-4 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 dark:text-slate-400">Loading dashboard...</div>
          </div>
        </div>
      </Layout>
    )
  }

  const stats = dashboardStats || {}
  const financials = stats.financials || {}
  const clients = stats.clients || {}
  const quotations = stats.quotations || {}
  const invoices = stats.invoices || {}
  const recentInvoices = stats.recentInvoices || []
  const recentQuotations = stats.recentQuotations || []

  const paidCount = invoices.byStatus?.paid || 0
  const unpaidCount = (invoices.byStatus?.sent || 0) + (invoices.byStatus?.draft || 0)
  const overdueCount = invoices.byStatus?.overdue || 0

  return (
    <Layout title="Dashboard">
      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards - Mobile Carousel / Desktop Grid */}
        <div className="flex lg:grid lg:grid-cols-3 overflow-x-auto no-scrollbar pb-4 lg:pb-0 gap-4 snap-x snap-mandatory lg:snap-none">
          {/* Total Outstanding Card */}
          <div className="snap-center shrink-0 w-[85%] lg:w-full max-w-[320px] lg:max-w-none bg-primary rounded-2xl p-5 shadow-lg shadow-primary/20 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[120px] text-white">account_balance_wallet</span>
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1">Total Outstanding</p>
              <h3 className="text-white text-3xl font-bold tracking-tight">
                {formatCurrency(financials.outstandingBalance)}
              </h3>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-medium">
                {clients.total || 0} {clients.total === 1 ? 'client' : 'clients'}
              </span>
            </div>
          </div>

          {/* Total Quotations Card */}
          <div className="snap-center shrink-0 w-[85%] lg:w-full max-w-[320px] lg:max-w-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Quotations</p>
                <h3 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
                  {quotations.total || 0}
                </h3>
              </div>
              <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">request_quote</span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {quotations.byStatus?.sent || 0} pending approval
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: quotations.total ? `${((quotations.byStatus?.sent || 0) / quotations.total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Invoices Card */}
          <div className="snap-center shrink-0 w-[85%] lg:w-full max-w-[320px] lg:max-w-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Invoices</p>
                <h3 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
                  {invoices.total || 0}
                </h3>
              </div>
              <div className="size-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {paidCount} paid
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full rounded-full" 
                  style={{ width: invoices.total ? `${(paidCount / invoices.total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-[20px] block">check_circle</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Paid</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold">{paidCount}</p>
          </div>

          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-[20px] block">pending</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Unpaid</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold">{unpaidCount}</p>
          </div>

          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 opacity-50"></div>
            <span className="text-red-600 bg-white dark:bg-slate-800 p-1.5 rounded-full mb-2 z-10">
              <span className="material-symbols-outlined text-[20px] block">error</span>
            </span>
            <p className="text-red-700 dark:text-red-400 text-xs font-medium uppercase tracking-wide z-10">Overdue</p>
            <p className="text-red-900 dark:text-red-200 text-xl font-bold z-10">{overdueCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/invoices/new"
              className="flex flex-col items-center justify-center gap-2 h-24 bg-primary text-white rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[32px]">add_circle</span>
              <span className="text-sm font-bold">New Invoice</span>
            </Link>
            <Link
              to="/quotations/new"
              className="flex flex-col items-center justify-center gap-2 h-24 bg-white dark:bg-slate-800 text-primary border border-primary/20 dark:border-slate-700 rounded-xl shadow-sm active:bg-slate-50 dark:active:bg-slate-700 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[32px]">description</span>
              <span className="text-sm font-bold">New Quote</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Recent Activity</h2>
            <Link to="/invoices" className="text-primary text-sm font-semibold">View All</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentInvoices.length === 0 && recentQuotations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p>No recent activity</p>
              </div>
            ) : (
              <>
                {recentInvoices.slice(0, 5).map((invoice) => {
                  const statusStyles = getStatusStyles(invoice.status)
                  return (
                    <Link
                      key={invoice.id}
                      to={`/invoices/${invoice.id}/view`}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className={`size-10 rounded-full ${statusStyles.bg} flex items-center justify-center shrink-0 ${statusStyles.text}`}>
                        <span className="material-symbols-outlined text-[20px]">{getStatusIcon(invoice.status)}</span>
                      </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-white font-medium truncate">
                        Invoice {invoice.number}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                        {invoice.clientName} • {formatCurrency(invoice.totalAmount)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-400 dark:text-slate-500 text-xs">{formatDate(invoice.issueDate)}</p>
                    </div>
                  </Link>
                  )
                })}
                {recentQuotations.slice(0, 5).map((quotation) => {
                  const statusStyles = getStatusStyles(quotation.status)
                  return (
                    <Link
                      key={quotation.id}
                      to={`/quotations/${quotation.id}/view`}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className={`size-10 rounded-full ${statusStyles.bg} flex items-center justify-center shrink-0 ${statusStyles.text}`}>
                        <span className="material-symbols-outlined text-[20px]">{getStatusIcon(quotation.status)}</span>
                      </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-white font-medium truncate">
                        Quotation {quotation.number}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                        {quotation.clientName} • {formatCurrency(quotation.totalAmount)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-400 dark:text-slate-500 text-xs">{formatDate(quotation.issueDate)}</p>
                    </div>
                  </Link>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
