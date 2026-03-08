-- ============================================================================
-- BUS BUDDY LANDING - Sample/Fake Data
-- ============================================================================
-- This file contains sample data for all tables.
-- Run this SQL in your Supabase SQL Editor AFTER running supabase_schema.sql
-- ============================================================================

-- ============================================================================
-- CLEAR EXISTING DATA (Optional - Uncomment if you want to reset)
-- ============================================================================
-- DELETE FROM alarms;
-- DELETE FROM gps_data;
-- DELETE FROM drivers;
-- DELETE FROM bus_routes;

-- ============================================================================
-- TABLE 1: bus_routes - Insert 6 sample bus routes
-- ============================================================================
-- Note: Uses ON CONFLICT to avoid errors if device_id already exists
-- Device ID 202600002179 matches the one used in stream page and alarm.py

INSERT INTO bus_routes (route_name, bus_number, start_point, end_point, device_id, total_stops, estimated_time, status, start_coordinates, end_coordinates) VALUES
    ('Route A - School to Depot', 'GJ-01-AB-1234', 'Ahmedabad Central Station', 'Science City', '202600002179', 15, '45 mins', 'active', '23.0225,72.5714', '23.0817,72.6361'),
    ('Route B - Airport Express', 'GJ-01-CD-5678', 'Ahmedabad Airport', 'Gandhinagar', '202600002180', 8, '60 mins', 'active', '23.0772,72.6347', '23.2156,72.6369'),
    ('Route C - City Circle', 'GJ-01-EF-9012', 'Maninagar', 'Vastrapur', '202600002181', 22, '90 mins', 'active', '23.0086,72.5983', '23.0330,72.5083'),
    ('Route D - University Line', 'GJ-01-GH-3456', 'Gujarat University', 'Navrangpura', '202600002182', 12, '35 mins', 'maintenance', '23.0400,72.5500', '23.0500,72.5700'),
    ('Route E - Industrial Zone', 'GJ-01-IJ-7890', 'Naroda', 'Odhav', '202600002183', 18, '55 mins', 'active', '23.0700,72.6500', '23.0900,72.6800'),
    ('Route F - Night Service', 'GJ-01-KL-2468', 'Isanpur', 'Bopal', '202600002184', 10, '40 mins', 'inactive', '23.0100,72.5800', '23.0200,72.4800')
ON CONFLICT (device_id) DO NOTHING;

-- ============================================================================
-- TABLE 2: gps_data - Insert GPS tracking data for all routes
-- ============================================================================
-- Multiple GPS points for each route over the past 24 hours

INSERT INTO gps_data (device_id, latitude, longitude, speed, gps_time) VALUES
    -- Route A (202600002179) - 10 GPS points
    ('202600002179', 23.022500, 72.571400, 0.0, NOW() - INTERVAL '2 hours'),
    ('202600002179', 23.025000, 72.573000, 35.5, NOW() - INTERVAL '1 hour 50 minutes'),
    ('202600002179', 23.028000, 72.575000, 42.3, NOW() - INTERVAL '1 hour 40 minutes'),
    ('202600002179', 23.032000, 72.578000, 38.7, NOW() - INTERVAL '1 hour 30 minutes'),
    ('202600002179', 23.036000, 72.580000, 45.2, NOW() - INTERVAL '1 hour 20 minutes'),
    ('202600002179', 23.040000, 72.582000, 40.1, NOW() - INTERVAL '1 hour 10 minutes'),
    ('202600002179', 23.045000, 72.585000, 50.3, NOW() - INTERVAL '1 hour'),
    ('202600002179', 23.050000, 72.588000, 35.8, NOW() - INTERVAL '50 minutes'),
    ('202600002179', 23.060000, 72.592000, 28.4, NOW() - INTERVAL '40 minutes'),
    ('202600002179', 23.081700, 72.636100, 0.0, NOW() - INTERVAL '30 minutes'),
    
    -- Route B (202600002180) - 8 GPS points
    ('202600002180', 23.077200, 72.634700, 0.0, NOW() - INTERVAL '3 hours'),
    ('202600002180', 23.080000, 72.638000, 55.2, NOW() - INTERVAL '2 hours 45 minutes'),
    ('202600002180', 23.085000, 72.642000, 60.5, NOW() - INTERVAL '2 hours 30 minutes'),
    ('202600002180', 23.100000, 72.650000, 58.3, NOW() - INTERVAL '2 hours 15 minutes'),
    ('202600002180', 23.120000, 72.655000, 62.1, NOW() - INTERVAL '2 hours'),
    ('202600002180', 23.150000, 72.660000, 55.7, NOW() - INTERVAL '1 hour 30 minutes'),
    ('202600002180', 23.180000, 72.630000, 48.9, NOW() - INTERVAL '1 hour'),
    ('202600002180', 23.215600, 72.636900, 0.0, NOW() - INTERVAL '30 minutes'),
    
    -- Route C (202600002181) - 12 GPS points
    ('202600002181', 23.008600, 72.598300, 0.0, NOW() - INTERVAL '4 hours'),
    ('202600002181', 23.010000, 72.600000, 25.3, NOW() - INTERVAL '3 hours 50 minutes'),
    ('202600002181', 23.012000, 72.595000, 30.5, NOW() - INTERVAL '3 hours 40 minutes'),
    ('202600002181', 23.015000, 72.590000, 28.7, NOW() - INTERVAL '3 hours 30 minutes'),
    ('202600002181', 23.018000, 72.585000, 32.1, NOW() - INTERVAL '3 hours 20 minutes'),
    ('202600002181', 23.020000, 72.580000, 27.4, NOW() - INTERVAL '3 hours 10 minutes'),
    ('202600002181', 23.022000, 72.575000, 35.2, NOW() - INTERVAL '3 hours'),
    ('202600002181', 23.025000, 72.570000, 30.8, NOW() - INTERVAL '2 hours 50 minutes'),
    ('202600002181', 23.028000, 72.565000, 33.5, NOW() - INTERVAL '2 hours 40 minutes'),
    ('202600002181', 23.030000, 72.560000, 29.1, NOW() - INTERVAL '2 hours 30 minutes'),
    ('202600002181', 23.032000, 72.555000, 31.7, NOW() - INTERVAL '2 hours 20 minutes'),
    ('202600002181', 23.033000, 72.508300, 0.0, NOW() - INTERVAL '2 hours'),
    
    -- Route D (202600002182) - 6 GPS points (in maintenance)
    ('202600002182', 23.040000, 72.550000, 0.0, NOW() - INTERVAL '5 hours'),
    ('202600002182', 23.042000, 72.552000, 20.5, NOW() - INTERVAL '4 hours 50 minutes'),
    ('202600002182', 23.044000, 72.554000, 18.3, NOW() - INTERVAL '4 hours 40 minutes'),
    ('202600002182', 23.046000, 72.556000, 22.1, NOW() - INTERVAL '4 hours 30 minutes'),
    ('202600002182', 23.048000, 72.558000, 19.7, NOW() - INTERVAL '4 hours 20 minutes'),
    ('202600002182', 23.050000, 72.570000, 0.0, NOW() - INTERVAL '4 hours'),
    
    -- Route E (202600002183) - 9 GPS points
    ('202600002183', 23.070000, 72.650000, 0.0, NOW() - INTERVAL '1 hour'),
    ('202600002183', 23.072000, 72.652000, 40.2, NOW() - INTERVAL '50 minutes'),
    ('202600002183', 23.074000, 72.654000, 45.5, NOW() - INTERVAL '40 minutes'),
    ('202600002183', 23.076000, 72.656000, 42.8, NOW() - INTERVAL '30 minutes'),
    ('202600002183', 23.078000, 72.658000, 48.1, NOW() - INTERVAL '20 minutes'),
    ('202600002183', 23.080000, 72.660000, 44.3, NOW() - INTERVAL '10 minutes'),
    ('202600002183', 23.082000, 72.662000, 46.7, NOW() - INTERVAL '5 minutes'),
    ('202600002183', 23.085000, 72.665000, 43.9, NOW() - INTERVAL '2 minutes'),
    ('202600002183', 23.090000, 72.680000, 0.0, NOW()),
    
    -- Route F (202600002184) - 5 GPS points (inactive)
    ('202600002184', 23.010000, 72.580000, 0.0, NOW() - INTERVAL '12 hours'),
    ('202600002184', 23.012000, 72.575000, 35.2, NOW() - INTERVAL '11 hours 50 minutes'),
    ('202600002184', 23.014000, 72.570000, 38.5, NOW() - INTERVAL '11 hours 40 minutes'),
    ('202600002184', 23.016000, 72.565000, 32.1, NOW() - INTERVAL '11 hours 30 minutes'),
    ('202600002184', 23.020000, 72.480000, 0.0, NOW() - INTERVAL '11 hours');

-- ============================================================================
-- TABLE 3: alarms - Insert various alarm types for different routes
-- ============================================================================

INSERT INTO alarms (device_id, type, description, severity, status, arm_date, arm_time) VALUES
    -- Route A alarms
    ('202600002179', 'PHONE_USAGE', 'SBAC=123456789012345678901234567890', 'high', 'new', CURRENT_DATE, '08:15:00'),
    ('202600002179', 'Driver_Fatigue', 'SBAC=123456789012345678901234567890', 'critical', 'acknowledged', CURRENT_DATE - INTERVAL '1 day', '14:30:00'),
    ('202600002179', 'Harsh_Braking', 'SBAC=123456789012345678901234567890', 'high', 'resolved', CURRENT_DATE - INTERVAL '2 days', '10:45:00'),
    ('202600002179', 'Lane_Departure', 'SBAC=123456789012345678901234567890', 'high', 'new', CURRENT_DATE - INTERVAL '1 day', '16:20:00'),
    
    -- Route B alarms
    ('202600002180', 'Smoking', 'SBAC=123456789012345678901234567890', 'medium', 'new', CURRENT_DATE, '09:00:00'),
    ('202600002180', 'Driver_Distraction', 'SBAC=123456789012345678901234567890', 'high', 'acknowledged', CURRENT_DATE - INTERVAL '1 day', '11:15:00'),
    ('202600002180', 'Front_Predetection', 'SBAC=123456789012345678901234567890', 'critical', 'new', CURRENT_DATE, '13:45:00'),
    
    -- Route C alarms
    ('202600002181', 'CAMERA_BLOCKING', 'SBAC=123456789012345678901234567890', 'medium', 'resolved', CURRENT_DATE - INTERVAL '3 days', '07:30:00'),
    ('202600002181', 'PHONE_USAGE', 'SBAC=123456789012345678901234567890', 'high', 'new', CURRENT_DATE - INTERVAL '1 day', '15:00:00'),
    ('202600002181', 'Coolide', 'SBAC=123456789012345678901234567890', 'critical', 'acknowledged', CURRENT_DATE - INTERVAL '2 days', '12:20:00'),
    ('202600002181', 'park', 'SBAC=123456789012345678901234567890', 'low', 'resolved', CURRENT_DATE - INTERVAL '1 day', '18:00:00'),
    
    -- Route D alarms (maintenance route)
    ('202600002182', 'Harsh_Braking', 'SBAC=123456789012345678901234567890', 'high', 'new', CURRENT_DATE - INTERVAL '5 days', '10:00:00'),
    
    -- Route E alarms
    ('202600002183', 'Driver_Fatigue', 'SBAC=123456789012345678901234567890', 'critical', 'new', CURRENT_DATE, '06:30:00'),
    ('202600002183', 'Lane_Departure', 'SBAC=123456789012345678901234567890', 'high', 'acknowledged', CURRENT_DATE - INTERVAL '1 day', '14:15:00'),
    ('202600002183', 'PHONE_USAGE', 'SBAC=123456789012345678901234567890', 'high', 'new', CURRENT_DATE, '11:00:00'),
    ('202600002183', 'Smoking', 'SBAC=123456789012345678901234567890', 'medium', 'resolved', CURRENT_DATE - INTERVAL '2 days', '09:45:00'),
    
    -- Route F alarms (inactive route)
    ('202600002184', 'Driver_Distraction', 'SBAC=123456789012345678901234567890', 'high', 'resolved', CURRENT_DATE - INTERVAL '7 days', '22:30:00');

-- ============================================================================
-- TABLE 4: drivers - Insert driver information
-- ============================================================================

INSERT INTO drivers (name, phone, licence_expiry, device_id, status) VALUES
    ('Rajesh Kumar', '+91-9876543210', '2025-12-31', '202600002179', 'active'),
    ('Priya Patel', '+91-9876543211', '2026-03-15', '202600002180', 'active'),
    ('Amit Shah', '+91-9876543212', '2025-08-20', '202600002181', 'active'),
    ('Sneha Desai', '+91-9876543213', '2026-06-10', '202600002182', 'on_leave'),
    ('Vikram Mehta', '+91-9876543214', '2025-11-05', '202600002183', 'active'),
    ('Anjali Joshi', '+91-9876543215', '2024-12-31', '202600002184', 'inactive'),
    ('Rahul Sharma', '+91-9876543216', '2026-09-30', NULL, 'active'),
    ('Kavita Reddy', '+91-9876543217', '2025-07-18', NULL, 'active');

-- ============================================================================
-- TABLE 5: geofences - Insert geofence definitions
-- ============================================================================

INSERT INTO geofences (name, description, center_latitude, center_longitude, radius_meters, type, status, device_id) VALUES
    ('Ahmedabad Central Depot', 'Main bus depot and maintenance facility', 23.022500, 72.571400, 500, 'depot', 'active', '202600002179'),
    ('Science City Terminal', 'Terminal point for Route A', 23.081700, 72.636100, 300, 'stop', 'active', '202600002179'),
    ('Airport Terminal Zone', 'Airport pickup and drop zone', 23.077200, 72.634700, 400, 'inclusion', 'active', '202600002180'),
    ('Gandhinagar Station', 'Gandhinagar bus station', 23.215600, 72.636900, 350, 'stop', 'active', '202600002180'),
    ('Maninagar Hub', 'Maninagar bus hub', 23.008600, 72.598300, 450, 'depot', 'active', '202600002181'),
    ('Vastrapur Terminal', 'Vastrapur terminal point', 23.033000, 72.508300, 300, 'stop', 'active', '202600002181'),
    ('Gujarat University Campus', 'University campus area', 23.040000, 72.550000, 600, 'inclusion', 'active', '202600002182'),
    ('Navrangpura Station', 'Navrangpura bus station', 23.050000, 72.570000, 250, 'stop', 'active', '202600002182'),
    ('Naroda Industrial Zone', 'Industrial area zone', 23.070000, 72.650000, 800, 'inclusion', 'active', '202600002183'),
    ('Odhav Terminal', 'Odhav terminal point', 23.090000, 72.680000, 300, 'stop', 'active', '202600002183'),
    ('Isanpur Depot', 'Isanpur maintenance depot', 23.010000, 72.580000, 500, 'depot', 'active', '202600002184'),
    ('Bopal Terminal', 'Bopal terminal point', 23.020000, 72.480000, 300, 'stop', 'active', '202600002184');

-- ============================================================================
-- TABLE 6: geofence_events - Insert geofence entry/exit and overstay events
-- ============================================================================

INSERT INTO geofence_events (geofence_id, device_id, event_type, latitude, longitude, event_time, duration_minutes, status) VALUES
    -- Route A geofence events
    (1, '202600002179', 'entry', 23.022500, 72.571400, NOW() - INTERVAL '2 hours', NULL, 'active'),
    (2, '202600002179', 'entry', 23.081700, 72.636100, NOW() - INTERVAL '30 minutes', 15, 'resolved'),
    (2, '202600002179', 'exit', 23.081700, 72.636100, NOW() - INTERVAL '15 minutes', NULL, 'resolved'),
    
    -- Route B geofence events
    (3, '202600002180', 'entry', 23.077200, 72.634700, NOW() - INTERVAL '3 hours', NULL, 'active'),
    (3, '202600002180', 'exit', 23.078000, 72.635000, NOW() - INTERVAL '2 hours 45 minutes', 15, 'resolved'),
    (4, '202600002180', 'entry', 23.215600, 72.636900, NOW() - INTERVAL '30 minutes', 25, 'active'),
    (4, '202600002180', 'overstay', 23.215600, 72.636900, NOW() - INTERVAL '5 minutes', 25, 'active'),
    
    -- Route C geofence events
    (5, '202600002181', 'entry', 23.008600, 72.598300, NOW() - INTERVAL '4 hours', NULL, 'active'),
    (6, '202600002181', 'entry', 23.033000, 72.508300, NOW() - INTERVAL '2 hours', 10, 'resolved'),
    (6, '202600002181', 'exit', 23.033000, 72.508300, NOW() - INTERVAL '1 hour 50 minutes', NULL, 'resolved'),
    
    -- Route E geofence events
    (9, '202600002183', 'entry', 23.070000, 72.650000, NOW() - INTERVAL '1 hour', NULL, 'active'),
    (10, '202600002183', 'entry', 23.090000, 72.680000, NOW(), 20, 'active'),
    (10, '202600002183', 'overstay', 23.090000, 72.680000, NOW() - INTERVAL '5 minutes', 20, 'active');

-- ============================================================================
-- TABLE 7: overspeed_events - Insert overspeed violations
-- ============================================================================

INSERT INTO overspeed_events (device_id, speed_kmh, speed_limit_kmh, latitude, longitude, event_time, duration_seconds, status) VALUES
    -- Route A overspeed events
    ('202600002179', 75.5, 60, 23.045000, 72.585000, NOW() - INTERVAL '1 hour', 45, 'active'),
    ('202600002179', 68.2, 60, 23.040000, 72.582000, NOW() - INTERVAL '1 hour 10 minutes', 30, 'acknowledged'),
    ('202600002179', 72.8, 60, 23.036000, 72.580000, NOW() - INTERVAL '1 hour 20 minutes', 60, 'resolved'),
    
    -- Route B overspeed events
    ('202600002180', 85.3, 70, 23.120000, 72.655000, NOW() - INTERVAL '2 hours', 90, 'active'),
    ('202600002180', 78.5, 70, 23.100000, 72.650000, NOW() - INTERVAL '2 hours 15 minutes', 45, 'acknowledged'),
    
    -- Route C overspeed events
    ('202600002181', 55.2, 50, 23.022000, 72.575000, NOW() - INTERVAL '3 hours', 20, 'resolved'),
    
    -- Route E overspeed events
    ('202600002183', 70.8, 60, 23.082000, 72.662000, NOW() - INTERVAL '5 minutes', 30, 'active'),
    ('202600002183', 65.5, 60, 23.078000, 72.658000, NOW() - INTERVAL '20 minutes', 25, 'acknowledged');

-- ============================================================================
-- TABLE 8: soc_status - Insert State of Charge (battery) status data
-- ============================================================================

INSERT INTO soc_status (device_id, soc_percentage, voltage, current_amps, temperature_celsius, status, recorded_at) VALUES
    -- Route A SOC status
    ('202600002179', 85.5, 48.2, 12.5, 28.5, 'discharging', NOW() - INTERVAL '30 minutes'),
    ('202600002179', 87.2, 48.5, 15.2, 29.0, 'discharging', NOW() - INTERVAL '1 hour'),
    ('202600002179', 90.0, 49.0, 8.5, 27.5, 'idle', NOW() - INTERVAL '2 hours'),
    
    -- Route B SOC status
    ('202600002180', 72.3, 46.8, 18.5, 32.0, 'discharging', NOW() - INTERVAL '30 minutes'),
    ('202600002180', 75.1, 47.2, 16.8, 31.5, 'discharging', NOW() - INTERVAL '1 hour'),
    ('202600002180', 78.5, 47.5, 14.2, 30.5, 'discharging', NOW() - INTERVAL '2 hours'),
    
    -- Route C SOC status
    ('202600002181', 45.2, 44.5, 22.5, 35.0, 'discharging', NOW() - INTERVAL '2 hours'),
    ('202600002181', 48.5, 45.0, 20.8, 34.5, 'discharging', NOW() - INTERVAL '3 hours'),
    ('202600002181', 35.0, 43.0, 25.2, 36.0, 'low', NOW() - INTERVAL '4 hours'),
    
    -- Route D SOC status (in maintenance)
    ('202600002182', 95.5, 49.5, 5.2, 26.0, 'charging', NOW() - INTERVAL '4 hours'),
    ('202600002182', 92.8, 49.2, 6.5, 26.5, 'charging', NOW() - INTERVAL '5 hours'),
    
    -- Route E SOC status
    ('202600002183', 88.5, 48.8, 10.5, 28.0, 'discharging', NOW()),
    ('202600002183', 90.2, 49.0, 9.8, 27.8, 'discharging', NOW() - INTERVAL '10 minutes'),
    ('202600002183', 92.5, 49.2, 8.2, 27.5, 'idle', NOW() - INTERVAL '30 minutes'),
    
    -- Route F SOC status (inactive)
    ('202600002184', 15.5, 40.5, 0.0, 25.0, 'critical', NOW() - INTERVAL '12 hours');

-- ============================================================================
-- TABLE 9: address_overstay - Insert address overstay events
-- ============================================================================

INSERT INTO address_overstay (device_id, address, latitude, longitude, allowed_duration_minutes, actual_duration_minutes, overstay_minutes, entry_time, exit_time, status) VALUES
    -- Route A address overstay
    ('202600002179', 'Science City Terminal, Ahmedabad', 23.081700, 72.636100, 10, 25, 15, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '5 minutes', 'resolved'),
    ('202600002179', 'Ahmedabad Central Station', 23.022500, 72.571400, 15, 30, 15, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes', 'resolved'),
    
    -- Route B address overstay
    ('202600002180', 'Gandhinagar Bus Station', 23.215600, 72.636900, 20, 45, 25, NOW() - INTERVAL '30 minutes', NULL, 'active'),
    ('202600002180', 'Airport Terminal Zone', 23.077200, 72.634700, 15, 35, 20, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 25 minutes', 'resolved'),
    
    -- Route C address overstay
    ('202600002181', 'Vastrapur Terminal', 23.033000, 72.508300, 10, 20, 10, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 40 minutes', 'resolved'),
    
    -- Route E address overstay
    ('202600002183', 'Odhav Terminal', 23.090000, 72.680000, 15, 35, 20, NOW(), NULL, 'active'),
    ('202600002183', 'Naroda Industrial Zone', 23.070000, 72.650000, 30, 50, 20, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '10 minutes', 'resolved');

-- ============================================================================
-- TABLE 10: fuel_consumption - Insert fuel consumption and distance data
-- ============================================================================

INSERT INTO fuel_consumption (device_id, fuel_liters, distance_km, start_latitude, start_longitude, end_latitude, end_longitude, start_time, end_time) VALUES
    -- Route A fuel consumption (today)
    ('202600002179', 25.5, 145.8, 23.022500, 72.571400, 23.081700, 72.636100, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
    ('202600002179', 18.2, 98.5, 23.081700, 72.636100, 23.022500, 72.571400, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
    
    -- Route B fuel consumption
    ('202600002180', 32.8, 185.2, 23.077200, 72.634700, 23.215600, 72.636900, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '30 minutes'),
    ('202600002180', 28.5, 162.3, 23.215600, 72.636900, 23.077200, 72.634700, NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours'),
    
    -- Route C fuel consumption
    ('202600002181', 45.2, 198.5, 23.008600, 72.598300, 23.033000, 72.508300, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours'),
    ('202600002181', 42.8, 187.2, 23.033000, 72.508300, 23.008600, 72.598300, NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'),
    
    -- Route D fuel consumption (maintenance)
    ('202600002182', 12.5, 45.2, 23.040000, 72.550000, 23.050000, 72.570000, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours'),
    
    -- Route E fuel consumption
    ('202600002183', 22.8, 128.5, 23.070000, 72.650000, 23.090000, 72.680000, NOW() - INTERVAL '1 hour', NOW()),
    ('202600002183', 20.5, 115.2, 23.090000, 72.680000, 23.070000, 72.650000, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
    
    -- Route F fuel consumption (inactive)
    ('202600002184', 15.2, 78.3, 23.010000, 72.580000, 23.020000, 72.480000, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours');

-- ============================================================================
-- VERIFICATION QUERIES (Optional - Run to check data)
-- ============================================================================

-- Check counts
-- SELECT 'bus_routes' as table_name, COUNT(*) as count FROM bus_routes
-- UNION ALL
-- SELECT 'gps_data', COUNT(*) FROM gps_data
-- UNION ALL
-- SELECT 'alarms', COUNT(*) FROM alarms
-- UNION ALL
-- SELECT 'drivers', COUNT(*) FROM drivers
-- UNION ALL
-- SELECT 'geofences', COUNT(*) FROM geofences
-- UNION ALL
-- SELECT 'geofence_events', COUNT(*) FROM geofence_events
-- UNION ALL
-- SELECT 'overspeed_events', COUNT(*) FROM overspeed_events
-- UNION ALL
-- SELECT 'soc_status', COUNT(*) FROM soc_status
-- UNION ALL
-- SELECT 'address_overstay', COUNT(*) FROM address_overstay
-- UNION ALL
-- SELECT 'fuel_consumption', COUNT(*) FROM fuel_consumption;

-- Check route details with driver info
-- SELECT 
--     br.route_name,
--     br.bus_number,
--     br.status as route_status,
--     d.name as driver_name,
--     d.phone as driver_phone,
--     d.licence_expiry
-- FROM bus_routes br
-- LEFT JOIN drivers d ON br.device_id = d.device_id
-- ORDER BY br.route_name;

-- Check latest GPS data per route
-- SELECT 
--     br.route_name,
--     gd.latitude,
--     gd.longitude,
--     gd.speed,
--     gd.gps_time
-- FROM bus_routes br
-- INNER JOIN gps_data gd ON br.device_id = gd.device_id
-- WHERE gd.gps_time = (
--     SELECT MAX(gps_time) 
--     FROM gps_data 
--     WHERE device_id = br.device_id
-- )
-- ORDER BY br.route_name;

-- Check alarm summary
-- SELECT 
--     br.route_name,
--     a.type,
--     a.severity,
--     a.status,
--     a.arm_date,
--     a.arm_time
-- FROM alarms a
-- INNER JOIN bus_routes br ON a.device_id = br.device_id
-- ORDER BY a.created_at DESC
-- LIMIT 20;

-- Check geofence summary
-- SELECT 
--     g.name as geofence_name,
--     g.type,
--     g.status,
--     br.route_name,
--     COUNT(ge.id) as event_count
-- FROM geofences g
-- LEFT JOIN geofence_events ge ON g.id = ge.geofence_id
-- LEFT JOIN bus_routes br ON g.device_id = br.device_id
-- GROUP BY g.id, g.name, g.type, g.status, br.route_name
-- ORDER BY g.name;

-- Check overspeed summary for today
-- SELECT 
--     br.route_name,
--     COUNT(*) as overspeed_count,
--     MAX(oe.speed_kmh) as max_speed,
--     AVG(oe.speed_kmh) as avg_speed
-- FROM overspeed_events oe
-- INNER JOIN bus_routes br ON oe.device_id = br.device_id
-- WHERE DATE(oe.event_time) = CURRENT_DATE
-- GROUP BY br.route_name
-- ORDER BY overspeed_count DESC;

-- Check SOC status summary
-- SELECT 
--     br.route_name,
--     ss.soc_percentage,
--     ss.status,
--     ss.recorded_at
-- FROM soc_status ss
-- INNER JOIN bus_routes br ON ss.device_id = br.device_id
-- WHERE ss.recorded_at = (
--     SELECT MAX(recorded_at) 
--     FROM soc_status 
--     WHERE device_id = ss.device_id
-- )
-- ORDER BY br.route_name;

-- Check address overstay summary
-- SELECT 
--     br.route_name,
--     ao.address,
--     ao.overstay_minutes,
--     ao.status,
--     ao.entry_time
-- FROM address_overstay ao
-- INNER JOIN bus_routes br ON ao.device_id = br.device_id
-- WHERE DATE(ao.entry_time) = CURRENT_DATE
-- ORDER BY ao.overstay_minutes DESC;

-- Check fuel consumption summary
-- SELECT 
--     br.route_name,
--     SUM(fc.fuel_liters) as total_fuel,
--     SUM(fc.distance_km) as total_distance,
--     AVG(fc.fuel_efficiency_kmpl) as avg_efficiency
-- FROM fuel_consumption fc
-- INNER JOIN bus_routes br ON fc.device_id = br.device_id
-- WHERE DATE(fc.start_time) = CURRENT_DATE
-- GROUP BY br.route_name
-- ORDER BY total_distance DESC;

-- ============================================================================
-- END OF SAMPLE DATA
-- ============================================================================
