'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLng } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getRoutes, getGpsHistory, getLatestGps, type BusRoute, type GpsPoint } from '@/lib/supabase'

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (Icon.Default.prototype as any)._getIconUrl
  Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// Default Ahmedabad coordinates (matching gps_tracker.py)
const DEFAULT_LATITUDE = 23.0225
const DEFAULT_LONGITUDE = 72.5714

// India boundaries for validation
const INDIA_MIN_LAT = 6.5
const INDIA_MAX_LAT = 37.1
const INDIA_MIN_LNG = 68.7
const INDIA_MAX_LNG = 97.3

interface BusMarker {
  route: BusRoute
  gpsPoint: GpsPoint | null
  position: [number, number]
}

// Component to update map bounds when markers change
function MapUpdater({ markers }: { markers: BusMarker[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (markers.length === 0) return
    
    if (markers.length === 1) {
      // Center on single marker
      const marker = markers[0]
      map.flyTo(marker.position, 14, { duration: 1 })
    } else {
      // Fit bounds to show all markers
      const bounds = L.latLngBounds(markers.map(m => m.position))
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1 })
    }
  }, [markers, map])
  
  return null
}

interface MapProps {
  onRefresh?: () => void
}

export default function Map({ onRefresh }: MapProps = {}) {
  const [isClient, setIsClient] = useState(false)
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [markers, setMarkers] = useState<BusMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const gpsPollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshTriggerRef = useRef(0)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if coordinates are within India's boundaries
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

  // Load routes and GPS data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load routes from Supabase
      const routesData = await getRoutes()
      setRoutes(routesData)

      // Load GPS data for each route
      const markersData: BusMarker[] = []
      
      for (const route of routesData) {
        if (!route.device_id) continue

        try {
          const gpsPoint = await getLatestGps(route.device_id)
          
          let lat = DEFAULT_LATITUDE
          let lng = DEFAULT_LONGITUDE
          
          if (gpsPoint) {
            lat = gpsPoint.latitude
            lng = gpsPoint.longitude
            
            // Validate coordinates
            if (!isWithinIndia(lat, lng)) {
              console.warn(
                `Coordinates (${lat}, ${lng}) outside India boundaries. Using default Ahmedabad location.`
              )
              lat = DEFAULT_LATITUDE
              lng = DEFAULT_LONGITUDE
            }
          }
          
          markersData.push({
            route,
            gpsPoint,
            position: [lat, lng] as [number, number]
          })
        } catch (err) {
          console.error(`Error fetching GPS for route ${route.route_name}:`, err)
          // Use default coordinates on error
          markersData.push({
            route,
            gpsPoint: null,
            position: [DEFAULT_LATITUDE, DEFAULT_LONGITUDE] as [number, number]
          })
        }
      }

      setMarkers(markersData)
      setLoading(false)
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load tracking data')
      setLoading(false)
    }
  }

  // Start GPS polling
  const startGpsPolling = () => {
    // Clear existing interval
    if (gpsPollIntervalRef.current) {
      clearInterval(gpsPollIntervalRef.current)
    }

    // Poll every 10 seconds for GPS updates
    gpsPollIntervalRef.current = setInterval(async () => {
      if (routes.length === 0) return

      try {
        const updatedMarkers: BusMarker[] = []
        
        for (const route of routes) {
          if (!route.device_id) continue

          try {
            const gpsPoint = await getLatestGps(route.device_id)
            
            let lat = DEFAULT_LATITUDE
            let lng = DEFAULT_LONGITUDE
            
            if (gpsPoint) {
              lat = gpsPoint.latitude
              lng = gpsPoint.longitude
              
              // Validate coordinates
              if (!isWithinIndia(lat, lng)) {
                lat = DEFAULT_LATITUDE
                lng = DEFAULT_LONGITUDE
              }
            }
            
            updatedMarkers.push({
              route,
              gpsPoint,
              position: [lat, lng] as [number, number]
            })
          } catch (err) {
            console.error(`Error fetching GPS for route ${route.route_name}:`, err)
            updatedMarkers.push({
              route,
              gpsPoint: null,
              position: [DEFAULT_LATITUDE, DEFAULT_LONGITUDE] as [number, number]
            })
          }
        }

        setMarkers(updatedMarkers)
      } catch (err) {
        console.error('Error polling GPS data:', err)
      }
    }, 10000) // 10 seconds

    console.log('[MAP] GPS polling started (every 10 seconds)')
  }

  // Stop GPS polling
  const stopGpsPolling = () => {
    if (gpsPollIntervalRef.current) {
      clearInterval(gpsPollIntervalRef.current)
      gpsPollIntervalRef.current = null
    }
  }

  useEffect(() => {
    if (isClient) {
      loadData()
    }

    return () => {
      stopGpsPolling()
    }
  }, [isClient])

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      // Store refresh function reference
      ;(window as any).__mapRefresh = () => {
        refreshTriggerRef.current++
        loadData()
      }
    }
  }, [onRefresh])

  // Start polling after routes are loaded
  useEffect(() => {
    if (routes.length > 0 && !gpsPollIntervalRef.current) {
      startGpsPolling()
    }
  }, [routes])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const ahmedabadCenter: [number, number] = [DEFAULT_LATITUDE, DEFAULT_LONGITUDE]

  // Create custom bus marker icon
  const createBusIcon = (status: string) => {
    const color = status === 'active' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#6b7280'
    
    return L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${color}, ${color}dd);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        ">
          <span>🚌</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    })
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={markers.length > 0 ? markers[0].position : ahmedabadCenter}
        zoom={markers.length > 0 ? 14 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater markers={markers} />
        {markers.map((marker, index) => (
          <Marker
            key={`${marker.route.id}-${index}`}
            position={marker.position}
            icon={createBusIcon(marker.route.status)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="font-semibold text-base mb-2">{marker.route.route_name}</div>
                <div className="text-sm space-y-1">
                  <div><strong>Bus No:</strong> {marker.route.bus_number}</div>
                  <div><strong>Route:</strong> {marker.route.start_point} → {marker.route.end_point}</div>
                  <div><strong>Status:</strong> {marker.route.status}</div>
                  <div><strong>Device ID:</strong> {marker.route.device_id}</div>
                  {marker.gpsPoint && (
                    <>
                      <div><strong>Speed:</strong> {marker.gpsPoint.speed?.toFixed(1) || 0} km/h</div>
                      <div><strong>Last Update:</strong> {new Date(marker.gpsPoint.gps_time).toLocaleTimeString()}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {marker.gpsPoint.latitude.toFixed(6)}, {marker.gpsPoint.longitude.toFixed(6)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
