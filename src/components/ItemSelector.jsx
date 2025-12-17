import { useState, useRef, useEffect } from 'react'
import { useData } from '../context/DataContext'

export default function ItemSelector({ onSelect, onClose }) {
  const { items, categories, addItem } = useData()
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    rate: '',
    categoryId: '',
    status: 'active'
  })
  const searchRef = useRef(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const filteredItems = items.filter(item => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return item.name.toLowerCase().includes(searchLower) || 
           item.description.toLowerCase().includes(searchLower) ||
           item.categoryName?.toLowerCase().includes(searchLower)
  })

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  const handleSelectItem = (item) => {
    onSelect({
      name: item.name,
      description: item.description,
      quantity: 1,
      price: item.rate,
      discount: 0,
      tax: 10,
      itemId: item.id,
      categoryId: item.categoryId
    })
    onClose()
  }

  const handleCreateAndAdd = () => {
    if (!newItem.name || !newItem.rate) return
    
    const createdItem = addItem({
      ...newItem,
      rate: parseFloat(newItem.rate) || 0,
      categoryId: parseInt(newItem.categoryId) || null
    })
    
    onSelect({
      name: createdItem.name,
      description: createdItem.description,
      quantity: 1,
      price: createdItem.rate,
      discount: 0,
      tax: 10,
      itemId: createdItem.id,
      categoryId: createdItem.categoryId
    })
    onClose()
  }

  const handleCreateNew = () => {
    setNewItem({ ...newItem, name: search })
    setShowCreateForm(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {showCreateForm ? 'Create New Item' : 'Add Line Item'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {!showCreateForm ? (
          <>
            {/* Search */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items by name, description, category..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredItems.length > 0 ? (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                      >
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</h3>
                          <span 
                            className="shrink-0 px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${getCategoryColor(item.categoryId)}15`,
                              color: getCategoryColor(item.categoryId)
                            }}
                          >
                            {item.categoryName}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 dark:text-white">${item.rate}</p>
                        <p className="text-xs text-slate-400">/hour</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">add_circle</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">inventory_2</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-4">
                    {search ? `No items found for "${search}"` : 'No items available'}
                  </p>
                </div>
              )}
            </div>

            {/* Create New Item Button */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-primary/40 text-primary font-semibold hover:bg-primary/10 hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                Create New Item {search && `"${search}"`}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Create Item Form */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Item Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., UI/UX Design"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 px-4"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Brief description of the item..."
                    rows="3"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary p-4 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rate *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        value={newItem.rate}
                        onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 pl-8 pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/hour</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                    <select
                      value={newItem.categoryId}
                      onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary h-12 px-4"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview Card */}
                {newItem.name && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: newItem.categoryId ? getCategoryColor(parseInt(newItem.categoryId)) : '#6B7280' }}
                      >
                        {newItem.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{newItem.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{newItem.description || 'No description'}</p>
                      </div>
                      {newItem.rate && (
                        <p className="font-bold text-primary">${parseFloat(newItem.rate).toLocaleString()}/hr</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Search
              </button>
              <button
                onClick={handleCreateAndAdd}
                disabled={!newItem.name || !newItem.rate}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Create & Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

