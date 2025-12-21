import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../api/client'
import { handleApiError } from '../utils/errorHandler'
import { setAuth } from '../utils/auth'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data } = await apiClient.post('/auth/login', {
        email,
        password
      })

      if (data.success && data.data) {
        // Store tokens and user data
        setAuth(
          data.data.token,
          data.data.refreshToken,
          data.data.user
        )
        
        // Call onLogin callback if provided
        if (onLogin) {
          onLogin()
        }
        
        // Redirect to dashboard
        navigate('/')
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(typeof errorMessage === 'string' ? errorMessage : errorMessage.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
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
            Manage your invoices & quotations with ease
          </h1>
          <p className="text-lg text-blue-100">
            Create professional invoices, track payments, and grow your business with our powerful management tools.
          </p>
          
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              {['J', 'A', 'M', 'K'].map((letter, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/90 border-2 border-white flex items-center justify-center text-primary font-bold text-sm shadow-lg">
                  {letter}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white font-semibold">10,000+ businesses</p>
              <p className="text-blue-200 text-sm">trust Hisaabu</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-8 text-blue-100 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Free 14-day trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>No credit card required</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center justify-center pt-8 pb-6">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">inventory_2</span>
            </div>
          </div>
          
          <div className="text-center lg:text-left">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight pb-2">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">Sign in to manage your invoices and quotes.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-2">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <label className="flex flex-col w-full">
              <p className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Email Address</p>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-12 pl-11 pr-4 placeholder:text-slate-400 text-base transition-all disabled:opacity-50"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </label>

            <label className="flex flex-col w-full">
              <div className="flex justify-between items-center pb-2">
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium leading-normal">Password</p>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-12 pl-11 pr-12 placeholder:text-slate-400 text-base transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <a href="#" className="text-sm font-medium text-primary hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Forgot Password?</a>
              </div>
            </label>

            <div className="flex flex-col gap-4 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-primary py-3.5 px-4 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>
              
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button type="button" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-xl">face</span>
                  Face ID
                </button>
                <button type="button" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-xl">fingerprint</span>
                  Touch ID
                </button>
              </div>
            </div>
          </form>

          <div className="py-6 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
