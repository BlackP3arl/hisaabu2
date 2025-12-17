import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const location = useLocation()
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/') ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/invoices" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/invoices') ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isActive('/invoices') ? 'fill-1' : ''}`}>receipt_long</span>
          <span className="text-[10px] font-medium">Invoices</span>
        </Link>
        <Link to="/quotations" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/quotations') ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isActive('/quotations') ? 'fill-1' : ''}`}>request_quote</span>
          <span className="text-[10px] font-medium">Quotes</span>
        </Link>
        <Link to="/clients" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/clients') ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isActive('/clients') ? 'fill-1' : ''}`}>group</span>
          <span className="text-[10px] font-medium">Clients</span>
        </Link>
        <Link to="/items" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/items') || isActive('/categories') ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isActive('/items') || isActive('/categories') ? 'fill-1' : ''}`}>inventory_2</span>
          <span className="text-[10px] font-medium">Items</span>
        </Link>
      </div>
    </nav>
  )
}
