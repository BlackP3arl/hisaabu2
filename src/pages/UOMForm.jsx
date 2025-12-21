import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import Sidebar from '../components/Sidebar'

export default function UOMForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getUom, createUom, updateUom, loading } = useData()
  const [uom, setUom] = useState(null)
  const [formError, setFormError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
  })

  // Load UOM data if editing
  useEffect(() => {
    if (id) {
      const loadUom = async () => {
        try {
          const uomData = await getUom(parseInt(id))
          if (uomData) {
            setUom(uomData)
            setFormData({
              name: uomData.name || '',
              code: uomData.code || '',
            })
          }
        } catch (err) {
          setFormError('Failed to load UOM data')
        }
      }
      loadUom()
    }
  }, [id, getUom])

  const handleSave = async () => {
    setFormError(null)
    try {
      if (id) {
        await updateUom(parseInt(id), formData)
      } else {
        await createUom(formData)
      }
      navigate('/uoms')
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save UOM')
    }
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-24 lg:pb-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/uoms" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{id ? 'Edit UOM' : 'New UOM'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{id ? 'Update UOM details' : 'Create a new unit of measure'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/uoms" className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </Link>
            <button 
              onClick={handleSave} 
              disabled={loading.uom}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.uom ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save UOM
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-200 dark:border-gray-800">
          <Link to="/uoms" className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </Link>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {id ? 'Edit UOM' : 'New UOM'}
          </h2>
          <button onClick={handleSave} className="flex items-center justify-end px-2">
            <p className="text-primary text-base font-bold leading-normal tracking-wide shrink-0">Save</p>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8">
          {formError && (
            <div className="max-w-2xl mx-auto mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{formError}</p>
            </div>
          )}
          {id && loading.uom && !uom && (
            <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">sync</span>
                <p className="text-slate-500 dark:text-slate-400">Loading UOM data...</p>
              </div>
            </div>
          )}
          {(!id || uom) && (
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl transition-colors">
                      {formData.code || 'UOM'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {formData.name || 'UOM Name'}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Code: {formData.code || 'CODE'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">straighten</span>
                  UOM Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">UOM Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Pieces, Kilograms, Hours"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">UOM Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., PC, KG, HR"
                      maxLength={50}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:border-primary focus:ring-primary h-11 px-3 font-mono"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Short code (will be converted to uppercase)</p>
                  </div>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:flex justify-end gap-3">
                <Link to="/uoms" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </Link>
                <button 
                  onClick={handleSave} 
                  disabled={loading.uom}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.uom ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Save UOM
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
            <Link to="/uoms" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3 text-gray-700 dark:text-gray-200 font-semibold shadow-sm">
              Cancel
            </Link>
            <button 
              onClick={handleSave} 
              disabled={loading.uom}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-transform hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.uom ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save UOM
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

