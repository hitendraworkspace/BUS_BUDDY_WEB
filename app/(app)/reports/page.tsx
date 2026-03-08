'use client'

import { useState, useEffect, useMemo } from 'react'
import { getRoutes, getDrivers, getAlarms, type BusRoute, type Driver, type Alarm } from '@/lib/supabase'
import { AssessmentIcon, WarningIcon, AltRouteIcon, PersonIcon, PhoneIcon, CalendarIcon, ArrowBackIcon } from '@/app/components/Icons'

type DateRange = 'today' | 'week' | 'month' | 'custom'

interface ReportData {
  activeRoutes: number
  totalAlerts: number
  alertsTrend: string
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [allRoutes, setAllRoutes] = useState<BusRoute[]>([])
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [allAlarms, setAllAlarms] = useState<Alarm[]>([])
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [reportData, setReportData] = useState<ReportData>({
    activeRoutes: 0,
    totalAlerts: 0,
    alertsTrend: '-12% from last week'
  })
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange>('month')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [showCustomRange, setShowCustomRange] = useState(false)

  useEffect(() => {
    // Initialize date range to last 30 days (month)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setEndDate(end)
    setStartDate(start)
    
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all data from Supabase
      const [routesData, driversData, alarmsData] = await Promise.all([
        getRoutes(),
        getDrivers(),
        getAlarms(200, null) // Load up to 200 alarms
      ])

      console.log('[REPORTS] Loaded alarms from Supabase:', alarmsData.length)

      // Filter alarms by date range based on selected period
      let filteredAlarms = alarmsData

      // Calculate date range based on period
      const end = new Date()
      const start = new Date()

      if (selectedPeriod === 'today') {
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (selectedPeriod === 'week') {
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (selectedPeriod === 'month') {
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (selectedPeriod === 'custom') {
        start.setTime(startDate.getTime())
        start.setHours(0, 0, 0, 0)
        end.setTime(endDate.getTime())
        end.setHours(23, 59, 59, 999)
      }

      // Filter alarms by date range - be lenient with missing dates
      filteredAlarms = alarmsData.filter(a => {
        // Use created_at, arm_date, or include if no date
        let alarmDate: Date
        if (a.created_at) {
          alarmDate = new Date(a.created_at)
        } else if (a.arm_date) {
          try {
            const dateTimeStr = a.arm_time ? `${a.arm_date} ${a.arm_time}` : a.arm_date
            alarmDate = new Date(dateTimeStr)
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
        return alarmDate >= start && alarmDate <= end
      })

      console.log('[REPORTS] Filtered alarms by date range:', filteredAlarms.length, 'Period:', selectedPeriod)

      setAllRoutes(routesData)
      setAllDrivers(driversData)
      setAllAlarms(filteredAlarms)
      setRoutes(routesData)
      setDrivers(driversData)
      setAlarms(filteredAlarms)
      
      calculateReportData(routesData, filteredAlarms)
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateReportData = (currentRoutes: BusRoute[], currentAlarms: Alarm[]) => {
    const activeRoutes = currentRoutes.filter(r => r.status === 'active').length
    const totalAlerts = currentAlarms.length

    console.log('[REPORTS] Calculating report data - Active routes:', activeRoutes, 'Total alerts:', totalAlerts)

    setReportData({
      activeRoutes,
      totalAlerts,
      alertsTrend: '-12% from last week'
    })
  }

  const setPeriod = (period: 'today' | 'week' | 'month') => {
    setSelectedPeriod(period)
    const end = new Date()
    const start = new Date()
    if (period === 'week') {
      start.setDate(start.getDate() - 7)
    } else if (period === 'month') {
      start.setDate(start.getDate() - 30)
    }
    setEndDate(end)
    setStartDate(start)
    setShowCustomRange(false)
    loadData()
  }

  const openCustomRangePicker = () => {
    setShowCustomRange(true)
    setSelectedPeriod('custom')
  }

  const applyCustomRange = () => {
    if (startDate && endDate) {
      loadData()
      setShowCustomRange(false)
    }
  }

  const cancelCustomRange = () => {
    setShowCustomRange(false)
    setPeriod('today') // Reset to today if cancelled
  }

  const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date()
  }

  const isExpiring = (expiryDate: string): boolean => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const threshold = new Date(now)
    threshold.setDate(threshold.getDate() + 30)
    return expiry > now && expiry <= threshold
  }

  const exportPDF = () => {
    // Generate PDF report
    const content = generatePDFContent()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Fleet_Report_${Date.now()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Fleet_Report_${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generatePDFContent = (): string => {
    let content = 'Fleet Management Report\n'
    content += '======================\n\n'
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Date Range: ${getDateRangeText()}\n\n`
    content += 'SUMMARY\n'
    content += '-------\n'
    content += `Total Alerts: ${reportData.totalAlerts}\n`
    content += `Active Routes: ${reportData.activeRoutes}\n\n`
    content += 'DRIVER PERFORMANCE\n'
    content += '------------------\n'
    content += 'Driver Name,Phone,Licence Expiry,Status\n'

    drivers.forEach(driver => {
      content += `${driver.name},${driver.phone},${driver.licence_expiry},${driver.status || 'Active'}\n`
    })

    return content
  }

  const generateCSV = (): string => {
    let csv = 'Fleet Management Report\n'
    csv += `Generated,${new Date().toLocaleString()}\n`
    csv += `Date Range,${getDateRangeText()}\n\n`
    csv += 'SUMMARY\n'
    csv += `Total Alerts,${reportData.totalAlerts}\n`
    csv += `Active Routes,${reportData.activeRoutes}\n\n`
    csv += 'DRIVER PERFORMANCE\n'
    csv += 'Driver Name,Phone,Licence Expiry,Status\n'

    drivers.forEach(driver => {
      csv += `"${driver.name}","${driver.phone}","${driver.licence_expiry}","${driver.status || 'Active'}"\n`
    })

    return csv
  }

  const getDateRangeText = (): string => {
    const now = new Date()
    let start: Date

    if (selectedPeriod === 'today') {
      start = new Date(now)
    } else if (selectedPeriod === 'week') {
      start = new Date(now)
      start.setDate(start.getDate() - 7)
    } else {
      start = new Date(now)
      start.setDate(start.getDate() - 30)
    }

    return `${start.toLocaleDateString()} to ${now.toLocaleDateString()}`
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <AssessmentIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor performance and export summaries</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Export PDF</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={openCustomRangePicker}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              selectedPeriod === 'custom'
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Alerts</p>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <WarningIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{reportData.totalAlerts}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{reportData.alertsTrend}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Active Routes</p>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <AltRouteIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{reportData.activeRoutes}</h2>
          <p className="text-sm text-gray-600">of {routes.length} total routes</p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      ) : (
        /* Driver Performance Table */
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <PersonIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Driver Performance Summary</h3>
            </div>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
              {drivers.length} drivers
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 uppercase">Driver Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 uppercase">Licence Expiry</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <PersonIcon className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-600">No driver data available</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <PersonIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <span className="font-semibold text-gray-900">{driver.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{driver.phone}</span>
                        </div>
                      </td>
                      <td className={`py-4 px-4 ${isExpired(driver.licence_expiry) ? 'text-red-600' : isExpiring(driver.licence_expiry) ? 'text-orange-600' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(driver.licence_expiry)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                          driver.status === 'active' ? 'bg-green-100 text-green-700' :
                          driver.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {driver.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
