'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  DashboardIcon,
  MapIcon,
  AltRouteIcon,
  BadgeIcon,
  WarningIcon,
  NotificationImportantIcon,
  AssessmentIcon,
  VideocamIcon,
  PersonIcon,
  SettingsIcon,
  LogoutIcon,
  LoginIcon,
  PersonAddIcon,
  DirectionsBusIcon,
  KeyboardArrowDownIcon,
  MenuIcon,
  CloseIcon,
} from './Icons'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
}

interface BusRoute {
  id: number
  route_name: string
  bus_number: string
  start_point: string
  end_point: string
  device_id: string
  total_stops: number
  estimated_time: string
  status: 'active' | 'maintenance' | 'inactive'
  created_at?: string
  updated_at?: string
}

interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<BusRoute | null>(null)

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Tracking', icon: <MapIcon />, path: '/tracking' },
    { label: 'Routes', icon: <AltRouteIcon />, path: '/routes' },
    { label: 'Drivers', icon: <BadgeIcon />, path: '/drivers' },
    { label: 'Alerts', icon: <WarningIcon />, path: '/alerts', badge: 5 },
    { label: 'Alarms', icon: <NotificationImportantIcon />, path: '/alarms', badge: 3 },
    { label: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { label: 'Stream', icon: <VideocamIcon />, path: '/stream' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadUser = useCallback(() => {
    try {
      const localUserStr = localStorage.getItem('local_auth_user')
      if (localUserStr) {
        const localUser = JSON.parse(localUserStr)
        setCurrentUser({
          id: localUser.id,
          email: localUser.email,
          user_metadata: localUser.user_metadata || {},
        })
        return
      }
      // Check Supabase auth if available
      // For now, we'll just use local auth
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }, [])

  const loadRoutes = useCallback(async () => {
    setRoutesLoading(true)
    try {
      // TODO: Replace with actual API call
      // For now, using mock data
      const mockRoutes: BusRoute[] = []
      setRoutes(mockRoutes)
    } catch (error) {
      console.error('Failed to load routes:', error)
      setRoutes([])
    } finally {
      setRoutesLoading(false)
    }
  }, [])

  const loadSelectedVehicle = useCallback(() => {
    try {
      const stored = localStorage.getItem('selectedVehicle')
      if (stored) {
        const vehicle = JSON.parse(stored) as BusRoute
        // Verify the vehicle still exists in routes
        const exists = routes.some((r) => r.id === vehicle.id)
        if (exists) {
          setSelectedVehicle(vehicle)
        } else if (routes.length > 0) {
          // If stored vehicle doesn't exist, select first available
          setSelectedVehicle(routes[0])
          localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
        }
      } else if (routes.length > 0) {
        // If no stored vehicle, select first available
        setSelectedVehicle(routes[0])
        localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
      }
    } catch (error) {
      console.error('Failed to load vehicle selection:', error)
      if (routes.length > 0) {
        setSelectedVehicle(routes[0])
        localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
      }
    }
  }, [routes])

  const checkAuthAndRedirect = useCallback(() => {
    // Wait a bit for auth state to initialize
    setTimeout(() => {
      // Check if we just logged in (don't redirect if so)
      const justLoggedIn = localStorage.getItem('just_logged_in')
      if (justLoggedIn) {
        // User just logged in, load user and return
        loadUser()
        setTimeout(() => {
          localStorage.removeItem('just_logged_in')
        }, 3000)
        return
      }

      // Check local auth
      const localUser = localStorage.getItem('local_auth_user')
      if (localUser) {
        // User is logged in locally, make sure user is loaded
        loadUser()
        return
      }

      // Only redirect to login if we're not already on login/register pages or landing page
      const currentPath = pathname
      if (!currentPath?.includes('/login') && !currentPath?.includes('/register') && currentPath !== '/') {
        // Redirect to login if not authenticated
        router.push('/login')
      }
    }, 500)
  }, [pathname, router, loadUser])

  // Initial load
  useEffect(() => {
    loadUser()
    loadRoutes()
    checkAuthAndRedirect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load selected vehicle when routes change
  useEffect(() => {
    if (routes.length > 0) {
      try {
        const stored = localStorage.getItem('selectedVehicle')
        if (stored) {
          const vehicle = JSON.parse(stored) as BusRoute
          // Verify the vehicle still exists in routes
          const exists = routes.some((r) => r.id === vehicle.id)
          if (exists) {
            setSelectedVehicle(vehicle)
          } else {
            // If stored vehicle doesn't exist, select first available
            setSelectedVehicle(routes[0])
            localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
          }
        } else {
          // If no stored vehicle, select first available
          setSelectedVehicle(routes[0])
          localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
        }
      } catch (error) {
        console.error('Failed to load vehicle selection:', error)
        setSelectedVehicle(routes[0])
        localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
      }
    }
  }, [routes])

  const onVehicleChange = (routeId: number | null) => {
    if (routeId === null || routeId === 0) {
      // If no route selected or invalid, select first route if available
      if (routes.length > 0) {
        setSelectedVehicle(routes[0])
        localStorage.setItem('selectedVehicle', JSON.stringify(routes[0]))
      } else {
        setSelectedVehicle(null)
        localStorage.removeItem('selectedVehicle')
      }
    } else {
      const route = routes.find((r) => r.id === routeId)
      if (route) {
        setSelectedVehicle(route)
        localStorage.setItem('selectedVehicle', JSON.stringify(route))
      }
    }
  }

  const getUserDisplayName = (): string => {
    if (!currentUser) return 'Guest User'
    const fullName = currentUser.user_metadata?.full_name
    if (fullName) return fullName
    if (currentUser.email) {
      const emailName = currentUser.email.split('@')[0]
      return emailName
        .split('.')
        .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(' ')
    }
    return 'User'
  }

  const getUserInitials = (): string => {
    if (!currentUser) return 'GU'
    const fullName = currentUser.user_metadata?.full_name
    if (fullName) {
      const names = fullName.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return fullName[0].toUpperCase()
    }
    if (currentUser.email) {
      return currentUser.email[0].toUpperCase()
    }
    return 'U'
  }

  const logout = async () => {
    try {
      localStorage.removeItem('local_auth_user')
      localStorage.removeItem('local_auth_token')
      localStorage.removeItem('auth_token')
      setCurrentUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      localStorage.removeItem('local_auth_user')
      localStorage.removeItem('local_auth_token')
      localStorage.removeItem('auth_token')
      setCurrentUser(null)
      router.push('/login')
    }
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  return (
    <div className="app-container flex flex-col h-screen bg-gray-50">
      {/* Main Navigation Bar */}
      <nav
        className={`navbar sticky top-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? 'shadow-xl shadow-slate-200/50' : 'shadow-md shadow-slate-100/50'
        } border-b border-slate-200 h-[70px]`}
      >
        <div className="navbar-container flex items-center justify-between w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full gap-4 lg:gap-8">
          {/* Brand / Logo */}
          <Link 
            href="/" 
            className="navbar-brand flex items-center gap-3 min-w-[140px] sm:min-w-[160px] flex-shrink-0 no-underline group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="logo-icon w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/30 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-emerald-500/50">
              <DirectionsBusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="brand-text font-bold text-slate-900 text-lg sm:text-xl tracking-tight whitespace-nowrap">
              BusBuddy
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden lg:flex items-center gap-1 flex-1 justify-center list-none m-0 p-0 min-w-0">
            {navItems.map((item) => (
              <li key={item.path} className="m-0 flex-shrink-0">
                <Link
                  href={item.path}
                  className={`nav-link relative text-sm font-medium mx-1 px-4 py-2.5 rounded-xl no-underline transition-all duration-300 flex items-center gap-2 whitespace-nowrap group ${
                    isActive(item.path)
                      ? 'text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 scale-105'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:scale-105'
                  }`}
                >
                  <span className={`nav-icon w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="nav-text font-semibold block">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ml-1 shadow-md animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* User Profile Section - Desktop */}
          <div className="hidden lg:flex items-center justify-end flex-shrink-0 min-w-[180px] relative">
            <button
              className="user-chip flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full shadow-md cursor-pointer transition-all duration-300 no-underline text-slate-900 font-medium whitespace-nowrap overflow-hidden max-w-full hover:bg-slate-100 hover:border-slate-300 hover:shadow-lg hover:scale-105"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
            >
              <div className="user-avatar w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-md">
                <span>{getUserInitials()}</span>
              </div>
              <span className="user-name max-w-[140px] font-semibold text-slate-900 overflow-hidden text-ellipsis whitespace-nowrap flex-shrink text-sm">
                {getUserDisplayName()}
              </span>
              <KeyboardArrowDownIcon
                className={`caret-icon text-slate-600 text-sm w-4 h-4 flex-shrink-0 ml-1 transition-transform duration-300 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="user-menu absolute top-full right-0 mt-3 bg-white rounded-2xl border border-slate-200 shadow-2xl min-w-[280px] max-w-[320px] overflow-hidden z-50 transition-all duration-200">
                  {currentUser ? (
                    <>
                      <div className="user-menu-header flex items-center gap-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
                        <div className="user-avatar-large w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                          <span>{getUserInitials()}</span>
                        </div>
                        <div className="user-details flex flex-col gap-1 flex-1">
                          <span className="user-name-large text-base font-bold text-slate-900">
                            {getUserDisplayName()}
                          </span>
                          <span className="user-email-large text-sm text-slate-600">
                            {currentUser.email || 'No email'}
                          </span>
                        </div>
                      </div>
                      <div className="menu-items p-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 no-underline transition-all duration-200 hover:translate-x-1"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <PersonIcon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium">Profile</span>
                        </Link>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-all duration-200 text-left hover:translate-x-1"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <SettingsIcon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium">Settings</span>
                        </button>
                        <div className="border-t border-slate-200 my-2" />
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-200 text-left hover:translate-x-1 logout-item"
                          onClick={() => {
                            setUserMenuOpen(false)
                            logout()
                          }}
                        >
                          <LogoutIcon className="w-5 h-5" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="user-menu-header flex items-center gap-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
                        <div className="user-avatar-large w-14 h-14 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                          <span>GU</span>
                        </div>
                        <div className="user-details flex flex-col gap-1 flex-1">
                          <span className="user-name-large text-base font-bold text-slate-900">
                            Guest User
                          </span>
                          <span className="user-email-large text-sm text-slate-600">Not logged in</span>
                        </div>
                      </div>
                      <div className="menu-items p-2">
                        <Link
                          href="/login"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 no-underline transition-all duration-200 hover:translate-x-1"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LoginIcon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium">Login</span>
                        </Link>
                        <Link
                          href="/register"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 no-underline transition-all duration-200 hover:translate-x-1"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <PersonAddIcon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium">Register</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              className="user-chip-mobile flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-md cursor-pointer transition-all duration-300"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
            >
              <div className="user-avatar w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-md">
                <span>{getUserInitials()}</span>
              </div>
            </button>
            <button
              className="mobile-menu-button p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-200 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
            mobileMenuOpen ? 'max-h-[calc(100vh-70px)] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl no-underline transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon w-5 h-5 flex-shrink-0">{item.icon}</span>
                <span className="nav-text font-semibold text-base">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto nav-badge bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[22px] text-center shadow-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile User Menu */}
          {userMenuOpen && (
            <div className="border-t border-slate-200 px-4 py-4 bg-slate-50">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="user-avatar w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      <span>{getUserInitials()}</span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-slate-900 font-semibold text-sm truncate">
                        {getUserDisplayName()}
                      </span>
                      <span className="text-slate-600 text-xs truncate">
                        {currentUser.email || 'No email'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-700 no-underline transition-colors mb-2"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <PersonIcon className="w-5 h-5 text-slate-600" />
                    <span className="font-medium">Profile</span>
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-700 transition-colors text-left mb-2"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <SettingsIcon className="w-5 h-5 text-slate-600" />
                    <span className="font-medium">Settings</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setMobileMenuOpen(false)
                      logout()
                    }}
                  >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="user-avatar w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      <span>GU</span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-slate-900 font-semibold text-sm">Guest User</span>
                      <span className="text-slate-600 text-xs">Not logged in</span>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-700 no-underline transition-colors mb-2"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LoginIcon className="w-5 h-5 text-slate-600" />
                    <span className="font-medium">Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-700 no-underline transition-colors"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <PersonAddIcon className="w-5 h-5 text-slate-600" />
                    <span className="font-medium">Register</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  )
}

