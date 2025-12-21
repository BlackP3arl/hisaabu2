import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'
import { handleApiError } from '../utils/errorHandler'

export default function Settings() {
  const { companySettings, loading, fetchCompanySettings, updateCompanySettings, uploadCompanyLogo, taxes, fetchTaxes, createTax, updateTax, deleteTax } = useData()
  const [activeTab, setActiveTab] = useState('profile')
  const [showTaxForm, setShowTaxForm] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const [taxFormData, setTaxFormData] = useState({ name: '', rate: 0, isDefault: false })
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    shippingAddress: '',
    gst: '',
    registration: '',
    defaultTax: 0,
    currency: 'MVR',
    invoicePrefix: 'INV',
    quotationPrefix: 'QUO',
    dateFormat: 'MM/DD/YYYY',
    paymentTerms: 30,
    terms: '',
    enableTaxPerItem: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchCompanySettings()
    fetchTaxes()
  }, [fetchCompanySettings, fetchTaxes])

  useEffect(() => {
    if (companySettings) {
      setFormData({
        companyName: companySettings.companyName || '',
        email: companySettings.email || '',
        phone: companySettings.phone || '',
        address: companySettings.registeredAddress || '',
        shippingAddress: companySettings.shippingAddress || '',
        gst: companySettings.gstNumber || '',
        registration: companySettings.registrationNumber || '',
        defaultTaxId: companySettings.defaultTaxId || null,
        currency: companySettings.currency || 'MVR',
        invoicePrefix: companySettings.invoicePrefix || 'INV',
        quotationPrefix: companySettings.quotationPrefix || 'QUO',
        dateFormat: companySettings.dateFormat || 'MM/DD/YYYY',
        paymentTerms: companySettings.paymentTerms || 30,
        terms: companySettings.termsTemplate || '',
        enableTaxPerItem: companySettings.taxPerItemEnabled || false,
      })
    }
  }, [companySettings])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      // Transform formData to match backend API expectations
      const apiData = {
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        registeredAddress: formData.address,
        shippingAddress: formData.shippingAddress,
        gstNumber: formData.gst,
        registrationNumber: formData.registration,
        defaultTaxId: formData.defaultTaxId,
        currency: formData.currency,
        invoicePrefix: formData.invoicePrefix,
        quotationPrefix: formData.quotationPrefix,
        dateFormat: formData.dateFormat,
        termsTemplate: formData.terms,
        taxPerItemEnabled: formData.enableTaxPerItem,
      }
      await updateCompanySettings(apiData)
      // Refresh settings from server to ensure we have the latest data
      await fetchCompanySettings()
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    setError(null)
    try {
      await uploadCompanyLogo(file)
      setSuccess('Logo uploaded successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

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
            {(error || success) && (
              <div className={`mb-4 rounded-xl p-4 text-sm ${
                error ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' :
                'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}>
                {typeof error === 'object' && error !== null ? error.message : error || success}
              </div>
            )}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Company Information</h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                        {companySettings?.logoUrl ? (
                          <img src={companySettings.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-slate-400">business</span>
                        )}
                      </div>
                      <label className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        Upload Logo
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GST/TIN Number</label>
                      <input
                        type="text"
                        value={formData.gst}
                        onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Registered Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3"
                        rows="2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping Address</label>
                      <textarea
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={formData.registration}
                        onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving || loading.settings}
                  className="w-full lg:w-auto px-6 rounded-lg bg-primary py-3 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving || loading.settings ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}

            {activeTab === 'tax' && (
              <div className="space-y-6">
                {/* Default Tax Selection */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Default Tax</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Tax</label>
                      <select 
                        value={formData.defaultTaxId || ''}
                        onChange={(e) => setFormData({ ...formData, defaultTaxId: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      >
                        <option value="">Select Default Tax</option>
                        {taxes.map(tax => (
                          <option key={tax.id} value={tax.id}>
                            {tax.name} ({tax.rate}%)
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        GST is applied at line item level. Other taxes are applied at document level.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                      <select 
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      >
                        <option value="MVR">MVR - Maldivian Rufiyaa</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tax Management */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tax Definitions</h3>
                    <button
                      onClick={() => {
                        setEditingTax(null)
                        setTaxFormData({ name: '', rate: 0, isDefault: false })
                        setShowTaxForm(true)
                      }}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Tax
                    </button>
                  </div>

                  {/* Tax Form */}
                  {showTaxForm && (
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-4">
                        {editingTax ? 'Edit Tax' : 'Add New Tax'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Name</label>
                          <input
                            type="text"
                            value={taxFormData.name}
                            onChange={(e) => setTaxFormData({ ...taxFormData, name: e.target.value })}
                            placeholder="e.g., GST, VAT, Service Tax"
                            className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={taxFormData.rate || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              setTaxFormData({ ...taxFormData, rate: isNaN(value) ? 0 : value });
                            }}
                            className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Set as Default</label>
                            <button 
                              onClick={() => setTaxFormData({ ...taxFormData, isDefault: !taxFormData.isDefault })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                taxFormData.isDefault ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                taxFormData.isDefault ? 'translate-x-6' : 'translate-x-1'
                              }`}></span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  // Validate form data before submitting
                                  if (!taxFormData.name || taxFormData.name.trim() === '') {
                                    setError('Tax name is required')
                                    return
                                  }
                                  const rate = parseFloat(taxFormData.rate);
                                  if (isNaN(rate) || rate < 0 || rate > 100) {
                                    setError('Tax rate must be a valid number between 0 and 100')
                                    return
                                  }
                                  
                                  // Prepare data with proper types
                                  const taxData = {
                                    name: taxFormData.name.trim(),
                                    rate: rate,
                                    isDefault: taxFormData.isDefault || false
                                  }
                                  
                                  if (editingTax) {
                                    await updateTax(editingTax.id, taxData)
                                  } else {
                                    await createTax(taxData)
                                  }
                                  setShowTaxForm(false)
                                  setEditingTax(null)
                                  setTaxFormData({ name: '', rate: 0, isDefault: false })
                                  setError(null)
                                  setSuccess('Tax saved successfully!')
                                  setTimeout(() => setSuccess(null), 3000)
                                  await fetchTaxes()
                                } catch (err) {
                                  const errorMsg = handleApiError(err)
                                  setError(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Failed to save tax')
                                  console.error('Tax save error:', err)
                                }
                              }}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                              {editingTax ? 'Update' : 'Add'}
                            </button>
                            <button
                              onClick={() => {
                                setShowTaxForm(false)
                                setEditingTax(null)
                                setTaxFormData({ name: '', rate: 0, isDefault: false })
                              }}
                              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tax List */}
                  <div className="space-y-2">
                    {taxes.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p>No taxes defined. Add your first tax to get started.</p>
                      </div>
                    ) : (
                      taxes.map(tax => (
                        <div key={tax.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {tax.name}
                                {tax.isDefault && (
                                  <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">Default</span>
                                )}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{tax.rate}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingTax(tax)
                                setTaxFormData({ name: tax.name, rate: tax.rate, isDefault: tax.isDefault })
                                setShowTaxForm(true)
                              }}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete ${tax.name}?`)) {
                                  try {
                                    await deleteTax(tax.id)
                                    await fetchTaxes()
                                  } catch (err) {
                                    // Error handled by context
                                  }
                                }
                              }}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving || loading.settings}
                  className="w-full lg:w-auto px-6 rounded-lg bg-primary py-3 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving || loading.settings ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
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
                        value={formData.invoicePrefix}
                        onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quotation Prefix</label>
                      <input
                        type="text"
                        value={formData.quotationPrefix}
                        onChange={(e) => setFormData({ ...formData, quotationPrefix: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                      <select 
                        value={formData.dateFormat}
                        onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Terms (Days)</label>
                      <input
                        type="number"
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms & Conditions Template</label>
                      <textarea
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3"
                        rows="4"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving || loading.settings}
                  className="w-full lg:w-auto px-6 rounded-lg bg-primary py-3 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving || loading.settings ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
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
