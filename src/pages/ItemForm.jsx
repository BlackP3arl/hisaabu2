import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'

export default function ItemForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getItem, createItem, updateItem, fetchCategories, categories, loading } = useData()
  const [item, setItem] = useState(null)
  const [formError, setFormError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate: '',
    categoryId: '',
    status: 'active',
    gstApplicable: true,
  })

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Load item data if editing
  useEffect(() => {
    if (id) {
      const loadItem = async () => {
        try {
          const itemData = await getItem(parseInt(id))
          if (itemData) {
            setItem(itemData)
            setFormData({
              name: itemData.name || '',
              description: itemData.description || '',
              rate: itemData.rate || '',
              categoryId: itemData.categoryId || '',
              status: itemData.status || 'active',
              gstApplicable: itemData.gstApplicable !== false, // Default to true if not set
            })
          }
        } catch (err) {
          setFormError('Failed to load item data')
        }
      }
      loadItem()
    }
  }, [id, getItem])

  const handleSave = async () => {
    setFormError(null)
    const data = {
      ...formData,
      rate: parseFloat(formData.rate) || 0,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
    }
    try {
      if (id) {
        await updateItem(parseInt(id), data)
      } else {
        await createItem(data)
      }
      navigate('/items')
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save item')
    }
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId))
    return category?.color || '#6B7280'
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-24 lg:pb-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/items" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Item' : 'New Item'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{id ? `ITM-${String(id).padStart(4, '0')}` : 'Add a new service or product'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/items" className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </Link>
            <button 
              onClick={handleSave} 
              disabled={loading.item}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.item ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Item
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/items" className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {id ? 'Edit Item' : 'New Item'}
          </h2>
          <button onClick={handleSave} className="flex items-center justify-end px-2">
            <p className="text-primary text-base font-bold leading-normal tracking-wide shrink-0">Save</p>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8">
          {formError && (
            <div className="max-w-3xl mx-auto mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
            </div>
          )}
          {id && loading.item && !item && (
            <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
                <p className="text-slate-500 dark:text-slate-400">Loading item data...</p>
              </div>
            </div>
          )}
          {(!id || item) && (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Item Preview Card */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl transition-colors"
                    style={{ backgroundColor: formData.categoryId ? getCategoryColor(formData.categoryId) : '#6B7280' }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'I'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {formData.name || 'Item Name'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {formData.description || 'Item description will appear here'}
                    </p>
                  </div>
                  {formData.rate && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${parseFloat(formData.rate).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">/piece</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">inventory_2</span>
                  Item Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Item Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., UI/UX Design"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the service or product..."
                      rows="4"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Category */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  Pricing & Category
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 pl-8 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/piece</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {formData.categoryId && (
                      <div className="mt-2 flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(formData.categoryId) }}
                        ></span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {categories.find(c => c.id === parseInt(formData.categoryId))?.description}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">GST Applicable</label>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.gstApplicable}
                          onChange={(e) => setFormData({ ...formData, gstApplicable: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {formData.gstApplicable ? 'GST will be applied' : 'GST will not be applied'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Apply default GST when this item is added to invoices/quotations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex lg:col-span-2 justify-end gap-3">
                <Link to="/items" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </Link>
                <button 
                  onClick={handleSave} 
                  disabled={loading.item}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.item ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Save Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link to="/items" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm">
              Cancel
            </Link>
            <button 
              onClick={handleSave} 
              disabled={loading.item}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-transform hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.item ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Item
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


