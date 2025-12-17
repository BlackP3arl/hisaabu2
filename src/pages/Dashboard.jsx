import { useData } from '../context/DataContext'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { quotations, invoices } = useData()
  
  const stats = {
    totalOutstanding: 12450,
    totalQuotations: quotations.length,
    totalInvoices: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'sent' || i.status === 'draft').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  }

  const recentActivity = [
    { type: 'payment', title: 'Invoice #1024 Paid', client: 'Acme Corp', amount: '$4,500.00', time: '10:00 AM' },
    { type: 'sent', title: 'Quotation #550 Sent', client: 'John Doe', project: 'Project Alpha', time: 'Yesterday' },
    { type: 'viewed', title: 'Quote #549 Viewed', client: 'Tech Solutions Ltd', time: '2 days ago' },
    { type: 'client', title: 'New Client Added', client: 'Sarah Smith', time: 'Oct 24' },
  ]

  const quickActions = (
    <div className="flex items-center gap-3">
      <Link
        to="/invoices/new"
        className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        <span className="hidden sm:inline">New Invoice</span>
      </Link>
      <Link
        to="/quotations/new"
        className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 text-primary border border-primary/20 px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
      >
        <span className="material-symbols-outlined text-[20px]">description</span>
        <span>New Quote</span>
      </Link>
    </div>
  )

  return (
    <Layout title="Dashboard" subtitle="Welcome back, Alex Morgan" actions={quickActions}>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Outstanding */}
          <div className="bg-primary rounded-2xl p-5 lg:p-6 shadow-lg shadow-primary/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[100px] lg:text-[120px] text-white">account_balance_wallet</span>
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1">Total Outstanding</p>
              <h3 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">${stats.totalOutstanding.toLocaleString()}.00</h3>
            </div>
            <div className="relative z-10 mt-4 lg:mt-6 flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-medium">+12% vs last month</span>
            </div>
          </div>

          {/* Total Quotations */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 lg:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Quotations</p>
                <h3 className="text-slate-900 dark:text-white text-2xl lg:text-3xl font-bold tracking-tight">{stats.totalQuotations}</h3>
              </div>
              <div className="size-10 lg:size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px] lg:text-[28px]">request_quote</span>
              </div>
            </div>
            <div className="mt-4 lg:mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">12 pending approval</p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>

          {/* Total Invoices */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 lg:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Invoices</p>
                <h3 className="text-slate-900 dark:text-white text-2xl lg:text-3xl font-bold tracking-tight">{stats.totalInvoices}</h3>
              </div>
              <div className="size-10 lg:size-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                <span className="material-symbols-outlined text-[24px] lg:text-[28px]">receipt_long</span>
              </div>
            </div>
            <div className="mt-4 lg:mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">5 paid today</p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>

          {/* Status Breakdown - Desktop Only */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-full">
                <span className="material-symbols-outlined text-[20px] block">check_circle</span>
              </span>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Paid</p>
                <p className="text-slate-900 dark:text-white text-xl font-bold">{stats.paid}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-full">
                <span className="material-symbols-outlined text-[20px] block">error</span>
              </span>
              <div>
                <p className="text-red-700 dark:text-red-400 text-xs font-medium uppercase tracking-wide">Overdue</p>
                <p className="text-red-900 dark:text-red-200 text-xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Status Breakdown */}
        <div className="lg:hidden grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-[20px] block">check_circle</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Paid</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold">{stats.paid}</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-[20px] block">pending</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Unpaid</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold">{stats.unpaid}</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 opacity-50"></div>
            <span className="text-red-600 bg-white dark:bg-slate-800 p-1.5 rounded-full mb-2 z-10">
              <span className="material-symbols-outlined text-[20px] block">error</span>
            </span>
            <p className="text-red-700 dark:text-red-400 text-xs font-medium uppercase tracking-wide z-10">Overdue</p>
            <p className="text-red-900 dark:text-red-200 text-xl font-bold z-10">{stats.overdue}</p>
          </div>
        </div>

        {/* Quick Actions - Mobile */}
        <div className="lg:hidden">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/invoices/new" className="flex flex-col items-center justify-center gap-2 h-24 bg-primary text-white rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[32px]">add_circle</span>
              <span className="text-sm font-bold">New Invoice</span>
            </Link>
            <Link to="/quotations/new" className="flex flex-col items-center justify-center gap-2 h-24 bg-white dark:bg-slate-800 text-primary border border-primary/20 dark:border-slate-700 rounded-xl shadow-sm active:bg-slate-50 dark:active:bg-slate-700 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[32px]">description</span>
              <span className="text-sm font-bold">New Quote</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Recent Activity</h2>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                  activity.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  activity.type === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  activity.type === 'viewed' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {activity.type === 'payment' ? 'payments' : activity.type === 'sent' ? 'send' : activity.type === 'viewed' ? 'visibility' : 'person_add'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-white font-medium truncate">{activity.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{activity.client} • {activity.amount || activity.project || ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
