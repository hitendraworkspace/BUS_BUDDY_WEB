'use client'

import { useState, useEffect, useMemo } from 'react'
import { getDrivers, type Driver } from '@/lib/supabase'
import { BadgeIcon, PersonIcon, PhoneIcon, DirectionsBusIcon, MemoryIcon, EventIcon, WarningIcon, ErrorIcon } from '@/app/components/Icons'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const driversData = await getDrivers()
      setDrivers(driversData)
    } catch (error) {
      console.error('Failed to load drivers:', error)
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date()
  }

  const isExpiring = (expiryDate: string): boolean => {
    const now = new Date()
    const threshold = new Date(now)
    threshold.setDate(threshold.getDate() + 30)
    const expiry = new Date(expiryDate)
    return expiry <= threshold && expiry >= now
  }

  const expiringSoon = useMemo(() => {
    const now = new Date()
    const threshold = new Date(now)
    threshold.setDate(threshold.getDate() + 30)
    return drivers.filter(d => {
      const expiry = new Date(d.licence_expiry)
      return expiry <= threshold && expiry >= now
    })
  }, [drivers])

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <BadgeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
              <p className="text-sm text-gray-600 mt-1">Manage driver information and compliance</p>
            </div>
          </div>
          <button 
            onClick={loadDrivers}
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

      {/* Alerts Section - Licence Expiring Soon */}
      {expiringSoon.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <WarningIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Licence Expiring Soon</h3>
              <span className="text-sm text-gray-600">{expiringSoon.length} driver{expiringSoon.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="space-y-3">
            {expiringSoon.map((driver) => (
              <div key={driver.id} className="bg-white rounded-lg p-4 border border-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <PersonIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <DirectionsBusIcon className="w-4 h-4" />
                        {(driver as any).bus_number || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <PhoneIcon className="w-4 h-4" />
                        {driver.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
                  <EventIcon className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">
                    {new Date(driver.licence_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading drivers...</p>
          </div>
        </div>
      ) : drivers.length === 0 ? (
        /* Empty State */
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PersonIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No Drivers Found</h4>
            <p className="text-sm text-gray-500">Add drivers to get started with driver management</p>
          </div>
        </div>
      ) : (
        /* Drivers List */
        <div className="space-y-6">
          {drivers.map((driver) => {
            const expired = isExpired(driver.licence_expiry)
            const expiring = isExpiring(driver.licence_expiry)
            
            return (
              <div
                key={driver.id}
                className={`bg-white rounded-xl p-6 border shadow-sm ${
                  expired ? 'border-red-200 bg-red-50' : expiring ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-6">
                  {/* Driver Avatar Section */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <PersonIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      driver.status === 'active' ? 'bg-green-500' :
                      driver.status === 'inactive' ? 'bg-gray-400' :
                      'bg-yellow-500'
                    }`}></div>
                  </div>

                  {/* Driver Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{driver.name}</h3>
                        <span className="text-sm text-gray-500">ID: {driver.id}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                        driver.status === 'active' ? 'bg-green-100 text-green-700' :
                        driver.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {driver.status || 'active'}
                      </span>
                    </div>

                    {/* Driver Details */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <PhoneIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase block">Phone</span>
                          <span className="text-sm font-semibold text-gray-900">{driver.phone || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <DirectionsBusIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase block">Bus Number</span>
                          <span className="text-sm font-semibold text-gray-900">{(driver as any).bus_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <MemoryIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase block">Device ID</span>
                          <span className="text-sm font-semibold text-gray-900">{driver.device_id || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Licence Expiry Section */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                      <BadgeIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600 uppercase">Licence Expiry</span>
                    </div>
                    <div className={`text-lg font-bold mb-2 ${
                      expired ? 'text-red-600' : expiring ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {new Date(driver.licence_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {expired && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-red-100 rounded text-xs font-semibold text-red-700">
                        <ErrorIcon className="w-4 h-4" />
                        <span>Expired</span>
                      </div>
                    )}
                    {!expired && expiring && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 rounded text-xs font-semibold text-orange-700">
                        <WarningIcon className="w-4 h-4" />
                        <span>Expiring Soon</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
