import { useState } from 'react'

export default function ShareLinkModal({ isOpen, onClose, onGenerate, documentType, documentId, loading }) {
  const [linkType, setLinkType] = useState('passwordless') // 'passwordless' or 'password'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [generatedLink, setGeneratedLink] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setError('')
    
    if (linkType === 'password') {
      if (!password || password.length < 4) {
        setError('Password must be at least 4 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    try {
      const options = linkType === 'password' ? { password } : {}
      const shareLink = await onGenerate(documentType, documentId, options)
      
      if (shareLink) {
        const shareUrl = `${window.location.origin}/share/${documentType}/${shareLink.token}`
        setGeneratedLink(shareUrl)
      }
    } catch (err) {
      setError(err.message || 'Failed to generate share link')
    }
  }

  const handleCopyLink = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = generatedLink
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      }
    }
  }

  const handleClose = () => {
    setLinkType('passwordless')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setGeneratedLink(null)
    setLinkCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Generate Share Link
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!generatedLink ? (
            <>
              {/* Link Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Choose link type
                </label>
                <div className="space-y-3">
                  {/* Passwordless Option */}
                  <button
                    onClick={() => {
                      setLinkType('passwordless')
                      setError('')
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      linkType === 'passwordless'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        linkType === 'passwordless'
                          ? 'border-primary bg-primary'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {linkType === 'passwordless' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-primary text-xl">link</span>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Passwordless Magic Link</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Generate a secure link that works immediately. No password required.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Password Protected Option */}
                  <button
                    onClick={() => {
                      setLinkType('password')
                      setError('')
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      linkType === 'password'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        linkType === 'password'
                          ? 'border-primary bg-primary'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {linkType === 'password' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-primary text-xl">lock</span>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Password Protected</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Add an extra layer of security with a password. Customers will need to enter it to view.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password Input (if password type selected) */}
              {linkType === 'password' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">key</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 pl-12 pr-4 transition-all"
                        placeholder="Enter password (min 4 characters)"
                        minLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">key</span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 pl-12 pr-4 transition-all"
                        placeholder="Confirm password"
                        minLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-800 dark:text-red-200 text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || (linkType === 'password' && (!password || !confirmPassword))}
                className="w-full rounded-xl bg-primary py-3.5 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">link</span>
                    Generate Link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Generated Link Display */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">link</span>
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white min-w-0 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors shrink-0 ${
                      linkCopied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-primary text-white hover:bg-blue-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {linkCopied ? 'check_circle' : 'content_copy'}
                    </span>
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {linkType === 'password' 
                    ? 'Share this link with your customer. They will need the password to view the document.'
                    : 'Share this link with your customer. They can view and respond immediately.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGeneratedLink(null)
                    setLinkType('passwordless')
                    setPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl bg-primary py-3 text-white font-semibold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

