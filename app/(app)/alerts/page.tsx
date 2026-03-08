'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAlarms, getDrivers, supabase, type Alarm, type Driver } from '@/lib/supabase'
import { WarningIcon, PersonIcon, DirectionsBusIcon, MemoryIcon, PhoneIcon, CalendarIcon, ScheduleIcon, AccessTimeIcon, ArrowBackIcon } from '@/app/components/Icons'

export default function AlertsPage() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState(0) // 0 = alarms, 1 = drivers
  const [allAlarms, setAllAlarms] = useState<Alarm[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAlarms, setLoadingAlarms] = useState(false)
  const [fetchingGps, setFetchingGps] = useState<Set<string>>(new Set())
  const alarmPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadDrivers()
    loadAlarms(true) // Initial load with loading state
    startAlarmPolling()

    return () => {
      stopAlarmPolling()
    }
  }, [])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const driversData = await getDrivers()
      setAllDrivers(driversData)
      setDrivers(driversData) // For now, show all drivers (can filter by vehicle later)
    } catch (error) {
      console.error('Failed to load drivers:', error)
      setAllDrivers([])
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const loadAlarms = async (showLoading = true) => {
    if (showLoading) {
      setLoadingAlarms(true)
    }
    try {
      const alarmsData = await getAlarms(100, null)
      console.log('[ALERTS] Alarms loaded from Supabase:', alarmsData.length)
      setAllAlarms(alarmsData)
      setAlarms(alarmsData) // For now, show all alarms (can filter by vehicle later)
    } catch (error) {
      console.error('[ALERTS] Failed to load alarms:', error)
      setAllAlarms([])
      setAlarms([])
    } finally {
      if (showLoading) {
        setLoadingAlarms(false)
      }
    }
  }

  const startAlarmPolling = () => {
    // Clear existing interval
    if (alarmPollIntervalRef.current) {
      clearInterval(alarmPollIntervalRef.current)
    }

    // Poll for new alarms every 10 seconds (silent update, no loading state)
    alarmPollIntervalRef.current = setInterval(() => {
      loadAlarms(false) // false = don't show loading state
    }, 10000) // 10 seconds

    console.log('[ALERTS] Started alarm polling (every 10 seconds)')
  }

  const stopAlarmPolling = () => {
    if (alarmPollIntervalRef.current) {
      clearInterval(alarmPollIntervalRef.current)
      alarmPollIntervalRef.current = null
    }
  }

  const refreshAlarms = () => {
    loadAlarms(true) // true = show loading state for manual refresh
  }

  const getAlarmSeverityIcon = (severity: string): string => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'notifications'
      default:
        return 'notifications'
    }
  }

  const getAlarmSeverityColor = (severity: string): string => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getActiveAlarmsCount = (): number => {
    return alarms.filter(a => a.status === 'active').length
  }

  const getCriticalAlarmsCount = (): number => {
    return alarms.filter(a => a.status === 'active' && a.severity === 'critical').length
  }

  const viewAlarms = (driver: Driver) => {
    router.push(`/alarms?driver_id=${driver.id}&driver_name=${encodeURIComponent(driver.name)}&device_id=${driver.device_id || ''}`)
  }

  const goBack = () => {
    router.push('/')
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A'
    return timeString
  }

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US')
    } catch {
      return dateString
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowBackIcon className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                <WarningIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Alerts & Alarms</h1>
                <p className="text-sm text-gray-600 mt-1">Real-time alerts and alarms from Supabase</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedTab === 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <WarningIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {getActiveAlarmsCount()} active
                </span>
                {getCriticalAlarmsCount() > 0 && (
                  <>
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-red-600">
                      {getCriticalAlarmsCount()} critical
                    </span>
                  </>
                )}
              </div>
            )}
            {selectedTab === 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <PersonIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {drivers.length} drivers
                </span>
              </div>
            )}
            <button
              onClick={selectedTab === 0 ? refreshAlarms : loadDrivers}
              disabled={loading || loadingAlarms}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 text-gray-600 ${(loading || loadingAlarms) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedTab(0)}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                selectedTab === 0
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Alarms
            </button>
            <button
              onClick={() => setSelectedTab(1)}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                selectedTab === 1
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Drivers
            </button>
          </div>
        </div>

        {/* Alarms Tab Content */}
        {selectedTab === 0 && (
          <div className="p-6">
            {loadingAlarms ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading alarms from Supabase...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {alarms.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No alarms found</h4>
                      <p className="text-sm text-gray-500">Alarms from Supabase will appear here when detected.</p>
                    </div>
                  </div>
                ) : (
                  alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className={`rounded-xl p-6 border shadow-sm ${
                        alarm.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        alarm.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                        alarm.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          alarm.severity === 'critical' ? 'bg-red-500' :
                          alarm.severity === 'high' ? 'bg-orange-500' :
                          alarm.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            {getAlarmSeverityIcon(alarm.severity || 'medium') === 'error' ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            ) : getAlarmSeverityIcon(alarm.severity || 'medium') === 'warning' ? (
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            ) : (
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            )}
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {alarm.type ? alarm.type.charAt(0).toUpperCase() + alarm.type.slice(1) : 'Unknown Alarm'}
                              </h3>
                              <span className="text-sm text-gray-600">Device: {alarm.device_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border ${getAlarmSeverityColor(alarm.severity || 'medium')}`}>
                                {alarm.severity || 'medium'}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                                alarm.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                                'bg-gray-100 text-gray-700 border border-gray-300'
                              }`}>
                                {alarm.status || 'active'}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4">
                            {alarm.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-6 flex-wrap">
                            {alarm.arm_date && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{formatDate(alarm.arm_date)}</span>
                              </div>
                            )}
                            {alarm.arm_time && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <ScheduleIcon className="w-4 h-4" />
                                <span>{formatTime(alarm.arm_time)}</span>
                              </div>
                            )}
                            {alarm.created_at && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <AccessTimeIcon className="w-4 h-4" />
                                <span>{formatDateTime(alarm.created_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Drivers Tab Content */}
        {selectedTab === 1 && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading drivers...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {drivers.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PersonIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">No drivers found</h4>
                      <p className="text-sm text-gray-500">Add drivers to Supabase to see alerts here.</p>
                    </div>
                  </div>
                ) : (
                  drivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`rounded-xl p-6 border shadow-sm ${
                        driver.status === 'active' ? 'bg-green-50 border-green-200' :
                        driver.status === 'inactive' ? 'bg-gray-50 border-gray-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <PersonIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{driver.name}</h3>
                              <span className="text-sm text-gray-600">ID {driver.id}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                              driver.status === 'active' ? 'bg-green-100 text-green-700' :
                              driver.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {driver.status || 'active'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <DirectionsBusIcon className="w-5 h-5 text-gray-600" />
                              <div>
                                <span className="text-xs text-gray-600 block">Bus Number</span>
                                <span className="text-sm font-semibold text-gray-900">{(driver as any).bus_number || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MemoryIcon className="w-5 h-5 text-gray-600" />
                              <div>
                                <span className="text-xs text-gray-600 block">Device ID</span>
                                <span className="text-sm font-semibold text-gray-900">{driver.device_id || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="w-5 h-5 text-gray-600" />
                              <div>
                                <span className="text-xs text-gray-600 block">Phone</span>
                                <span className="text-sm font-semibold text-gray-900">{driver.phone || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => viewAlarms(driver)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
                          >
                            <WarningIcon className="w-4 h-4" />
                            <span>View Alarms</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
