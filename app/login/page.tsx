'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DirectionsBusIcon, EmailIcon, LockIcon, VisibilityIcon, VisibilityOffIcon, LoginIcon, AccountCircleIcon, ArrowBackIcon } from '../components/Icons'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hidePassword, setHidePassword] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TEMPORARY: Local authentication for testing
      const { email } = formData
      
      // Check if we have registered users stored
      const registeredUsersStr = localStorage.getItem('local_registered_users')
      let registeredUsers: any[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : []
      
      // Find user by email in registered users
      let mockUser = registeredUsers.find((u: any) => u.email === email)
      
      if (!mockUser) {
        // User not found in registered list, create new one (for testing, allow any login)
        mockUser = {
          id: 'local-user-' + Date.now(),
          email: email,
          user_metadata: {
            full_name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          },
          created_at: new Date().toISOString()
        }
        // Add to registered users list
        registeredUsers.push(mockUser)
        localStorage.setItem('local_registered_users', JSON.stringify(registeredUsers))
      }

      // Store current user session in localStorage
      localStorage.setItem('local_auth_user', JSON.stringify(mockUser))
      localStorage.setItem('local_auth_token', 'local-token-' + Date.now())
      localStorage.setItem('auth_token', 'local-token-' + Date.now())

      // Set a flag to indicate we just logged in (to prevent redirect back to login)
      localStorage.setItem('just_logged_in', 'true')

      // Stop loading immediately
      setLoading(false)

      // Redirect to dashboard (use window.location for full page reload to ensure Shell component loads)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError(null)
  }

  return (
    <div className="login-container flex min-h-screen bg-gray-50">
      {/* Left Side - Brand Section */}
      <div className="login-left flex-1 bg-gray-900 flex items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-60 z-0" />
        <div className="absolute inset-0 z-10" style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(15px)',
          opacity: 0.3,
          transform: 'scale(1.1)',
        }} />
        
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-20 rounded-lg text-white transition-all hover:translate-x-[-2px] no-underline"
        >
          <ArrowBackIcon className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </Link>
        
        <div className="brand-section relative z-20 text-center max-w-[500px]">
          <div className="logo-wrapper mb-8">
            <div className="logo-icon w-30 h-30 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <DirectionsBusIcon className="w-16 h-16 text-gray-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white tracking-tight">BusBuddy</h1>
          <p className="text-xs text-gray-300 mb-12 font-medium">Fleet Management System</p>
          
          <div className="features flex flex-col gap-4 text-left">
            <div className="feature-item flex items-center gap-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg transition-all hover:bg-opacity-10 hover:translate-x-1">
              <div className="feature-icon w-10 h-10 rounded-lg bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-white">Real-time GPS Tracking</span>
            </div>
            <div className="feature-item flex items-center gap-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg transition-all hover:bg-opacity-10 hover:translate-x-1">
              <div className="feature-icon w-10 h-10 rounded-lg bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
              <span className="text-base font-medium text-white">Live Video Streaming</span>
            </div>
            <div className="feature-item flex items-center gap-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg transition-all hover:bg-opacity-10 hover:translate-x-1">
              <div className="feature-icon w-10 h-10 rounded-lg bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
              <span className="text-base font-medium text-white">Comprehensive Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right flex-1 flex items-center justify-center p-12 bg-gray-50">
        <div className="login-card w-full max-w-[450px] p-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="card-header text-center mb-10">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 text-[11px]">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form flex flex-col gap-5">
            <div className="full-width">
              <label className="block text-[11px] font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EmailIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="full-width">
              <label className="block text-[11px] font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={hidePassword ? 'password' : 'text'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setHidePassword(!hidePassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {hidePassword ? (
                    <VisibilityOffIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <VisibilityIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-options flex justify-between items-center text-[11px]">
              <label className="remember-me flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="cursor-pointer" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password text-gray-900 font-semibold hover:text-gray-700 hover:underline">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="error-message flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password || formData.password.length < 6}
              className="login-button w-full py-2.5 text-xs font-semibold rounded-lg bg-gray-900 text-white border-none shadow-md mt-2 flex items-center justify-center gap-2 transition-all hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <div className="spinner w-4 h-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LoginIcon className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>

            <div className="divider flex items-center text-center my-4 text-gray-400 text-[11px]">
              <div className="flex-1 border-b border-gray-200" />
              <span className="px-4">OR</span>
              <div className="flex-1 border-b border-gray-200" />
            </div>

            <button
              type="button"
              className="google-button w-full py-2.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-900 flex items-center justify-center gap-2 transition-all hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <AccountCircleIcon className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="signup-link text-center mt-6 text-gray-600 text-[11px]">
              <p>Don&apos;t have an account? <Link href="/register" className="text-gray-900 font-semibold hover:text-gray-700 hover:underline no-underline">Sign up</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

