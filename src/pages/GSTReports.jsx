import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const gstReports = [
  {
    id: 'input-tax',
    title: 'Input Tax Statement',
    description: 'View and export Input Tax reports for your invoices',
    icon: 'receipt_long',
    path: '/reports/input-tax',
    color: 'bg-blue-500',
  },
  {
    id: 'output-tax',
    title: 'Output Tax Statement',
    description: 'View and export Output Tax reports for your invoices',
    icon: 'description',
    path: '/reports/output-tax',
    color: 'bg-purple-500',
  },
  {
    id: 'input-tax-capital',
    title: 'Input Tax In Relation to Capital Expenditure',
    description: 'View and export Input Tax reports for capital expenditure invoices',
    icon: 'account_balance',
    path: '/reports/input-tax-capital',
    color: 'bg-emerald-500',
  },
]

export default function GSTReports() {
  return (
    <Layout 
      title="GST Reports" 
      subtitle="View and export Goods and Services Tax reports"
    >
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="text-sm font-medium">Back to Reports</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {gstReports.map((report) => (
              <Link
                key={report.id}
                to={report.path}
                className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`${report.color} w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                    <span className="material-symbols-outlined text-2xl">{report.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium">
                  <span>View Report</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

