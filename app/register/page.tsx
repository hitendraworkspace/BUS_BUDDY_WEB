'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DirectionsBusIcon, PersonIcon, EmailIcon, LockIcon, VisibilityIcon, VisibilityOffIcon, PersonAddIcon, CheckCircleIcon, ArrowBackIcon } from '../components/Icons'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hidePassword, setHidePassword] = useState(true)
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TEMPORARY: Local registration for testing
      const { name, email } = formData
      
      // Create mock user
      const mockUser = {
        id: 'local-user-' + Date.now(),
        email: email,
        user_metadata: {
          full_name: name
        },
        created_at: new Date().toISOString()
      }

      // Store registered users list
      const registeredUsersStr = localStorage.getItem('local_registered_users')
      let registeredUsers: any[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : []
      
      // Check if user already exists
      const existingIndex = registeredUsers.findIndex((u: any) => u.email === email)
      if (existingIndex >= 0) {
        // Update existing user
        registeredUsers[existingIndex] = mockUser
      } else {
        // Add new user
        registeredUsers.push(mockUser)
      }
      localStorage.setItem('local_registered_users', JSON.stringify(registeredUsers))

      // Store current user session in localStorage
      localStorage.setItem('local_auth_user', JSON.stringify(mockUser))
      localStorage.setItem('local_auth_token', 'local-token-' + Date.now())
      localStorage.setItem('auth_token', 'local-token-' + Date.now())

      // Set a flag to indicate we just registered (to prevent redirect back to login)
      localStorage.setItem('just_logged_in', 'true')

      setSuccess(true)
      setLoading(false)
      
      // Redirect to dashboard (use window.location for full page reload to ensure Shell component loads)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
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
    <div className="register-container flex min-h-screen bg-gray-50">
      {/* Left Side - Brand Section */}
      <div className="register-left flex-1 bg-gray-900 flex items-center justify-center p-12 text-white relative overflow-hidden">
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
          <h1 className="text-2xl font-bold mb-4 text-white tracking-tight">Join BusBuddy</h1>
          <p className="text-xs text-gray-300 mb-12 font-medium">Start managing your fleet today</p>
          
          <div className="benefits flex flex-col gap-4 text-left">
            <div className="benefit-item flex items-center gap-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg transition-all hover:bg-opacity-10 hover:translate-x-1">
              <div className="benefit-icon w-10 h-10 rounded-lg bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-white">Secure & Reliable</span>
            </div>
            <div className="benefit-item flex items-center gap-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg transition-all hover:bg-opacity-10 hover:translate-x-1">
              <div className="benefit-icon w-10 h-10 rounded-lg bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                </svg>
              </div>
              <span className="text-base font-medium text-white">Real-time Updates</span>
            </div>
            <div className="benefit-item flex items-center gap-4 p-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg transition-all hover:bg-opacity-10 hover:translate-x-1">
              <div className="benefit-icon w-10 h-10 rounded-lg bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.41c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                </svg>
              </div>
              <span className="text-base font-medium text-white">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="register-right flex-1 flex items-center justify-center p-12 bg-gray-50">
        <div className="register-card w-full max-w-[450px] p-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="card-header text-center mb-10">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Create Account</h2>
            <p className="text-gray-600 text-[11px]">Sign up to get started with BusBuddy</p>
          </div>

          {success ? (
            <div className="success-message flex items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
              <div>
                <h3 className="text-base font-bold mb-1 text-green-700">Account Created!</h3>
                <p className="text-[11px] text-green-600">Redirecting to dashboard...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="register-form flex flex-col gap-5">
              <div className="full-width">
                <label className="block text-[11px] font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PersonIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    minLength={2}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

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
                    minLength={8}
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
                <p className="text-[10px] text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>

              <div className="full-width">
                <label className="block text-[11px] font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={hideConfirmPassword ? 'password' : 'text'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {hideConfirmPassword ? (
                      <VisibilityOffIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <VisibilityIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[10px] text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="terms mt-2">
                <label className="terms-checkbox flex items-start gap-2 text-[11px] text-gray-600 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 cursor-pointer" />
                  <span>I agree to the <a href="#" className="text-gray-900 font-semibold hover:text-gray-700 hover:underline">Terms of Service</a> and <a href="#" className="text-gray-900 font-semibold hover:text-gray-700 hover:underline">Privacy Policy</a></span>
                </label>
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
              disabled={loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || formData.password.length < 8 || formData.password !== formData.confirmPassword}
              className="register-button w-full py-2.5 text-xs font-semibold rounded-lg bg-gray-900 text-white border-none shadow-md mt-2 flex items-center justify-center gap-2 transition-all hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <PersonAddIcon className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>

              <div className="login-link text-center mt-6 text-gray-600 text-[11px]">
                <p>Already have an account? <Link href="/login" className="text-gray-900 font-semibold hover:text-gray-700 hover:underline no-underline">Sign in</Link></p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

