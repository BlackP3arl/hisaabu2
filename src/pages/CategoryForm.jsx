import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'

const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Rose', value: '#F43F5E' },
]

export default function CategoryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, addCategory, updateCategory } = useData()
  const category = id ? categories.find(c => c.id === parseInt(id)) : null

  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#3B82F6',
  })

  const handleSave = () => {
    if (id) {
      updateCategory(parseInt(id), formData)
    } else {
      addCategory(formData)
    }
    navigate('/categories')
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-24 lg:pb-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/categories" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Category' : 'New Category'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{id ? 'Update category details' : 'Create a new item category'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/categories" className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </Link>
            <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold">
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Category
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/categories" className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {id ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={handleSave} className="flex items-center justify-end px-2">
            <p className="text-primary text-base font-bold leading-normal tracking-wide shrink-0">Save</p>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                <div 
                  className="h-3 transition-colors"
                  style={{ backgroundColor: formData.color }}
                ></div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl transition-colors"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {formData.name || 'Category Name'}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {formData.description || 'Category description will appear here'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">category</span>
                  Category Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Design Services"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this category..."
                      rows="3"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary p-3 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">palette</span>
                  Category Color
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`relative h-12 rounded-lg transition-all ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {formData.color === color.value && (
                        <span className="material-symbols-outlined text-white absolute inset-0 flex items-center justify-center text-[20px]">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Color:</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{formData.color}</span>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex justify-end gap-3">
                <Link to="/categories" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </Link>
                <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold">
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-4 py-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Link to="/categories" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm">
              Cancel
            </Link>
            <button onClick={handleSave} className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-transform hover:bg-blue-700">
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Category
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

