import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/invoices', icon: 'receipt_long', label: 'Invoices' },
  { path: '/recurring-invoices', icon: 'repeat', label: 'Recurring Invoices' },
  { path: '/quotations', icon: 'request_quote', label: 'Quotations' },
  { path: '/clients', icon: 'group', label: 'Clients' },
  { path: '/items', icon: 'inventory_2', label: 'Items' },
  { path: '/uoms', icon: 'straighten', label: 'Units' },
  { path: '/reports', icon: 'assessment', label: 'Reports' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    window.location.href = '/login'
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
        </div>
        <span className="text-xl font-bold text-slate-900 dark:text-white">Hisaabu</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive(item.path)
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${isActive(item.path) ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Alex Morgan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">alex@company.com</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white dark:hover:bg-slate-700"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
