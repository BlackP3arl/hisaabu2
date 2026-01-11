import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { formatCurrency } from '../utils/currency'
import { getQuarterDates, getCurrentQuarter, getCurrentYear, getYearOptions, formatDateRange } from '../utils/quarter'

export default function InputTaxCapitalExpenditure() {
  const { invoices, loading, fetchInvoices, companySettings } = useData()
  const [quarter, setQuarter] = useState(getCurrentQuarter())
  const [year, setYear] = useState(getCurrentYear())
  const [dateRange, setDateRange] = useState(() => {
    const currentQuarter = getCurrentQuarter()
    const currentYear = getCurrentYear()
    return getQuarterDates(currentQuarter, currentYear)
  })
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [taxSummary, setTaxSummary] = useState({
    totalSales: 0,
    totalTax: 0,
    totalAmount: 0,
  })

  const yearOptions = getYearOptions(5)

  useEffect(() => {
    fetchInvoices({ page: 1, limit: 1000 })
  }, [fetchInvoices])

  // Update date range when quarter or year changes
  useEffect(() => {
    const dates = getQuarterDates(quarter, year)
    setDateRange(dates)
  }, [quarter, year])

  useEffect(() => {
    if (invoices.length > 0) {
      const filtered = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.issueDate || invoice.date)
        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)
        endDate.setHours(23, 59, 59, 999)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })

      setFilteredInvoices(filtered)

      // Calculate tax summary
      let totalSales = 0
      let totalTax = 0

      filtered.forEach((invoice) => {
        const invoiceTotal = invoice.totalAmount || invoice.amount || 0
        const taxTotal = invoice.taxTotal || 0
        
        totalSales += invoiceTotal - taxTotal
        totalTax += taxTotal
      })

      setTaxSummary({
        totalSales,
        totalTax,
        totalAmount: totalSales + totalTax,
      })
    }
  }, [invoices, dateRange])

  const handleExport = () => {
    // TODO: Implement CSV/PDF export functionality
    alert('Export functionality will be implemented soon')
  }

  const documentCurrency = companySettings?.currency || 'MVR'

  return (
    <Layout 
      title="Input Tax In Relation to Capital Expenditure" 
      subtitle="View and export Input Tax reports for capital expenditure invoices"
      actions={
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      }
    >
      <div className="p-4 lg:p-8 space-y-6">
        {/* Quarter and Year Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-11 px-3"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Quarter
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-11 px-3"
              >
                <option value={1}>Quarter 1</option>
                <option value={2}>Quarter 2</option>
                <option value={3}>Quarter 3</option>
                <option value={4}>Quarter 4</option>
              </select>
            </div>
            <div className="flex-1 lg:flex-initial">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Date Range</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDateRange(dateRange.startDate, dateRange.endDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Capital Expenditure</p>
              <span className="material-symbols-outlined text-slate-400">trending_up</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(taxSummary.totalSales, documentCurrency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {filteredInvoices.length} invoices
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Input Tax</p>
              <span className="material-symbols-outlined text-slate-400">receipt_long</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(taxSummary.totalTax, documentCurrency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tax on capital expenditure
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
              <span className="material-symbols-outlined text-slate-400">account_balance_wallet</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(taxSummary.totalAmount, documentCurrency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Including tax
            </p>
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Capital Expenditure Invoice Details</h3>
          </div>

          {loading.invoices ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
              <p className="text-slate-500 dark:text-slate-400">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">receipt_long</span>
              <p className="text-slate-500 dark:text-slate-400">No invoices found for the selected date range</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Invoice #</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Client</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Subtotal</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Input Tax</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInvoices.map((invoice) => {
                      const invoiceTotal = invoice.totalAmount || invoice.amount || 0
                      const taxTotal = invoice.taxTotal || 0
                      const subtotal = invoiceTotal - taxTotal

                      return (
                        <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <Link
                              to={`/invoices/${invoice.id}/view`}
                              className="text-sm font-mono text-primary hover:underline"
                            >
                              {invoice.number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {new Date(invoice.issueDate || invoice.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                            {invoice.clientName || invoice.client?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                            {formatCurrency(subtotal, documentCurrency)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-primary">
                            {formatCurrency(taxTotal, documentCurrency)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(invoiceTotal, documentCurrency)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-700">
                {filteredInvoices.map((invoice) => {
                  const invoiceTotal = invoice.totalAmount || invoice.amount || 0
                  const taxTotal = invoice.taxTotal || 0
                  const subtotal = invoiceTotal - taxTotal

                  return (
                    <div key={invoice.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            to={`/invoices/${invoice.id}/view`}
                            className="text-sm font-mono font-bold text-primary hover:underline"
                          >
                            {invoice.number}
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(invoice.issueDate || invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(invoiceTotal, documentCurrency)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Client</p>
                          <p className="text-slate-900 dark:text-white font-medium">
                            {invoice.clientName || invoice.client?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400">Subtotal</p>
                          <p className="text-slate-600 dark:text-slate-300">{formatCurrency(subtotal, documentCurrency)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400">Input Tax</p>
                          <p className="text-primary font-medium">{formatCurrency(taxTotal, documentCurrency)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

