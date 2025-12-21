import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function ItemsList() {
  const { items, categories, loading, pagination, fetchItems, fetchCategories, deleteItem } = useData()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch items when filters change
  useEffect(() => {
    const params = {
      page,
      limit: 20,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(categoryFilter !== 'all' && { categoryId: parseInt(categoryFilter) })
    }
    fetchItems(params)
  }, [page, debouncedSearch, categoryFilter, fetchItems])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id)
        // Refresh list
        const params = {
          page,
          limit: 20,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(categoryFilter !== 'all' && { categoryId: parseInt(categoryFilter) })
        }
        fetchItems(params)
      } catch (err) {
        console.error('Failed to delete item:', err)
      }
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-300 ring-green-600/20',
      inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-500/10',
    }
    return badges[status] || badges.active
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  const headerActions = (
    <Link 
      to="/items/new"
      className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span className="hidden sm:inline">New Item</span>
    </Link>
  )

  const itemsPagination = pagination?.items || {}

  return (
    <Layout 
      title="Items" 
      subtitle={`${itemsPagination.total || items.length} Total Items`}
      actions={headerActions}
    >
      {/* Search & Filters */}
      <div className="px-4 lg:px-8 py-4 space-y-4 bg-background-light dark:bg-background-dark lg:bg-white lg:dark:bg-slate-900 lg:border-b lg:border-slate-200 lg:dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 lg:py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
              placeholder="Search items by name, description..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/categories"
              className="hidden lg:flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">category</span>
              Manage Categories
            </Link>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block px-8 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading.items ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                          >
                            {item.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: ITM-{String(item.id).padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ 
                            backgroundColor: `${getCategoryColor(item.categoryId)}15`,
                            color: getCategoryColor(item.categoryId)
                          }}
                        >
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                          ></span>
                          {item.categoryName || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">${item.rate?.toLocaleString() || '0'}</span>
                        <span className="text-xs text-slate-400 ml-1">/{item.uomCode || 'PC'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ring-1 ring-inset ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/items/${item.id}`}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {items.length === 0 && !loading.items && (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">inventory_2</span>
                  <p className="text-slate-500 dark:text-slate-400">No items found</p>
                </div>
              )}

              {/* Pagination */}
              {itemsPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {((itemsPagination.page - 1) * itemsPagination.limit) + 1} to {Math.min(itemsPagination.page * itemsPagination.limit, itemsPagination.total)} of {itemsPagination.total}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!itemsPagination.hasPrev || loading.items}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(itemsPagination.totalPages, p + 1))}
                      disabled={!itemsPagination.hasNext || loading.items}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-3">
        {/* Categories Link for Mobile */}
        <Link 
          to="/categories"
          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">category</span>
            <span className="font-medium text-slate-900 dark:text-white">Manage Categories</span>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </Link>

        {loading.items ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} className="group bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div 
                      className="shrink-0 h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                    >
                      {item.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{item.name}</h3>
                        <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getStatusBadge(item.status)}`}>
                          {item.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.description || 'No description'}</p>
                    </div>
                  </div>
                  <Link to={`/items/${item.id}`} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-2">
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getCategoryColor(item.categoryId)}15`,
                      color: getCategoryColor(item.categoryId)
                    }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                    ></span>
                    {item.categoryName || 'Uncategorized'}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">${item.rate || '0'}</span>
                    <span className="text-xs text-slate-400">/{item.uomCode || 'PC'}</span>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && !loading.items && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">inventory_2</span>
                <p className="text-slate-500 dark:text-slate-400">No items found</p>
              </div>
            )}

            {/* Mobile Pagination */}
            {itemsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!itemsPagination.hasPrev || loading.items}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {itemsPagination.page} of {itemsPagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(itemsPagination.totalPages, p + 1))}
                  disabled={!itemsPagination.hasNext || loading.items}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <Link 
        to="/items/new"
        className="lg:hidden fixed z-30 bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </Layout>
  )
}
