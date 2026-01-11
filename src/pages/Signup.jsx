import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { handleApiError, getValidationErrors } from '../utils/errorHandler'
import { setAuth } from '../utils/auth'

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const { data } = await apiClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })

      if (data.success && data.data) {
        // Store tokens and user data
        setAuth(
          data.data.token,
          data.data.refreshToken,
          data.data.user
        )
        
        // Auto-login after successful registration
        navigate('/')
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      if (typeof errorMessage === 'object' && errorMessage.details) {
        setValidationErrors(errorMessage.details)
        setError(errorMessage.message)
      } else {
        setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-3xl">inventory_2</span>
            </div>
            <span className="text-2xl font-bold text-white">Hisaabu</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Start your free trial today
          </h1>
          <p className="text-lg text-purple-100">
            Join thousands of businesses that use Hisaabu to streamline their invoicing and quotation management.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="material-symbols-outlined text-white text-2xl mb-2">receipt_long</span>
              <p className="text-white font-semibold">Unlimited Invoices</p>
              <p className="text-purple-200 text-sm">Create as many as you need</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <span className="material-symbols-outlined text-white text-2xl mb-2">request_quote</span>
              <p className="text-white font-semibold">Quick Quotations</p>
              <p className="text-purple-200 text-sm">Convert to invoices instantly</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-8 text-purple-100 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center px-0 pt-4 pb-2 justify-between">
            <Link to="/login" className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-start opacity-80 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
            </div>
            <div className="w-12"></div>
          </div>

          <div className="pt-4 lg:pt-0">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight text-center lg:text-left pb-2">
              Create your account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center lg:text-left pb-6">
              Start managing your quotes and invoices in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-2">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                {Object.keys(validationErrors).length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {Object.entries(validationErrors).map(([field, errors]) => (
                      <li key={field} className="text-red-700 dark:text-red-300">
                        {Array.isArray(errors) ? errors.join(', ') : errors}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Social Signup Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement Google signup
                  console.log('Google signup clicked')
                }}
                disabled={loading}
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // TODO: Implement Apple signup
                  console.log('Apple signup clicked')
                }}
                disabled={loading}
                className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium tracking-wider">Or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col w-full sm:col-span-2 lg:col-span-1">
                <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                  <input
                    className={`w-full rounded-xl text-slate-900 dark:text-white border bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-4 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${
                      validationErrors.name ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="John Doe"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{Array.isArray(validationErrors.name) ? validationErrors.name[0] : validationErrors.name}</p>
                )}
              </div>

              <div className="flex flex-col w-full sm:col-span-2 lg:col-span-1">
                <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input
                    className={`w-full rounded-xl text-slate-900 dark:text-white border bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-4 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${
                      validationErrors.email ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="john@example.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{Array.isArray(validationErrors.email) ? validationErrors.email[0] : validationErrors.email}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Password</label>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  className={`w-full rounded-xl text-slate-900 dark:text-white border bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-12 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${
                    validationErrors.password ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  placeholder="Min. 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-primary flex items-center justify-center transition-colors"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{Array.isArray(validationErrors.password) ? validationErrors.password[0] : validationErrors.password}</p>
              )}
            </div>

            <div className="flex flex-col w-full">
              <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Confirm Password</label>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  className={`w-full rounded-xl text-slate-900 dark:text-white border bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-12 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${
                    validationErrors.confirmPassword || (formData.password !== formData.confirmPassword && formData.confirmPassword) ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  placeholder="Re-enter password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-primary flex items-center justify-center transition-colors"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {(validationErrors.confirmPassword || (formData.password !== formData.confirmPassword && formData.confirmPassword)) && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                  {validationErrors.confirmPassword ? (Array.isArray(validationErrors.confirmPassword) ? validationErrors.confirmPassword[0] : validationErrors.confirmPassword) : 'Passwords do not match'}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" id="terms" className="mt-1 rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="terms" className="text-sm text-slate-500 dark:text-slate-400">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl h-12 px-4 bg-primary text-white text-base font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="py-6 text-center border-t border-slate-200 dark:border-slate-800 mt-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
