-- ============================================================================
-- BUS BUDDY LANDING - Complete Supabase Database Schema
-- ============================================================================
-- This file contains the complete database schema for the Bus Buddy Landing
-- application. Run this SQL in your Supabase SQL Editor to create all tables,
-- indexes, triggers, and security policies.
-- 
-- Tables included:
--   1. bus_routes - Bus route information
--   2. gps_data - GPS tracking data
--   3. alarms - Safety alarms and alerts
--   4. drivers - Driver information
--   5. geofences - Geofence definitions
--   6. geofence_events - Geofence entry/exit/overstay events
--   7. overspeed_events - Overspeed violations
--   8. soc_status - Battery/State of Charge status
--   9. address_overstay - Address overstay events
--  10. fuel_consumption - Fuel consumption and distance data
-- ============================================================================

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABLE 1: bus_routes
-- ============================================================================
-- Stores bus route information including route details, device IDs, and status
-- ============================================================================

CREATE TABLE IF NOT EXISTS bus_routes (
    id BIGSERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    bus_number VARCHAR(50) NOT NULL,
    start_point VARCHAR(255) NOT NULL,
    end_point VARCHAR(255) NOT NULL,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    total_stops INTEGER DEFAULT 0,
    estimated_time VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
    start_coordinates VARCHAR(100),
    end_coordinates VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bus_routes_device_id ON bus_routes(device_id);
CREATE INDEX IF NOT EXISTS idx_bus_routes_status ON bus_routes(status);

DROP TRIGGER IF EXISTS update_bus_routes_updated_at ON bus_routes;
CREATE TRIGGER update_bus_routes_updated_at 
    BEFORE UPDATE ON bus_routes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: gps_data
-- ============================================================================
-- Stores GPS tracking data from bus devices
-- ============================================================================

CREATE TABLE IF NOT EXISTS gps_data (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed NUMERIC(6, 2) DEFAULT 0,
    gps_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_gps_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gps_data_device_id ON gps_data(device_id);
CREATE INDEX IF NOT EXISTS idx_gps_data_gps_time ON gps_data(gps_time DESC);
CREATE INDEX IF NOT EXISTS idx_gps_data_device_time ON gps_data(device_id, gps_time DESC);

-- ============================================================================
-- TABLE 3: alarms
-- ============================================================================
-- Stores safety alarms and alerts from ADAS/DMS systems
-- ============================================================================

CREATE TABLE IF NOT EXISTS alarms (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) CHECK (status IN ('new', 'acknowledged', 'resolved')) DEFAULT 'new',
    arm_date DATE,
    arm_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_alarms_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alarms_device_id ON alarms(device_id);
CREATE INDEX IF NOT EXISTS idx_alarms_created_at ON alarms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alarms_type ON alarms(type);
CREATE INDEX IF NOT EXISTS idx_alarms_status ON alarms(status);
CREATE INDEX IF NOT EXISTS idx_alarms_device_created ON alarms(device_id, created_at DESC);

-- ============================================================================
-- TABLE 4: drivers
-- ============================================================================
-- Stores driver information and license details
-- ============================================================================

CREATE TABLE IF NOT EXISTS drivers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    licence_expiry DATE NOT NULL,
    device_id VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'on_leave')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_drivers_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_drivers_device_id ON drivers(device_id);
CREATE INDEX IF NOT EXISTS idx_drivers_licence_expiry ON drivers(licence_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- ============================================================================
-- TABLE 5: geofences
-- ============================================================================
-- Stores geofence definitions (virtual boundaries) for monitoring areas
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofences (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    center_latitude NUMERIC(10, 7) NOT NULL,
    center_longitude NUMERIC(10, 7) NOT NULL,
    radius_meters NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('inclusion', 'exclusion', 'route', 'depot', 'stop')) DEFAULT 'inclusion',
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    device_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_geofences_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_geofences_device_id ON geofences(device_id);
CREATE INDEX IF NOT EXISTS idx_geofences_status ON geofences(status);
CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(type);

DROP TRIGGER IF EXISTS update_geofences_updated_at ON geofences;
CREATE TRIGGER update_geofences_updated_at 
    BEFORE UPDATE ON geofences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 6: geofence_events
-- ============================================================================
-- Stores geofence entry/exit events and violations
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofence_events (
    id BIGSERIAL PRIMARY KEY,
    geofence_id BIGINT NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) CHECK (event_type IN ('entry', 'exit', 'overstay')) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    status VARCHAR(20) CHECK (status IN ('active', 'resolved')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_geofence_events_geofence_id 
        FOREIGN KEY (geofence_id) 
        REFERENCES geofences(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_geofence_events_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_geofence_events_device_id ON geofence_events(device_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence_id ON geofence_events(geofence_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_event_time ON geofence_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_events_event_type ON geofence_events(event_type);

-- ============================================================================
-- TABLE 7: overspeed_events
-- ============================================================================
-- Stores overspeed violations and alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS overspeed_events (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    speed_kmh NUMERIC(6, 2) NOT NULL,
    speed_limit_kmh NUMERIC(6, 2) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'acknowledged', 'resolved')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_overspeed_events_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_overspeed_events_device_id ON overspeed_events(device_id);
CREATE INDEX IF NOT EXISTS idx_overspeed_events_event_time ON overspeed_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_overspeed_events_status ON overspeed_events(status);
CREATE INDEX IF NOT EXISTS idx_overspeed_events_device_time ON overspeed_events(device_id, event_time DESC);

-- ============================================================================
-- TABLE 8: soc_status
-- ============================================================================
-- Stores State of Charge (battery) status for vehicles
-- ============================================================================

CREATE TABLE IF NOT EXISTS soc_status (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    soc_percentage NUMERIC(5, 2) NOT NULL CHECK (soc_percentage >= 0 AND soc_percentage <= 100),
    voltage NUMERIC(6, 2),
    current_amps NUMERIC(6, 2),
    temperature_celsius NUMERIC(5, 2),
    status VARCHAR(20) CHECK (status IN ('charging', 'discharging', 'idle', 'low', 'critical')) DEFAULT 'idle',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_soc_status_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_soc_status_device_id ON soc_status(device_id);
CREATE INDEX IF NOT EXISTS idx_soc_status_recorded_at ON soc_status(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_soc_status_status ON soc_status(status);
CREATE INDEX IF NOT EXISTS idx_soc_status_device_time ON soc_status(device_id, recorded_at DESC);

-- ============================================================================
-- TABLE 9: address_overstay
-- ============================================================================
-- Stores address overstay events (vehicles staying at locations longer than allowed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS address_overstay (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    allowed_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER NOT NULL,
    overstay_minutes INTEGER NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) CHECK (status IN ('active', 'resolved')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_address_overstay_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_address_overstay_device_id ON address_overstay(device_id);
CREATE INDEX IF NOT EXISTS idx_address_overstay_entry_time ON address_overstay(entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_address_overstay_status ON address_overstay(status);
CREATE INDEX IF NOT EXISTS idx_address_overstay_device_time ON address_overstay(device_id, entry_time DESC);

-- ============================================================================
-- TABLE 10: fuel_consumption
-- ============================================================================
-- Stores fuel consumption and distance data for fuel vs distance analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS fuel_consumption (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    fuel_liters NUMERIC(8, 2) NOT NULL,
    distance_km NUMERIC(8, 2) NOT NULL,
    fuel_efficiency_kmpl NUMERIC(6, 2) GENERATED ALWAYS AS (
        CASE WHEN fuel_liters > 0 THEN distance_km / fuel_liters ELSE 0 END
    ) STORED,
    start_latitude NUMERIC(10, 7),
    start_longitude NUMERIC(10, 7),
    end_latitude NUMERIC(10, 7),
    end_longitude NUMERIC(10, 7),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_fuel_consumption_device_id 
        FOREIGN KEY (device_id) 
        REFERENCES bus_routes(device_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fuel_consumption_device_id ON fuel_consumption(device_id);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_start_time ON fuel_consumption(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_device_time ON fuel_consumption(device_id, start_time DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables for security
-- ============================================================================

ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE overspeed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_overstay ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_consumption ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (anon key can read)
DROP POLICY IF EXISTS "Allow public read access on bus_routes" ON bus_routes;
CREATE POLICY "Allow public read access on bus_routes" 
    ON bus_routes FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on gps_data" ON gps_data;
CREATE POLICY "Allow public read access on gps_data" 
    ON gps_data FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on alarms" ON alarms;
CREATE POLICY "Allow public read access on alarms" 
    ON alarms FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on drivers" ON drivers;
CREATE POLICY "Allow public read access on drivers" 
    ON drivers FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on geofences" ON geofences;
CREATE POLICY "Allow public read access on geofences" 
    ON geofences FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on geofence_events" ON geofence_events;
CREATE POLICY "Allow public read access on geofence_events" 
    ON geofence_events FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on overspeed_events" ON overspeed_events;
CREATE POLICY "Allow public read access on overspeed_events" 
    ON overspeed_events FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on soc_status" ON soc_status;
CREATE POLICY "Allow public read access on soc_status" 
    ON soc_status FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on address_overstay" ON address_overstay;
CREATE POLICY "Allow public read access on address_overstay" 
    ON address_overstay FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public read access on fuel_consumption" ON fuel_consumption;
CREATE POLICY "Allow public read access on fuel_consumption" 
    ON fuel_consumption FOR SELECT 
    USING (true);

-- Note: Service role bypasses RLS automatically, so Python scripts using
-- service_role key can insert/update/delete without additional policies

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
-- Add comments to tables for documentation
-- ============================================================================

COMMENT ON TABLE bus_routes IS 'Stores bus route information including route details, device IDs, and operational status';
COMMENT ON TABLE gps_data IS 'Stores GPS tracking data from bus devices with coordinates, speed, and timestamps';
COMMENT ON TABLE alarms IS 'Stores safety alarms and alerts from ADAS/DMS systems with categorization and severity';
COMMENT ON TABLE drivers IS 'Stores driver information including contact details, license expiry, and assignment to buses';
COMMENT ON TABLE geofences IS 'Stores geofence definitions (virtual boundaries) for monitoring specific areas';
COMMENT ON TABLE geofence_events IS 'Stores geofence entry/exit events and overstay violations';
COMMENT ON TABLE overspeed_events IS 'Stores overspeed violations and alerts when vehicles exceed speed limits';
COMMENT ON TABLE soc_status IS 'Stores State of Charge (battery) status and electrical metrics for vehicles';
COMMENT ON TABLE address_overstay IS 'Stores address overstay events when vehicles remain at locations longer than allowed';
COMMENT ON TABLE fuel_consumption IS 'Stores fuel consumption and distance data for fuel efficiency analysis';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- 
-- Next Steps:
-- 1. Run this schema file in Supabase SQL Editor
-- 2. Run supabase_sample_data.sql to insert sample data
-- 3. Connect your dashboard frontend to query these tables
-- ============================================================================
