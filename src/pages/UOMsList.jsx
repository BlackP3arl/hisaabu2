import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'

export default function UOMsList() {
  const { uoms, loading, fetchUoms, deleteUom } = useData()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Load UOMs on mount
  useEffect(() => {
    fetchUoms()
  }, [fetchUoms])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this UOM?')) {
      try {
        await deleteUom(id)
        fetchUoms()
      } catch (err) {
        console.error('Failed to delete UOM:', err)
      }
    }
  }

  const filteredUoms = uoms.filter(uom => {
    return !debouncedSearch || 
      uom.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      uom.code.toLowerCase().includes(debouncedSearch.toLowerCase())
  })

  const headerActions = (
    <Link 
      to="/uoms/new"
      className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span className="hidden sm:inline">New UOM</span>
    </Link>
  )

  return (
    <Layout 
      title="Units of Measure" 
      subtitle={`${filteredUoms.length} Total UOMs`}
      actions={headerActions}
    >
      {/* Search */}
      <div className="px-4 lg:px-8 py-4 bg-background-light dark:bg-background-dark lg:bg-white lg:dark:bg-slate-900 lg:border-b lg:border-slate-200 lg:dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 lg:py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
              placeholder="Search UOMs by name or code..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Link 
            to="/items"
            className="hidden lg:flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Back to Items
          </Link>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block px-8 py-6">
        {loading.uoms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUoms.map((uom) => (
                <div 
                  key={uom.id} 
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                          {uom.code || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{uom.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Code: {uom.code}</p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Link
                          to={`/uoms/${uom.id}`}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </Link>
                        {uom.id !== 1 && (
                          <button
                            onClick={() => handleDelete(uom.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredUoms.length === 0 && !loading.uoms && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">straighten</span>
                <p className="text-slate-500 dark:text-slate-400">No UOMs found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden px-4 py-4 space-y-3">
        {/* Back to Items Link for Mobile */}
        <Link 
          to="/items"
          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            <span className="font-medium text-slate-900 dark:text-white">Back to Items</span>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </Link>

        {loading.uoms ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredUoms.map((uom) => (
              <div 
                key={uom.id} 
                className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                        {uom.code || '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{uom.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Code: {uom.code}</p>
                      </div>
                    </div>
                    {uom.id !== 1 && (
                      <Link to={`/uoms/${uom.id}`} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-2">
                        <span className="material-symbols-outlined">edit</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredUoms.length === 0 && !loading.uoms && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">straighten</span>
                <p className="text-slate-500 dark:text-slate-400">No UOMs found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <Link 
        to="/uoms/new"
        className="lg:hidden fixed z-30 bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </Layout>
  )
}

