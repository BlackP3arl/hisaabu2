import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/login')
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col w-full sm:col-span-2 lg:col-span-1">
                <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                  <input
                    className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-4 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="John Doe"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col w-full sm:col-span-2 lg:col-span-1">
                <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input
                    className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-4 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="john@example.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Password</label>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-12 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Min. 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-primary flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">Confirm Password</label>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 pl-11 pr-12 text-base focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Re-enter password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-slate-400 hover:text-primary flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" id="terms" className="mt-1 rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="terms" className="text-sm text-slate-500 dark:text-slate-400">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl h-12 px-4 bg-primary text-white text-base font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 mt-2"
            >
              Create Account
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
