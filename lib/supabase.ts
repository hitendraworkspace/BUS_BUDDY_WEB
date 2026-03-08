import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jqgbdzcqfrbuesxpohbq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZ2JkemNxZnJidWVzeHBvaGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTA1NDMsImV4cCI6MjA4ODQ4NjU0M30.7dJ55upWkIElbPFa8L7neVObqqSBMZWE_u5Qepbhyvk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Types
export interface BusRoute {
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

export interface GpsPoint {
  id?: number
  device_id: string
  latitude: number
  longitude: number
  speed: number
  gps_time: string
  created_at?: string
}

// Helper functions
export async function getRoutes(): Promise<BusRoute[]> {
  const { data, error } = await supabase
    .from('bus_routes')
    .select('*')
    .order('route_name')
  
  if (error) {
    console.error('Error fetching routes:', error)
    return []
  }
  
  return (data as BusRoute[]) || []
}

export async function getGpsHistory(limit: number = 10, deviceId?: string | null): Promise<GpsPoint[]> {
  let query = supabase
    .from('gps_data')
    .select('*')
    .order('gps_time', { ascending: false })
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.limit(limit)
  
  if (error) {
    console.error('Error fetching GPS history:', error)
    return []
  }
  
  return (data as GpsPoint[]) || []
}

export async function getLatestGps(deviceId: string): Promise<GpsPoint | null> {
  const { data, error } = await supabase
    .from('gps_data')
    .select('*')
    .eq('device_id', deviceId)
    .order('gps_time', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching latest GPS:', error)
    return null
  }
  
  return data as GpsPoint | null
}

export interface Alarm {
  id: number
  device_id: string
  type: string
  description?: string
  severity?: string
  status?: string
  arm_date?: string
  arm_time?: string
  created_at?: string
}

export interface Driver {
  id: number
  name: string
  phone: string
  licence_expiry: string
  device_id?: string
  status?: string
  created_at?: string
}

export async function getAlarms(limit: number = 20, deviceId?: string | null): Promise<Alarm[]> {
  let query = supabase
    .from('alarms')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.limit(limit)
  
  if (error) {
    console.error('Error fetching alarms:', error)
    return []
  }
  
  return (data as Alarm[]) || []
}

export async function getDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('licence_expiry')
  
  if (error) {
    console.error('Error fetching drivers:', error)
    return []
  }
  
  return (data as Driver[]) || []
}

export async function upsertRoute(route: Partial<BusRoute> & { id?: number }): Promise<void> {
  if (route.id) {
    // Update existing route
    const { id, ...updateData } = route
    const { error } = await supabase
      .from('bus_routes')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating route:', error)
      throw error
    }
  } else {
    // Insert new route
    const { id, ...insertData } = route
    const { error } = await supabase
      .from('bus_routes')
      .insert(insertData)
    
    if (error) {
      console.error('Error inserting route:', error)
      throw error
    }
  }
}

export async function deleteRoute(id: number): Promise<void> {
  const { error } = await supabase
    .from('bus_routes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting route:', error)
    throw error
  }
}

export async function updateRouteStatus(id: number, status: 'active' | 'maintenance' | 'inactive'): Promise<void> {
  const { error } = await supabase
    .from('bus_routes')
    .update({ status })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating route status:', error)
    throw error
  }
}

// New table types and functions
export interface Geofence {
  id: number
  name: string
  description?: string
  center_latitude: number
  center_longitude: number
  radius_meters: number
  type: string
  status: string
  device_id?: string
  created_at?: string
}

export interface GeofenceEvent {
  id: number
  geofence_id: number
  device_id: string
  event_type: 'entry' | 'exit' | 'overstay'
  latitude: number
  longitude: number
  event_time: string
  duration_minutes?: number
  status: string
  created_at?: string
}

export interface OverspeedEvent {
  id: number
  device_id: string
  speed_kmh: number
  speed_limit_kmh: number
  latitude: number
  longitude: number
  event_time: string
  duration_seconds: number
  status: string
  created_at?: string
}

export interface SocStatus {
  id: number
  device_id: string
  soc_percentage: number
  voltage?: number
  current_amps?: number
  temperature_celsius?: number
  status: string
  recorded_at: string
  created_at?: string
}

export interface AddressOverstay {
  id: number
  device_id: string
  address: string
  latitude: number
  longitude: number
  allowed_duration_minutes: number
  actual_duration_minutes: number
  overstay_minutes: number
  entry_time: string
  exit_time?: string
  status: string
  created_at?: string
}

export interface FuelConsumption {
  id: number
  device_id: string
  fuel_liters: number
  distance_km: number
  fuel_efficiency_kmpl: number
  start_latitude?: number
  start_longitude?: number
  end_latitude?: number
  end_longitude?: number
  start_time: string
  end_time: string
  recorded_at?: string
}// Geofence functions
export async function getGeofences(deviceId?: string): Promise<Geofence[]> {
  let query = supabase
    .from('geofences')
    .select('*')
    .eq('status', 'active')
    .order('name')
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching geofences:', error)
    return []
  }
  
  return (data as Geofence[]) || []
}

export async function getGeofenceEvents(dateFilter: 'Today' | 'Week' | 'Month' = 'Today', deviceId?: string): Promise<GeofenceEvent[]> {
  let query = supabase
    .from('geofence_events')
    .select('*')
  
  // Date filter
  const now = new Date()
  let startDate: Date
  if (dateFilter === 'Today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (dateFilter === 'Week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  query = query.gte('event_time', startDate.toISOString())
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.order('event_time', { ascending: false })
  
  if (error) {
    console.error('Error fetching geofence events:', error)
    return []
  }
  
  return (data as GeofenceEvent[]) || []
}

// Overspeed functions
export async function getOverspeedEvents(dateFilter: 'Today' | 'Week' | 'Month' = 'Today', deviceId?: string): Promise<OverspeedEvent[]> {
  let query = supabase
    .from('overspeed_events')
    .select('*')
  
  // Date filter
  const now = new Date()
  let startDate: Date
  if (dateFilter === 'Today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (dateFilter === 'Week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  query = query.gte('event_time', startDate.toISOString())
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.order('event_time', { ascending: false })
  
  if (error) {
    console.error('Error fetching overspeed events:', error)
    return []
  }
  
  return (data as OverspeedEvent[]) || []
}

// SOC Status functions
export async function getSocStatus(deviceId?: string): Promise<SocStatus[]> {
  let query = supabase
    .from('soc_status')
    .select('*')
    .order('recorded_at', { ascending: false })
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.limit(100)
  
  if (error) {
    console.error('Error fetching SOC status:', error)
    return []
  }
  
  return (data as SocStatus[]) || []
}

export async function getLatestSocStatus(deviceId?: string): Promise<SocStatus | null> {
  let query = supabase
    .from('soc_status')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.maybeSingle()
  
  if (error) {
    console.error('Error fetching latest SOC status:', error)
    return null
  }
  
  return data as SocStatus | null
}

// Address Overstay functions
export async function getAddressOverstay(dateFilter: 'Today' | 'Week' | 'Month' = 'Today', deviceId?: string): Promise<AddressOverstay[]> {
  let query = supabase
    .from('address_overstay')
    .select('*')
  
  // Date filter
  const now = new Date()
  let startDate: Date
  if (dateFilter === 'Today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (dateFilter === 'Week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  query = query.gte('entry_time', startDate.toISOString())
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.order('entry_time', { ascending: false })
  
  if (error) {
    console.error('Error fetching address overstay:', error)
    return []
  }
  
  return (data as AddressOverstay[]) || []
}

// Fuel Consumption functions
export async function getFuelConsumption(dateFilter: 'Today' | 'Week' | 'Month' = 'Today', deviceId?: string): Promise<FuelConsumption[]> {
  let query = supabase
    .from('fuel_consumption')
    .select('*')
  
  // Date filter
  const now = new Date()
  let startDate: Date
  if (dateFilter === 'Today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (dateFilter === 'Week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  query = query.gte('start_time', startDate.toISOString())
  
  if (deviceId) {
    query = query.eq('device_id', deviceId)
  }
  
  const { data, error } = await query.order('start_time', { ascending: false })
  
  if (error) {
    console.error('Error fetching fuel consumption:', error)
    return []
  }
  
  return (data as FuelConsumption[]) || []
}