'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase, getRoutes, getLatestGps, type GpsPoint } from '@/lib/supabase'

const MapComponent = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})

export default function TrackingPage() {
  const [livePoint, setLivePoint] = useState<GpsPoint | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to real-time GPS updates from Supabase
    const channel = supabase
      .channel('gps_data-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_data'
        },
        (payload) => {
          const newGpsPoint = payload.new as GpsPoint
          console.log('[TRACKING] Real-time GPS update received:', newGpsPoint)
          setLivePoint(newGpsPoint)
        }
      )
      .subscribe((status) => {
        console.log('[TRACKING] Realtime subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[TRACKING] Successfully subscribed to GPS realtime updates')
        }
      })

    // Load initial GPS data
    const loadInitialData = async () => {
      try {
        const routes = await getRoutes()
        if (routes.length > 0 && routes[0].device_id) {
          const latestGps = await getLatestGps(routes[0].device_id)
          if (latestGps) {
            setLivePoint(latestGps)
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading initial GPS data:', error)
        setLoading(false)
      }
    }

    loadInitialData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const routes = await getRoutes()
      if (routes.length > 0 && routes[0].device_id) {
        const latestGps = await getLatestGps(routes[0].device_id)
        if (latestGps) {
          setLivePoint(latestGps)
        }
      }
      // Trigger map refresh
      if (typeof window !== 'undefined' && (window as any).__mapRefresh) {
        (window as any).__mapRefresh()
      }
    } catch (error) {
      console.error('Error refreshing GPS data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Real-time Tracking Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Real-time Tracking</h1>
              <p className="text-xs text-gray-500">Live GPS tracking with real-time map updates</p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Refresh</span>
          </button>
        </div>
      </div>

      {/* Live GPS Status */}
      {livePoint && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg font-semibold text-xs ${
              livePoint ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {livePoint ? (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{livePoint.device_id} · {livePoint.speed?.toFixed(0) || 0} km/h</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  <span>Waiting for data…</span>
                </div>
              )}
            </div>
            {livePoint && (
              <div className="flex items-center gap-4 flex-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray-600">
                    <span className="font-semibold">Coordinates:</span>{' '}
                    {livePoint.latitude.toFixed(4)}, {livePoint.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-600">
                    <span className="font-semibold">Last Update:</span>{' '}
                    {new Date(livePoint.gps_time).toLocaleString()}
                  </span>
                </div>
                {livePoint.speed !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs text-gray-600">
                      <span className="font-semibold">Speed:</span> {livePoint.speed.toFixed(0)} km/h
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Map Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Live Map</h2>
            <p className="text-xs text-gray-500">Real-time device tracking</p>
          </div>
        </div>
        <div className="h-[calc(100vh-350px)] rounded-lg overflow-hidden border border-gray-200">
          <MapComponent />
        </div>
      </div>
    </div>
  )
}
