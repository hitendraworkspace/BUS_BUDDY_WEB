'use client'

import { useState, useEffect } from 'react'
import { 
  getRoutes, getAlarms, getDrivers, 
  getGeofences, getGeofenceEvents,
  getOverspeedEvents, getSocStatus, getLatestSocStatus,
  getAddressOverstay, getFuelConsumption,
  type BusRoute, type Alarm, type Driver,
  type Geofence, type GeofenceEvent,
  type OverspeedEvent, type SocStatus,
  type AddressOverstay, type FuelConsumption
} from '@/lib/supabase'

export default function DashboardPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([])
  const [overspeedEvents, setOverspeedEvents] = useState<OverspeedEvent[]>([])
  const [socStatus, setSocStatus] = useState<SocStatus[]>([])
  const [addressOverstay, setAddressOverstay] = useState<AddressOverstay[]>([])
  const [fuelConsumption, setFuelConsumption] = useState<FuelConsumption[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<'Today' | 'Week' | 'Month'>('Today')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadFilteredData()
    }
  }, [dateFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        routesData, alarmsData, driversData, geofencesData, 
        geofenceEventsData, overspeedData, socData, addressData, fuelData
      ] = await Promise.all([
        getRoutes(),
        getAlarms(100),
        getDrivers(),
        getGeofences(),
        getGeofenceEvents(dateFilter),
        getOverspeedEvents(dateFilter),
        getSocStatus(),
        getAddressOverstay(dateFilter),
        getFuelConsumption(dateFilter)
      ])
      
      setRoutes(routesData)
      setAlarms(alarmsData)
      setDrivers(driversData)
      setGeofences(geofencesData)
      setGeofenceEvents(geofenceEventsData)
      setOverspeedEvents(overspeedData)
      setSocStatus(socData)
      setAddressOverstay(addressData)
      setFuelConsumption(fuelData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFilteredData = async () => {
    try {
      const [geofenceEventsData, overspeedData, addressData, fuelData] = await Promise.all([
        getGeofenceEvents(dateFilter),
        getOverspeedEvents(dateFilter),
        getAddressOverstay(dateFilter),
        getFuelConsumption(dateFilter)
      ])
      
      setGeofenceEvents(geofenceEventsData)
      setOverspeedEvents(overspeedData)
      setAddressOverstay(addressData)
      setFuelConsumption(fuelData)
    } catch (error) {
      console.error('Failed to load filtered data:', error)
    }
  }

  const routeStats = {
    total: routes.length,
    active: routes.filter(r => r.status === 'active').length,
    maintenance: routes.filter(r => r.status === 'maintenance').length,
    inactive: routes.filter(r => r.status === 'inactive').length
  }

  const fleetStatus = {
    total: routes.length || 1,
    running: routes.filter(r => r.status === 'active').length || 0,
    idle: routes.filter(r => r.status === 'maintenance').length || 0,
    stopped: 0,
    inactive: routes.filter(r => r.status === 'inactive').length || 0,
    noData: 0
  }

  // Calculate fleet usage from fuel consumption
  const totalDistance = fuelConsumption.reduce((sum, fc) => sum + fc.distance_km, 0)
  const fleetUsage = {
    totalUsage: totalDistance.toFixed(2),
    avgDistance: routes.length > 0 ? (totalDistance / routes.length).toFixed(2) : '0.00'
  }

  // Calculate geofence stats
  const activeGeofences = geofences.filter(g => g.status === 'active').length
  const fenceOverstayEvents = geofenceEvents.filter(e => e.event_type === 'overstay' && e.status === 'active')
  const maxFenceOverstay = fenceOverstayEvents.length > 0 
    ? Math.max(...fenceOverstayEvents.map(e => e.duration_minutes || 0))
    : 0

  // Calculate overspeed stats
  const maxSpeed = overspeedEvents.length > 0 
    ? Math.max(...overspeedEvents.map(e => e.speed_kmh))
    : 0
  const overspeedAlerts = overspeedEvents.filter(e => e.status === 'active').length
  const overspeedPercentage = routes.length > 0 
    ? ((overspeedEvents.length / routes.length) * 100).toFixed(0)
    : '0'

  // Calculate address overstay stats
  const maxAddressOverstay = addressOverstay.length > 0
    ? Math.max(...addressOverstay.map(a => a.overstay_minutes))
    : 0
  const addressOverstayAlerts = addressOverstay.filter(a => a.status === 'active').length
  const addressOverstayPercentage = routes.length > 0
    ? ((addressOverstay.length / routes.length) * 100).toFixed(0)
    : '0'

  // Get latest SOC status
  const latestSoc = socStatus.length > 0 ? socStatus[0] : null

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Fleet overview and key metrics</p>
            </div>
          </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* TOTAL ROUTES Card */}
        <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-600 mb-1">TOTAL ROUTES</div>
          <div className="text-2xl font-bold text-gray-900 mb-1.5">{routeStats.total}</div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-green-600">Active</span>
          </div>
        </div>

        {/* ACTIVE Card */}
        <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-600 mb-1">ACTIVE</div>
          <div className="text-2xl font-bold text-gray-900 mb-1.5">{routeStats.active}</div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-green-600">Active</span>
          </div>
        </div>

        {/* MAINTENANCE Card */}
        <div className="bg-orange-50 rounded-xl shadow-sm p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-600 mb-1">MAINTENANCE</div>
          <div className="text-2xl font-bold text-gray-900 mb-1.5">{routeStats.maintenance}</div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-green-600">Active</span>
          </div>
        </div>

        {/* INACTIVE Card */}
        <div className="bg-gray-100 rounded-xl shadow-sm p-4 border border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-600 mb-1">INACTIVE</div>
          <div className="text-2xl font-bold text-gray-900 mb-1.5">{routeStats.inactive}</div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-semibold text-green-600">Active</span>
          </div>
        </div>
      </div>

      {/* Routing Overlay Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div>
              <h3 className="text-xs font-semibold text-gray-900">Routing Overlay</h3>
              <p className="text-xs text-gray-500">Tracked Buses</p>
            </div>
          </div>
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{routes.length}</div>
            <div className="text-xs font-semibold uppercase">ROUTES</div>
          </div>
        </div>

        {/* Route Details Cards */}
        <div className="space-y-2">
          {routes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h4 className="text-xs font-semibold text-gray-700 mb-1">No routes available</h4>
              <p className="text-xs text-gray-500">Add routes to see them here</p>
            </div>
          ) : (
            routes.map((route) => (
              <div key={route.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{route.route_name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">{route.start_point} → {route.end_point}</span>
                    </div>
                  </div>
                </div>
                <button className={`px-3 py-1 rounded-md text-xs font-semibold uppercase ${
                  route.status === 'active' ? 'bg-green-600 text-white' :
                  route.status === 'maintenance' ? 'bg-orange-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {route.status}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Fleet Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-700">Fleet Status</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">{fleetStatus.total}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-600 mb-3">OBJECTS</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">Running {fleetStatus.running} ({fleetStatus.total > 0 ? ((fleetStatus.running / fleetStatus.total) * 100).toFixed(2) : '0.00'}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-gray-600">Idle {fleetStatus.idle} ({fleetStatus.total > 0 ? ((fleetStatus.idle / fleetStatus.total) * 100).toFixed(2) : '0.00'}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">Stopped {fleetStatus.stopped} (0.00%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">InActive {fleetStatus.inactive} ({fleetStatus.total > 0 ? ((fleetStatus.inactive / fleetStatus.total) * 100).toFixed(2) : '0.00'}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-xs text-gray-600">No Data {fleetStatus.noData} (0.00%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Geofence Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-700">Geofence</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-gray-600">
                  {geofences.length > 0 ? `${geofences.length} geofence${geofences.length > 1 ? 's' : ''}` : 'No geofence'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadData} className="p-1 rounded hover:bg-gray-100">
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="bg-gray-900 text-white px-2.5 py-1 rounded text-xs font-semibold">
                  {activeGeofences} ACTIVE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Usage Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Fleet Usage</h3>
            <div className="text-xs text-gray-600 mb-1">TOTAL FLEET USAGE {fleetUsage.totalUsage} km</div>
            <div className="text-xs text-gray-600">AVG. DISTANCE / OBJECT {fleetUsage.avgDistance} km</div>
          </div>
          <div className="h-24 flex items-end gap-1">
            {fuelConsumption.length > 0 ? (
              fuelConsumption.slice(0, 12).map((fc, index) => {
                const maxDistance = Math.max(...fuelConsumption.map(f => f.distance_km))
                const height = maxDistance > 0 ? (fc.distance_km / maxDistance) * 100 : 0
                return (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${fc.distance_km.toFixed(1)} km`}
                  ></div>
                )
              })
            ) : (
              [40, 60, 45, 70, 55, 80, 65, 50, 75, 60, 85, 70].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t opacity-30"
                  style={{ height: `${height}%` }}
                ></div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Overspeed Card */}
        <div className="bg-pink-50 rounded-xl shadow-sm p-4 border border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-700">Overspeed</h3>
            </div>
            <select 
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'Today' | 'Week' | 'Month')}
            >
              <option>Today</option>
              <option>Week</option>
              <option>Month</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-red-600 font-semibold">MAX SPEED {maxSpeed.toFixed(1)} km/h</div>
            <div className="text-xs text-gray-600">ALERTS {overspeedAlerts}</div>
            <div className="text-xs text-gray-600">{overspeedPercentage}% OBJECT</div>
          </div>
        </div>

        {/* Fleet Idle Card */}
        <div className="bg-orange-50 rounded-xl shadow-sm p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-700">Fleet Idle</h3>
            </div>
            <select className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
              <option>Today</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-xs text-gray-600">TOTAL FLEET IDLE 128 hrs</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs text-gray-600">APPROX FUEL WASTE 242 ltr</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Generally an idling car uses somewhere between 1.89 to 2.64 liter of fuel per hour. Object with Movable category are considered in Analytics.
            </p>
          </div>
        </div>

        {/* SOC Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-700">SOC Status</h3>
            </div>
          </div>
          {latestSoc ? (
            <div className="space-y-2">
              <div className="text-lg font-bold text-gray-900">{latestSoc.soc_percentage.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Voltage: {latestSoc.voltage?.toFixed(1) || 'N/A'}V</div>
              <div className="text-xs text-gray-600">Status: <span className="font-semibold capitalize">{latestSoc.status}</span></div>
              {latestSoc.temperature_celsius && (
                <div className="text-xs text-gray-600">Temp: {latestSoc.temperature_celsius.toFixed(1)}°C</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">No Records Found</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Address Overstay Card */}
        <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-700">Address Overstay</h3>
            </div>
            <select 
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'Today' | 'Week' | 'Month')}
            >
              <option>Today</option>
              <option>Week</option>
              <option>Month</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-gray-600">MAX OVERSTAY {maxAddressOverstay} min</div>
            <div className="text-xs text-gray-600">ALERTS {addressOverstayAlerts}</div>
            <div className="text-xs text-gray-600">{addressOverstayPercentage}% OBJECT</div>
          </div>
        </div>

        {/* Fence Overstay Card */}
        <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-700">Fence Overstay</h3>
            </div>
            <select 
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'Today' | 'Week' | 'Month')}
            >
              <option>Today</option>
              <option>Week</option>
              <option>Month</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-gray-600">
              MAX OVERSTAY {maxFenceOverstay > 0 ? `${maxFenceOverstay} min` : <span className="text-red-600">-</span>}
            </div>
            <div className="text-xs text-gray-600">ALERTS {fenceOverstayEvents.length}</div>
            <div className="text-xs text-gray-600">
              {routes.length > 0 ? ((fenceOverstayEvents.length / routes.length) * 100).toFixed(0) : '0'}% OBJECT
            </div>
          </div>
        </div>

        {/* Fuel vs Distance Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-700">Fuel vs Distance</h3>
            </div>
          </div>
          {fuelConsumption.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                Total Fuel: {fuelConsumption.reduce((sum, fc) => sum + fc.fuel_liters, 0).toFixed(2)} L
              </div>
              <div className="text-xs text-gray-600">
                Total Distance: {totalDistance.toFixed(2)} km
              </div>
              <div className="text-xs text-gray-600">
                Avg Efficiency: {fuelConsumption.length > 0 
                  ? (fuelConsumption.reduce((sum, fc) => sum + fc.fuel_efficiency_kmpl, 0) / fuelConsumption.length).toFixed(2)
                  : '0.00'} km/L
              </div>
              <div className="h-16 flex items-end gap-1 mt-2">
                {fuelConsumption.slice(0, 12).map((fc, index) => {
                  const maxFuel = Math.max(...fuelConsumption.map(f => f.fuel_liters))
                  const height = maxFuel > 0 ? (fc.fuel_liters / maxFuel) * 100 : 0
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${fc.fuel_liters.toFixed(1)}L / ${fc.distance_km.toFixed(1)}km`}
                    ></div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs text-gray-500">No Data Available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
