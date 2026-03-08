'use client'

import { useState, useEffect } from 'react'
import { getRoutes, type BusRoute } from '@/lib/supabase'
import { LiveTvIcon, PlayIcon, StopIcon, RouteIcon, DirectionsBusIcon, MemoryIcon, CheckCircleIcon, VideocamIcon, VideocamOffIcon, ErrorIcon, RefreshIcon, ScheduleIcon } from '@/app/components/Icons'

export default function StreamPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<BusRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [httpStreamUrl, setHttpStreamUrl] = useState<string | null>(null)
  const [streamLoading, setStreamLoading] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [streamWorking, setStreamWorking] = useState(false)
  const [useDirectStream, setUseDirectStream] = useState(false)

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const routesData = await getRoutes()
      setRoutes(routesData)
      setFilteredRoutes(routesData)
      if (routesData.length > 0 && !selectedRoute) {
        setSelectedRoute(routesData[0])
      }
    } catch (error) {
      console.error('Failed to load routes:', error)
      showError('Failed to load routes')
    }
  }

  const selectRoute = (route: BusRoute) => {
    setSelectedRoute(route)
    if (isStreaming) {
      stopStream()
      setTimeout(() => startStream(), 500)
    }
  }

  const startStream = async () => {
    if (!selectedRoute) {
      showError('Please select a route first')
      return
    }

    setStreamLoading(true)
    setStreamError(null)
    setIsStreaming(false)
    setStreamWorking(false)

    try {
      const deviceId = selectedRoute.device_id

      // CMS API credentials (same as web-angular)
      const username = 'jitchavda'
      const password = 'Admin@123'

      // Start video stream using CMS API
      // Note: This requires CMS API service integration
      // For now, we'll construct the stream URL similar to web-angular
      
      // Wait for stream to be ready
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Get HTTP stream URL (direct stream)
      const httpUrl = `http://15.235.206.64:16611/stream?DevIDNO=${deviceId}&Chn=0`
      setHttpStreamUrl(httpUrl)

      // Player options (same as web-angular)
      const playerOptions = [
        // Option 1: video.html with devIdno, account, and password (working format)
        `http://letrack.in/808gps/open/player/video.html?lang=en&devIdno=${deviceId}&account=${username}&password=${encodeURIComponent(password)}`,
        // Option 2: video.html with vehiIdno, account, and password
        `http://letrack.in/808gps/open/player/video.html?lang=en&vehiIdno=${deviceId}&account=${username}&password=${encodeURIComponent(password)}`,
        // Option 3: video.html with direct user/pwd authentication (old format)
        `http://letrack.in/808gps/open/player/video.html?lang=en&devidno=${deviceId}&channel=0&user=${username}&pwd=${encodeURIComponent(password)}`,
      ]

      // Use first player option
      const playerUrl = playerOptions[0]

      console.log('Stream started:', {
        deviceId,
        playerUrl,
        httpStreamUrl: httpUrl
      })

      // Store options for fallback
      if (typeof window !== 'undefined') {
        (window as any).cmsPlayerOptions = playerOptions
        ;(window as any).cmsHttpStreamUrl = httpUrl
      }

      // Use iframe player with video.html
      setStreamUrl(playerUrl)
      setUseDirectStream(false) // Always use iframe - CMS player handles WebSocket
      setIsStreaming(true)
      setStreamError(null)

      showSuccess('Stream started - loading CMS player...')
    } catch (error: any) {
      console.error('Error starting stream:', error)
      setStreamError(error.message || 'Failed to start stream')
      setIsStreaming(false)
    } finally {
      setStreamLoading(false)
    }
  }

  const stopStream = () => {
    setIsStreaming(false)
    setStreamUrl(null)
    setHttpStreamUrl(null)
    setStreamError(null)
    setStreamWorking(false)
    setUseDirectStream(false)
    showInfo('Stream stopped')
  }

  const switchToDirectStream = () => {
    // Switch from iframe to direct HTTP stream
    setUseDirectStream(true)
    showInfo('Switched to direct HTTP stream')
  }

  const tryNextPlayerUrl = () => {
    if (typeof window === 'undefined') return
    
    const options = (window as any).cmsPlayerOptions || []
    const currentUrl = streamUrl
    const currentIndex = options.findIndex((url: string) => url === currentUrl)

    if (currentIndex < options.length - 1) {
      const nextUrl = options[currentIndex + 1]
      console.log('🔄 Trying next player URL:', nextUrl)
      setStreamUrl(nextUrl)
      showInfo(`Trying player option ${currentIndex + 2} of ${options.length}`)
    } else {
      showError('No more player options to try')
    }
  }

  const onIframeLoad = () => {
    console.log('Video player iframe loaded')

    // Check iframe visibility
    const iframe = document.querySelector('.video-iframe') as HTMLIFrameElement
    if (iframe) {
      const rect = iframe.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Iframe has zero dimensions, switching to direct stream...')
        setTimeout(() => switchToDirectStream(), 2000)
      }
    }

    setStreamWorking(true)
  }

  const onIframeError = () => {
    console.error('Failed to load video player iframe')
    // Auto-switch to direct stream on iframe error
    if (httpStreamUrl) {
      switchToDirectStream()
    } else {
      setStreamError('Failed to load video player')
      setStreamWorking(false)
    }
  }

  const onVideoError = (event: any) => {
    console.error('Video element error:', event)
    setStreamError('Failed to load video stream. Try iframe player instead.')
    setStreamWorking(false)
  }

  const onVideoCanPlay = () => {
    setStreamWorking(true)
    setStreamError(null)
  }

  const openPlayerInNewWindow = () => {
    if (streamUrl) {
      window.open(streamUrl, '_blank', 'width=1200,height=800')
    }
  }

  const showSuccess = (message: string) => {
    // Simple alert for now - can be replaced with toast notification
    console.log('Success:', message)
  }

  const showError = (message: string) => {
    // Simple alert for now - can be replaced with toast notification
    console.error('Error:', message)
  }

  const showInfo = (message: string) => {
    // Simple alert for now - can be replaced with toast notification
    console.log('Info:', message)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <LiveTvIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Video Stream</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time camera feeds from your fleet</p>
            </div>
          </div>
          {!isStreaming ? (
            <button
              onClick={startStream}
              disabled={!selectedRoute || streamLoading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Start Stream</span>
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              <StopIcon className="w-5 h-5" />
              <span>Stop Stream</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Routes Sidebar */}
        <aside className="w-80 bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <RouteIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Routes</h2>
            </div>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
              {filteredRoutes.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RouteIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No routes available</p>
              </div>
            ) : (
              filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => selectRoute(route)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRoute?.id === route.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DirectionsBusIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2">{route.route_name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          <span className="text-gray-500">Bus:</span>
                          {route.bus_number}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          <MemoryIcon className="w-3 h-3" />
                          {route.device_id}
                        </span>
                      </div>
                    </div>
                    {selectedRoute?.id === route.id && (
                      <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Video Player Section */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <VideocamIcon className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedRoute ? selectedRoute.route_name : 'Select a Route'}
                </h2>
                {selectedRoute && (
                  <p className="text-sm text-gray-600 mt-1">
                    Device: {selectedRoute.device_id}
                  </p>
                )}
              </div>
            </div>
            {isStreaming && streamWorking && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-lg">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold text-red-700">LIVE</span>
              </div>
            )}
          </div>

          {/* Video Container */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {/* Placeholder */}
            {!isStreaming && !streamLoading && !streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <VideocamOffIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Stream Active</h3>
                  <p className="text-gray-400">Select a route and click "Start Stream" to begin</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {streamLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white">Starting stream...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <ErrorIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Stream Error</h3>
                  <p className="text-gray-400 mb-4">{streamError}</p>
                  <button
                    onClick={startStream}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                  >
                    <RefreshIcon className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            )}

            {/* Video Player */}
            {isStreaming && !streamLoading && !streamError && (
              <div className="absolute inset-0">
                {/* Iframe Player */}
                {!useDirectStream && streamUrl && (
                  <iframe
                    src={streamUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen; camera; microphone"
                    onLoad={onIframeLoad}
                    onError={onIframeError}
                    title="Live Video Stream"
                  />
                )}

                {/* Direct HTTP Stream (Video Element) */}
                {useDirectStream && httpStreamUrl && (
                  <video
                    src={httpStreamUrl}
                    className="w-full h-full"
                    controls
                    autoPlay
                    playsInline
                    onError={onVideoError}
                    onCanPlay={onVideoCanPlay}
                  />
                )}

                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {streamWorking && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-black bg-opacity-50 rounded-lg">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                      <span className="text-xs font-semibold text-white">LIVE</span>
                    </div>
                  )}
                  <div className="px-3 py-1 bg-black bg-opacity-50 rounded-lg">
                    <span className="text-xs font-semibold text-white">HD</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info */}
          {isStreaming && selectedRoute && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <MemoryIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-600 uppercase block">Device ID</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRoute.device_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <DirectionsBusIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-600 uppercase block">Bus Number</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRoute.bus_number}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <ScheduleIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-600 uppercase block">Status</span>
                  <span className="text-sm font-semibold text-green-600">Streaming</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
