import { useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useState } from 'react'

export default function SecureShare() {
  const { type, id } = useParams()
  const { quotations, invoices, company } = useData()
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  const document = type === 'quotation' 
    ? quotations.find(q => q.id === parseInt(id))
    : invoices.find(i => i.id === parseInt(id))

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">description</span>
          <p className="text-slate-500 dark:text-slate-400 mt-4">Document not found</p>
        </div>
      </div>
    )
  }

  const handleAuth = (e) => {
    e.preventDefault()
    if (password === 'demo123') {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  const getStatusStyles = (status) => {
    const styles = {
      paid: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      accepted: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      expired: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      draft: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    }
    return styles[status] || styles.draft
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Company Branding */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Secure Document Portal</p>
          </div>

          {/* Password Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">lock</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Protected Document</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter the password to view this {type === 'quotation' ? 'quotation' : 'invoice'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">key</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 pl-12 pr-4 transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
              >
                View Document
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-6">
              Demo password: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">demo123</span>
            </p>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            Powered by <span className="font-semibold">Hisaabu</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{company.name}</h1>
        </div>

        {/* Document Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Document Header */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">
                  {type === 'quotation' ? 'Quotation' : 'Invoice'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{document.number}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{document.clientName}</p>
              </div>
              <span className={`self-start px-4 py-1.5 rounded-full text-xs font-bold uppercase ${getStatusStyles(document.status)}`}>
                {document.status}
              </span>
            </div>
          </div>

          {/* Document Body */}
          <div className="p-6 sm:p-8">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">From</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{company.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{company.address}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">To</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{document.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Date</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {new Date(document.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                  {type === 'quotation' ? 'Valid Until' : 'Due Date'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {new Date(type === 'quotation' ? document.expiry : document.due).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">Professional Services</p>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900 dark:text-white">
                      ${document.amount.toLocaleString()}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">${document.amount.toLocaleString()}.00</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-3.5 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Download PDF
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {type === 'quotation' ? 'Accept Quotation' : 'Acknowledge Receipt'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-6">
          This document was shared securely via <span className="font-semibold">Hisaabu</span>
        </p>
      </div>
    </div>
  )
}
