'use client'

import { useState, useEffect, useRef } from 'react'
import { AltRouteIcon, CheckCircleIcon, BuildIcon, PauseCircleIcon, AllInclusiveIcon, DirectionsBusIcon, StopIcon, ScheduleIcon, MyLocationIcon, PlaceIcon, SpeedIcon, AccessTimeIcon, EditIcon, DeleteIcon, VideocamIcon } from '@/app/components/Icons'
import { getRoutes, getLatestGps, upsertRoute, deleteRoute, updateRouteStatus, type BusRoute, type GpsPoint } from '@/lib/supabase'

type FilterStatus = 'all' | 'active' | 'maintenance' | 'inactive'
type RouteStatus = 'active' | 'maintenance' | 'inactive'

// Default Ahmedabad coordinates
const DEFAULT_LATITUDE = 23.0225
const DEFAULT_LONGITUDE = 72.5714

// India boundaries for validation
const INDIA_MIN_LAT = 6.5
const INDIA_MAX_LAT = 37.1
const INDIA_MIN_LNG = 68.7
const INDIA_MAX_LNG = 97.3

interface RouteLocation {
  route: BusRoute
  gpsPoint: GpsPoint | null
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [routeLocations, setRouteLocations] = useState<Map<string, GpsPoint>>(new Map())
  const [showDialog, setShowDialog] = useState(false)
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null)
  const [formData, setFormData] = useState({
    route_name: '',
    bus_number: '',
    start_point: '',
    end_point: '',
    device_id: '',
    total_stops: 6,
    estimated_time: '30 min',
    status: 'active' as RouteStatus,
    start_latitude: 0,
    start_longitude: 0,
    end_latitude: 0,
    end_longitude: 0
  })
  const gpsPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadRoutes()
    startGpsPolling()
    
    return () => {
      stopGpsPolling()
    }
  }, [])

  const isWithinIndia = (latitude: number, longitude: number): boolean => {
    if (latitude == null || longitude == null) {
      return false
    }
    return (
      latitude >= INDIA_MIN_LAT &&
      latitude <= INDIA_MAX_LAT &&
      longitude >= INDIA_MIN_LNG &&
      longitude <= INDIA_MAX_LNG
    )
  }

  const loadRoutes = async () => {
    setLoading(true)
    try {
      const routesData = await getRoutes()
      setRoutes(routesData)
      // Fetch GPS locations for all routes
      fetchAllRouteLocations(routesData)
    } catch (error) {
      console.error('Failed to load routes:', error)
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllRouteLocations = async (routesToFetch: BusRoute[] = routes) => {
    const locationMap = new Map<string, GpsPoint>()

    for (const route of routesToFetch) {
      if (route.device_id) {
        try {
          const gpsPoint = await getLatestGps(route.device_id)
          
          if (gpsPoint) {
            let lat = gpsPoint.latitude
            let lng = gpsPoint.longitude
            
            // Validate coordinates
            if (!isWithinIndia(lat, lng)) {
              console.warn(`Coordinates (${lat}, ${lng}) outside India boundaries. Using default Ahmedabad location.`)
              lat = DEFAULT_LATITUDE
              lng = DEFAULT_LONGITUDE
            }
            
            // Store validated GPS point
            const validatedGps: GpsPoint = {
              ...gpsPoint,
              latitude: lat,
              longitude: lng
            }
            
            locationMap.set(route.device_id, validatedGps)
          }
        } catch (err) {
          console.error(`Error fetching GPS for route ${route.route_name}:`, err)
        }
      }
    }

    setRouteLocations(new Map(locationMap))
  }

  const startGpsPolling = () => {
    // Clear existing interval
    if (gpsPollIntervalRef.current) {
      clearInterval(gpsPollIntervalRef.current)
    }

    // Poll every 10 seconds for GPS updates
    gpsPollIntervalRef.current = setInterval(() => {
      if (routes.length > 0) {
        fetchAllRouteLocations()
      }
    }, 10000) // 10 seconds

    console.log('[ROUTES] GPS polling started (every 10 seconds)')
  }

  const stopGpsPolling = () => {
    if (gpsPollIntervalRef.current) {
      clearInterval(gpsPollIntervalRef.current)
      gpsPollIntervalRef.current = null
    }
  }

  const getRouteLocation = (deviceId: string | null | undefined): GpsPoint | null => {
    if (!deviceId) return null
    const gpsPoint = routeLocations.get(deviceId)
    if (!gpsPoint) return null
    
    // Validate if coordinates are within India, otherwise return default Ahmedabad location
    if (!isWithinIndia(gpsPoint.latitude, gpsPoint.longitude)) {
      return {
        device_id: gpsPoint.device_id,
        latitude: DEFAULT_LATITUDE,
        longitude: DEFAULT_LONGITUDE,
        speed: gpsPoint.speed,
        gps_time: gpsPoint.gps_time
      }
    }
    
    return gpsPoint
  }

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const formatSpeed = (speed: number | undefined): string => {
    if (speed === undefined || speed === null) return 'N/A'
    return `${speed.toFixed(1)} km/h`
  }

  const formatGpsTime = (gpsTime: string | undefined): string => {
    if (!gpsTime) return 'N/A'
    try {
      const date = new Date(gpsTime)
      return date.toLocaleString()
    } catch {
      return gpsTime
    }
  }

  const openAddRoute = () => {
    setEditingRoute(null)
    setFormData({
      route_name: '',
      bus_number: '',
      start_point: '',
      end_point: '',
      device_id: '',
      total_stops: 6,
      estimated_time: '30 min',
      status: 'active',
      start_latitude: 0,
      start_longitude: 0,
      end_latitude: 0,
      end_longitude: 0
    })
    setShowDialog(true)
  }

  const openEditRoute = (route: BusRoute) => {
    setEditingRoute(route)
    
    // Parse coordinates if they exist
    let startLat = 0, startLng = 0, endLat = 0, endLng = 0
    
    if ((route as any).start_coordinates) {
      const coords = (route as any).start_coordinates.split(',')
      if (coords.length === 2) {
        startLat = parseFloat(coords[0]) || 0
        startLng = parseFloat(coords[1]) || 0
      }
    }
    
    if ((route as any).end_coordinates) {
      const coords = (route as any).end_coordinates.split(',')
      if (coords.length === 2) {
        endLat = parseFloat(coords[0]) || 0
        endLng = parseFloat(coords[1]) || 0
      }
    }
    
    setFormData({
      route_name: route.route_name,
      bus_number: route.bus_number,
      start_point: route.start_point,
      end_point: route.end_point,
      device_id: route.device_id,
      total_stops: route.total_stops,
      estimated_time: route.estimated_time,
      status: route.status,
      start_latitude: startLat,
      start_longitude: startLng,
      end_latitude: endLat,
      end_longitude: endLng
    })
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingRoute(null)
  }

  const saveRoute = async () => {
    if (!formData.route_name || !formData.bus_number || !formData.start_point || !formData.end_point || !formData.device_id) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const payload: any = {
        route_name: formData.route_name.trim(),
        bus_number: formData.bus_number.trim(),
        start_point: formData.start_point.trim(),
        end_point: formData.end_point.trim(),
        device_id: formData.device_id.trim(),
        total_stops: Number(formData.total_stops),
        estimated_time: formData.estimated_time.trim(),
        status: formData.status,
        start_coordinates: `${formData.start_latitude},${formData.start_longitude}`,
        end_coordinates: `${formData.end_latitude},${formData.end_longitude}`
      }
      
      // Only include ID if editing existing route
      if (editingRoute && editingRoute.id) {
        payload.id = editingRoute.id
      }
      
      console.log('Saving route with payload:', payload)
      await upsertRoute(payload)
      closeDialog()
      await loadRoutes()
    } catch (error: any) {
      console.error('Failed to save route', error)
      const errorMessage = error?.message || error?.details || 'Unknown error occurred'
      alert(`Failed to save route: ${errorMessage}. Please check all fields are filled correctly.`)
    }
  }

  const handleSetStatus = async (route: BusRoute, status: RouteStatus) => {
    if (route.status === status) {
      return
    }
    try {
      await updateRouteStatus(route.id, status)
      await loadRoutes()
    } catch (error) {
      console.error('Failed to update status', error)
      alert('Failed to update route status')
    }
  }

  const handleDeleteRoute = async (route: BusRoute) => {
    if (!confirm(`Are you sure you want to delete "${route.route_name}"?`)) {
      return
    }
    try {
      await deleteRoute(route.id)
      await loadRoutes()
    } catch (error) {
      console.error('Failed to delete route', error)
      alert('Failed to delete route')
    }
  }

  const filteredRoutes = filter === 'all' 
    ? routes 
    : routes.filter(route => route.status === filter)

  const routeCounts = {
    active: routes.filter(r => r.status === 'active').length,
    maintenance: routes.filter(r => r.status === 'maintenance').length,
    inactive: routes.filter(r => r.status === 'inactive').length
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <AltRouteIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Routes</h1>
              <p className="text-xs text-gray-600 mt-0.5">Manage your bus routes.</p>
            </div>
          </div>
          <button 
            onClick={openAddRoute}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm"
          >
            <span className="text-lg">+</span>
            <span>New Route</span>
          </button>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 mb-1.5">ACTIVE</div>
            <div className="text-2xl font-bold text-gray-900">{routeCounts.active}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 mb-1.5">MAINTENANCE</div>
            <div className="text-2xl font-bold text-gray-900">{routeCounts.maintenance}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 mb-1.5">INACTIVE</div>
            <div className="text-2xl font-bold text-gray-900">{routeCounts.inactive}</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AllInclusiveIcon className="w-4 h-4" />
            <span>All</span>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filter === 'active'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Active</span>
          </button>
          <button
            onClick={() => setFilter('maintenance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filter === 'maintenance'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <BuildIcon className="w-4 h-4" />
            <span>Maintenance</span>
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filter === 'inactive'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <PauseCircleIcon className="w-4 h-4" />
            <span>Inactive</span>
          </button>
        </div>
      </div>

      {/* Routes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading routes...</div>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">No routes found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoutes.map((route) => {
            const location = getRouteLocation(route.device_id)
            return (
              <div
                key={route.id}
                className="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm"
              >
                {/* Route Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1.5">{route.route_name}</h3>
                    <button className={`px-3 py-1 rounded-lg font-semibold text-xs uppercase ${
                      route.status === 'active' ? 'bg-green-600 text-white' :
                      route.status === 'maintenance' ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {route.status.toUpperCase()}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">Device {route.device_id}</div>
                </div>

                {/* Route Details Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <DirectionsBusIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600 uppercase">Bus Number</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{route.bus_number}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StopIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600 uppercase">Total Stops</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{route.total_stops}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ScheduleIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600 uppercase">Estimated Time</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{route.estimated_time}</div>
                  </div>
                </div>

                {/* Current Location Section */}
                {location ? (
                  <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MyLocationIcon className="w-4 h-4 text-gray-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Current Location</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <PlaceIcon className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-600 uppercase">Coordinates</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-900">
                          {formatCoordinates(location.latitude, location.longitude)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <SpeedIcon className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-600 uppercase">Speed</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-900">{formatSpeed(location.speed)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AccessTimeIcon className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-600 uppercase">Last Update</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-900">{formatGpsTime(location.gps_time)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MyLocationIcon className="w-4 h-4 text-gray-400" />
                      <h4 className="text-sm font-semibold text-gray-500">Location Not Available</h4>
                    </div>
                    <p className="text-xs text-gray-500">GPS data not available for this device. Please check device connection.</p>
                  </div>
                )}

                {/* Route Path */}
                <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 uppercase">Start Point</div>
                        <div className="text-sm font-semibold text-gray-900">{route.start_point}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 uppercase">End Point</div>
                        <div className="text-sm font-semibold text-gray-900">{route.end_point}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleSetStatus(route, 'active')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        route.status === 'active'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleSetStatus(route, 'maintenance')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        route.status === 'maintenance'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <BuildIcon className="w-3.5 h-3.5" />
                        <span>Maintenance</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleSetStatus(route, 'inactive')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        route.status === 'inactive'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <PauseCircleIcon className="w-3.5 h-3.5" />
                        <span>Inactive</span>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg font-semibold text-xs hover:bg-gray-800 transition-colors">
                      <VideocamIcon className="w-3.5 h-3.5" />
                      <span>View Stream</span>
                    </button>
                    <button 
                      onClick={() => openEditRoute(route)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteRoute(route)}
                      className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Route Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingRoute ? 'Edit Route' : 'Add Route'}
              </h2>
              <button 
                onClick={closeDialog}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Route Name *</label>
                <input
                  type="text"
                  value={formData.route_name}
                  onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter route name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bus Number *</label>
                <input
                  type="text"
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter bus number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Point *</label>
                  <input
                    type="text"
                    value={formData.start_point}
                    onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter start point"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Point *</label>
                  <input
                    type="text"
                    value={formData.end_point}
                    onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter end point"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Device ID *</label>
                <input
                  type="text"
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., 202600002179"
                />
                <p className="text-xs text-gray-500 mt-1">Unique device identifier for GPS tracking</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Stops</label>
                  <input
                    type="number"
                    value={formData.total_stops}
                    onChange={(e) => setFormData({ ...formData, total_stops: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Time</label>
                  <input
                    type="text"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., 30 min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RouteStatus })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Start Point Coordinates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.start_latitude}
                      onChange={(e) => setFormData({ ...formData, start_latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., 23.0225"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.start_longitude}
                      onChange={(e) => setFormData({ ...formData, start_longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., 72.5714"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">End Point Coordinates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.end_latitude}
                      onChange={(e) => setFormData({ ...formData, end_latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., 23.0225"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.end_longitude}
                      onChange={(e) => setFormData({ ...formData, end_longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="e.g., 72.5714"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={closeDialog}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveRoute}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
