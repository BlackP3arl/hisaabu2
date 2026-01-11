import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const reports = [
  {
    id: 'gst-reports',
    title: 'GST Reports',
    description: 'View and export Goods and Services Tax reports including Input Tax, Output Tax, and Capital Expenditure statements',
    icon: 'assessment',
    path: '/reports/gst',
    color: 'bg-blue-500',
  },
  // More reports can be added here in the future
]

export default function Reports() {
  return (
    <Layout title="Reports" subtitle="View and export business reports">
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {reports.map((report) => (
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

          {reports.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">assessment</span>
              <p className="text-slate-500 dark:text-slate-400">No reports available</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

