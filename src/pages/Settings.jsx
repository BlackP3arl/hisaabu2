import { useState } from 'react'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function Settings() {
  const { company, settings } = useData()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: 'business' },
    { id: 'tax', label: 'Tax & Finance', icon: 'calculate' },
    { id: 'invoice', label: 'Invoice Config', icon: 'receipt_long' },
    { id: 'users', label: 'Users & Access', icon: 'group' },
  ]

  return (
    <Layout title="Settings" subtitle="Manage your account settings">
      <div className="flex flex-col lg:flex-row">
        {/* Desktop Sidebar Tabs */}
        <div className="hidden lg:block w-64 p-6 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-2xl">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Company Information</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-400">business</span>
                      </div>
                      <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                        Upload Logo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                      <input
                        type="text"
                        defaultValue={company.name}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={company.email}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        defaultValue={company.phone}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GST/TIN Number</label>
                      <input
                        type="text"
                        defaultValue={company.gst}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Registered Address</label>
                      <textarea
                        defaultValue={company.address}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3"
                        rows="2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping Address</label>
                      <textarea
                        defaultValue={company.shippingAddress}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Registration Number</label>
                      <input
                        type="text"
                        defaultValue={company.registration}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                  </div>
                </div>

                <button className="w-full lg:w-auto px-6 rounded-lg bg-primary py-3 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'tax' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tax Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Tax Rate (%)</label>
                      <input
                        type="number"
                        defaultValue={settings.defaultTax}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                      <select className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3">
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Enable Tax per Item</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Allow different tax rates for individual items</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                      </button>
                    </div>
                  </div>
                </div>

                <button className="w-full lg:w-auto px-6 rounded-lg bg-primary py-3 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Invoice Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Prefix</label>
                      <input
                        type="text"
                        defaultValue={settings.invoicePrefix}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quotation Prefix</label>
                      <input
                        type="text"
                        defaultValue={settings.quotationPrefix}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                      <select className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Terms (Days)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms & Conditions Template</label>
                      <textarea
                        defaultValue={settings.terms}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3"
                        rows="4"
                      />
                    </div>
                  </div>
                </div>

                <button className="w-full lg:w-auto px-6 rounded-lg bg-primary py-3 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Members</h3>
                    <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add User
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                          AM
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Alex Morgan</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">alex@company.com</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">Admin</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                          JS
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">John Smith</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">john@company.com</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full">Staff</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
