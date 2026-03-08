'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAlarms, type Alarm } from '@/lib/supabase'
import { WarningIcon, PhoneIcon, ScheduleIcon, MemoryIcon, ArrowBackIcon, CalendarIcon } from '@/app/components/Icons'

type AlarmType = 'all' | 'phone' | 'fatigue' | 'collision' | 'speeding'
type DateRange = 'today' | 'week' | 'month' | 'custom'

function AlarmsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [selectedFilter, setSelectedFilter] = useState<AlarmType>('all')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [driverName, setDriverName] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    // Get driver info from query params
    const driverNameParam = searchParams.get('driver_name')
    const deviceIdParam = searchParams.get('device_id')
    
    if (driverNameParam) {
      setDriverName(driverNameParam)
    }
    if (deviceIdParam) {
      setDeviceId(deviceIdParam)
    }

    // Default to last 30 days to show all recent alarms
    setRangeDays(30)
    loadAlarms()
  }, [searchParams])

  const setRangeDays = (days: number) => {
    const end = new Date()
    const start = new Date()
    if (days > 0) {
      start.setDate(start.getDate() - days)
    }
    setEndDate(end)
    setStartDate(start)
    setDateRange(days === 0 ? 'today' : days === 7 ? 'week' : days === 30 ? 'month' : 'custom')
    setShowCustomRange(false)
    loadAlarms()
  }

  const openCustomRangePicker = () => {
    setShowCustomRange(true)
    setDateRange('custom')
  }

  const applyCustomRange = () => {
    if (startDate && endDate) {
      loadAlarms()
      setShowCustomRange(false)
    }
  }

  const cancelCustomRange = () => {
    setShowCustomRange(false)
    setRangeDays(0) // Reset to today
  }

  const loadAlarms = async () => {
    setLoading(true)
    try {
      // Load all alarms first, then filter by date range
      const alarmsData = await getAlarms(200, deviceId || null)
      console.log('[ALARMS] Loaded alarms from Supabase:', alarmsData.length, 'Device ID:', deviceId)
      
      // Filter by date range - be more lenient with missing dates
      const filtered = alarmsData.filter(a => {
        // Use created_at, arm_date, or current date as fallback
        let alarmDate: Date
        if (a.created_at) {
          alarmDate = new Date(a.created_at)
        } else if (a.arm_date) {
          // Combine arm_date and arm_time if available
          try {
            const dateTimeStr = a.arm_time ? `${a.arm_date} ${a.arm_time}` : a.arm_date
            alarmDate = new Date(dateTimeStr)
            // If date is invalid, include it anyway
            if (isNaN(alarmDate.getTime())) {
              return true // Include alarms with invalid dates
            }
          } catch {
            return true // Include alarms if date parsing fails
          }
        } else {
          // If no date at all, include it (show all alarms without dates)
          return true
        }
        
        // Check if alarm date is within range
        // Set time to start of day for startDate and end of day for endDate
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        
        return alarmDate >= start && alarmDate <= end
      })
      
      console.log('[ALARMS] Filtered alarms by date range:', filtered.length, 'Date range:', startDate, 'to', endDate)
      setAlarms(filtered)
    } catch (error) {
      console.error('[ALARMS] Failed to load alarms', error)
      setAlarms([])
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const all = alarms
    return {
      total: all.length,
      phone: all.filter(a => a.type === 'phone').length,
      fatigue: all.filter(a => a.type === 'fatigue').length,
      collision: all.filter(a => a.type === 'collision').length,
      speeding: all.filter(a => a.type === 'speeding').length
    }
  }, [alarms])

  const filteredAlarms = useMemo(() => {
    if (selectedFilter === 'all') {
      return alarms
    }
    return alarms.filter(a => a.type === selectedFilter)
  }, [alarms, selectedFilter])

  const getAlarmTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      phone: 'Mobile Phone Usage',
      fatigue: 'Driver Fatigue',
      collision: 'Collision Risk',
      speeding: 'Speed Violation'
    }
    return labels[type] || type
  }

  const getAlarmIcon = (type: string): string => {
    const icons: Record<string, string> = {
      phone: 'phone',
      fatigue: 'bedtime',
      collision: 'camera',
      speeding: 'speed'
    }
    return icons[type] || 'warning'
  }

  const formatTimestamp = (dateStr?: string, timeStr?: string): string => {
    if (!dateStr) return 'Unknown time'
    try {
      const dateTimeStr = timeStr ? `${dateStr} ${timeStr}` : dateStr
      const date = new Date(dateTimeStr)
      if (isNaN(date.getTime())) {
        return dateStr
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
             date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  const downloadPDF = () => {
    // Generate PDF report
    const content = generatePDFContent(filteredAlarms, driverName || '')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Safety_Alerts${driverName ? '_' + driverName.replace(' ', '_') : ''}_${Date.now()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generatePDFContent = (alarms: Alarm[], driverInfo: string): string => {
    let content = 'SAFETY ALERTS REPORT\n'
    content += '===================\n\n'
    content += `Driver: ${driverName || 'Unknown'}\n`
    content += `Generated: ${new Date().toLocaleString()}\n\n`
    content += 'SUMMARY STATISTICS\n'
    content += '------------------\n'
    content += `Total Alerts: ${alarms.length}\n\n`
    content += 'DETAILED ALARM LIST\n'
    content += '-------------------\n\n'
    
    alarms.forEach((alarm, i) => {
      content += `Alarm #${i + 1}\n`
      content += `Type: ${getAlarmTypeLabel(alarm.type)}\n`
      content += `Description: ${alarm.description || 'No description'}\n`
      content += `Severity: ${(alarm.severity || 'MEDIUM').toUpperCase()}\n`
      content += `Time: ${formatTimestamp(alarm.arm_date, alarm.arm_time)}\n`
      content += `Device ID: ${alarm.device_id || 'Unknown'}\n`
      content += '----------------------------------------\n\n'
    })
    
    return content
  }

  const goBack = () => {
    router.push('/alerts')
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {driverName ? `${driverName} - Safety Alarms` : 'Safety Alarms Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {driverName ? 'Driver-specific safety alerts and reports • Tap cards to filter' : 'Monitor real-time safety alerts'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={loadAlarms}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading alarms...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setRangeDays(0)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  dateRange === 'today'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setRangeDays(7)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  dateRange === 'week'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setRangeDays(30)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  dateRange === 'month'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={openCustomRangePicker}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  dateRange === 'custom'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Custom Range</span>
              </button>
              
              {/* Custom Date Range Picker */}
              {showCustomRange && (
                <div className="w-full mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={startDate.toISOString().split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelCustomRange}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyCustomRange}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div
              onClick={() => setSelectedFilter('all')}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-blue-50">
                  <WarningIcon className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </h2>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Total Alerts
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedFilter('phone')}
              className="bg-white rounded-xl p-6 border-2 border-yellow-200 bg-yellow-50 hover:border-yellow-300 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-yellow-100">
                  <PhoneIcon className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {stats.phone}
                  </h2>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Phone
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedFilter('fatigue')}
              className="bg-white rounded-xl p-6 border-2 border-pink-200 bg-pink-50 hover:border-pink-300 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-pink-100">
                  <svg className="w-7 h-7 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.5 2C13.3 2 14 2.7 14 3.5V4h2c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h2v-.5C8 2.7 8.7 2 9.5 2h3zm0 2h-3v1h3V4zM6 6v14h12V6H6zm6 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {stats.fatigue}
                  </h2>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Fatigue
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedFilter('collision')}
              className="bg-white rounded-xl p-6 border-2 border-yellow-200 bg-yellow-50 hover:border-yellow-300 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-yellow-100">
                  <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {stats.collision}
                  </h2>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Camera
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedFilter('speeding')}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 bg-gray-50 hover:border-gray-300 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-gray-100">
                  <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {stats.speeding}
                  </h2>
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    Speed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alarms List */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Recent Safety Alerts{driverName ? ` for ${driverName}` : ''}
                    {selectedFilter !== 'all' && (
                      <span className="text-base font-semibold text-gray-600 ml-2">
                        - {getAlarmTypeLabel(selectedFilter)}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredAlarms.length} alarm{filteredAlarms.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Export PDF</span>
              </button>
            </div>

            <div className="space-y-4">
              {filteredAlarms.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Alarms Found</h4>
                    <p className="text-sm text-gray-500">
                      No alarms found{driverName ? ` for ${driverName}` : ''} for the selected filter.
                    </p>
                  </div>
                </div>
              ) : (
                filteredAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={`rounded-xl p-6 border ${
                      alarm.type === 'phone' ? 'bg-yellow-50 border-yellow-200' :
                      alarm.type === 'fatigue' ? 'bg-pink-50 border-pink-200' :
                      alarm.type === 'collision' ? 'bg-yellow-50 border-yellow-200' :
                      alarm.type === 'speeding' ? 'bg-gray-50 border-gray-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alarm.type === 'phone' ? 'bg-yellow-100' :
                        alarm.type === 'fatigue' ? 'bg-pink-100' :
                        alarm.type === 'collision' ? 'bg-yellow-100' :
                        alarm.type === 'speeding' ? 'bg-gray-100' :
                        'bg-gray-100'
                      }`}>
                        {alarm.type === 'phone' ? (
                          <PhoneIcon className="w-7 h-7 text-yellow-600" />
                        ) : alarm.type === 'fatigue' ? (
                          <svg className="w-7 h-7 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.5 2C13.3 2 14 2.7 14 3.5V4h2c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h2v-.5C8 2.7 8.7 2 9.5 2h3zm0 2h-3v1h3V4zM6 6v14h12V6H6zm6 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                          </svg>
                        ) : (
                          <WarningIcon className="w-7 h-7 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-bold text-gray-900">
                            {getAlarmTypeLabel(alarm.type)}
                          </h4>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                            alarm.severity === 'critical' || alarm.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : alarm.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {(alarm.severity || 'medium').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-4">
                          {alarm.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ScheduleIcon className="w-4 h-4" />
                            <span>{formatTimestamp(alarm.arm_date, alarm.arm_time)}</span>
                          </div>
                          {alarm.device_id && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MemoryIcon className="w-4 h-4" />
                              <span>{alarm.device_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AlarmsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alarms page...</p>
        </div>
      </div>
    }>
      <AlarmsPageContent />
    </Suspense>
  )
}
