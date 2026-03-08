import requests
import time
from datetime import datetime, timedelta

BASE_URL = "http://15.235.206.64"
USERNAME = "jitchavda"
PASSWORD = "Admin@123"
DEVICE_ID = "202600002179"
POLL_INTERVAL = 10  # seconds

# Supabase config
SUPABASE_URL = "https://jqgbdzcqfrbuesxpohbq.supabase.co"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZ2JkemNxZnJidWVzeHBvaGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTA1NDMsImV4cCI6MjA4ODQ4NjU0M30.7dJ55upWkIElbPFa8L7neVObqqSBMZWE_u5Qepbhyvk"

# Alarm type mapping
ALARM_PAIRS = {
    "PHONE_USAGE": {620, 670},
    "CAMERA_BLOCKING": {734, 784},
    "Driver_Fatigue": {618, 668},
    "Driver_Distraction": {624, 674},
    "Smoking": {622, 672},
    "Harsh_Braking": {721, 771},
    "Front_Predetection": {606, 656},
    "Lane_Departure": {602, 652},
    "Coolide": {600, 650},
    "park" :{247,297}
}

# If True, also upload unmatched alarms for testing
UPLOAD_RAW_IF_NO_MATCH = True

# Time window for pairing alarms (seconds)
PAIRING_WINDOW_SECONDS = 30

# Buffer to store recent alarms for cross-poll pairing
recent_alarms_buffer = []


def check_server_connectivity():
    """Check if server is reachable"""
    import socket
    from urllib.parse import urlparse
    
    try:
        parsed = urlparse(BASE_URL)
        host = parsed.hostname
        port = parsed.port or 80
        
        print(f"[CHECK] Checking server connectivity: {host}:{port}")
        
        # Try TCP connection
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"[OK] Server {host}:{port} is reachable")
            return True
        else:
            print(f"[ERROR] Server {host}:{port} is not reachable (Connection refused)")
            return False
    except Exception as e:
        print(f"[ERROR] Connectivity check failed: {e}")
        return False


def login():
    # First check server connectivity
    if not check_server_connectivity():
        print(f"[⚠️] Server connectivity check failed. Trying login anyway...")
    
    url = f"{BASE_URL}/StandardApiAction_login.action"
    params = {"account": USERNAME, "password": PASSWORD}
    
    print(f"[LOGIN] Attempting login to: {url}")
    
    try:
        res = requests.post(url, params=params, verify=False, timeout=30)
        print(f"[RESPONSE] Response status: {res.status_code}")
        res.raise_for_status()
        data = res.json()
        if data.get("result") == 0:
            print(f"[OK] Logged in. JSESSION: {data['jsession']}")
            return data["jsession"]
        else:
            print(f"[ERROR] Login failed. Result code: {data.get('result')}")
    except requests.exceptions.ConnectionError as e:
        print(f"[ERROR] Connection Error: Cannot connect to server {BASE_URL}")
        print(f"[INFO] Possible causes:")
        print(f"    1. Server is down or not running")
        print(f"    2. Network connectivity issue")
        print(f"    3. Firewall blocking port 80")
        print(f"    4. Incorrect server IP address")
    except Exception as e:
        print(f"[ERROR] Login error: {type(e).__name__}: {e}")
    return None


def parse_date_time_from_desc(desc):
    try:
        if not desc.startswith("SBAC="):
            return None, None

        ts_raw = desc[19:31]  # Extract 12 digits from position 19

        if len(ts_raw) != 12 or not ts_raw.isdigit():
            raise ValueError("Timestamp format invalid")

        year = int(ts_raw[0:2]) + 2000
        month = int(ts_raw[2:4])
        day = int(ts_raw[4:6])
        hour = int(ts_raw[6:8])
        minute = int(ts_raw[8:10])
        second = int(ts_raw[10:12])

        dt = datetime(year, month, day, hour, minute, second)
        return dt.date().isoformat(), dt.time().isoformat()

    except Exception as e:
        print(f"[⚠️] Failed to parse timestamp: {e} | desc: {desc}")
        # Fallback to current time so records are not null
        now = datetime.now()
        return now.date().isoformat(), now.time().isoformat()


def group_alarms(alarms):
    global recent_alarms_buffer
    
    # Add current alarms to buffer with timestamp
    current_time = datetime.now()
    for alarm in alarms:
        alarm['_buffer_timestamp'] = current_time
        recent_alarms_buffer.append(alarm)
    
    # Clean old alarms from buffer (older than PAIRING_WINDOW_SECONDS)
    cutoff_time = current_time - timedelta(seconds=PAIRING_WINDOW_SECONDS)
    recent_alarms_buffer = [a for a in recent_alarms_buffer if a.get('_buffer_timestamp', current_time) > cutoff_time]
    
    print(f"[BUFFER] Current buffer size: {len(recent_alarms_buffer)} alarms")
    
    # Use all alarms in buffer for pairing
    all_alarms = recent_alarms_buffer.copy()
    grouped = []
    used_indices = set()

    def normalize_type(t):
        s = str(t).strip() if t is not None else ""
        try:
            # Try strict int first
            return int(s)
        except Exception:
            try:
                # Try float like '721.0' -> 721
                return int(float(s))
            except Exception:
                # Extract first integer sequence
                import re
                m = re.search(r"-?\d+", s)
                if m:
                    try:
                        return int(m.group(0))
                    except Exception:
                        pass
                return t

    for i in range(len(all_alarms)):
        if i in used_indices:
            continue
        a1 = all_alarms[i]
        t1_raw = a1.get("type")
        t1 = normalize_type(t1_raw)
        for j in range(i + 1, len(all_alarms)):
            if j in used_indices:
                continue
            a2 = all_alarms[j]
            t2_raw = a2.get("type")
            t2 = normalize_type(t2_raw)

            # Debug print: show every comparison
            print(f"[DEBUG] Comparing alarms: {t1} (idx {i}, raw={t1_raw!r}) & {t2} (idx {j}, raw={t2_raw!r})")

            matched_label = None
            for label, pair in ALARM_PAIRS.items():
                # Compare on integers to avoid string vs int mismatches
                try:
                    pair_ints = {int(x) for x in pair}
                except Exception:
                    pair_ints = pair
                current = {t1, t2}
                # Verbose debug when close
                if current == pair_ints:
                    matched_label = label
                    break
                else:
                    # Print one line when either t1 or t2 is in the pair set for easier diagnosis
                    if t1 in pair_ints or t2 in pair_ints:
                        print(f"[DEBUG] Partial match for '{label}': current={current}, expected={pair_ints}")

            if matched_label:
                print(f"[MATCH] Found pair for '{matched_label}' -> {t1} & {t2}")
                used_indices.update({i, j})
                desc = a1.get("desc") or a2.get("desc")
                date_str, time_str = parse_date_time_from_desc(desc)
                grouped.append({
                    "type": matched_label,
                    "arm_date": date_str,
                    "arm_time": time_str,
                    "description": desc,
                    "device_id": DEVICE_ID
                })
            else:
                print(f"[NO MATCH] {t1} & {t2} did not match any ALARM_PAIRS")

    return grouped


def insert_to_supabase(alarms_to_insert):
    if not alarms_to_insert:
        print("[ℹ️] No alarms to upload.")
        return

    url = f"{SUPABASE_URL}/rest/v1/alarms"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    try:
        res = requests.post(url, json=alarms_to_insert, headers=headers)
        ok = 200 <= res.status_code < 300
        if ok:
            print(f"[✅] {len(alarms_to_insert)} alarms uploaded to Supabase. HTTP {res.status_code}")
            if res.text:
                print(f"[🔎] Supabase response: {res.text[:200]}")
        else:
            print(f"[❌] Supabase insert failed HTTP {res.status_code}: {res.text[:300]}")
        res.raise_for_status()
    except Exception as e:
        print(f"[❌] Supabase insert failed: {e} | Response: {res.text if 'res' in locals() else 'No response'}")


def query_alarms_by_range(jsession, dev_id, begin_time=None, end_time=None):
    """
    Query alarms with custom date range
    
    Args:
        jsession: Session token from login
        dev_id: Device ID
        begin_time: Start time in format "YYYY-MM-DD HH:MM:SS" or datetime object
        end_time: End time in format "YYYY-MM-DD HH:MM:SS" or datetime object
    
    Returns:
        List of alarms or None if error
    """
    url = f"{BASE_URL}/StandardApiAction_vehicleAlarm.action"
    params = {
        "jsession": jsession,
        "DevIDNO": dev_id,
        "toMap": 1
    }
    
    # Add date range parameters if provided
    if begin_time:
        if isinstance(begin_time, datetime):
            begin_time = begin_time.strftime("%Y-%m-%d %H:%M:%S")
        params["beginTime"] = begin_time
        params["begintime"] = begin_time  # Try both formats
    
    if end_time:
        if isinstance(end_time, datetime):
            end_time = end_time.strftime("%Y-%m-%d %H:%M:%S")
        params["endTime"] = end_time
        params["endtime"] = end_time  # Try both formats
    
    try:
        print(f"[QUERY] Querying alarms with range: {begin_time} to {end_time}")
        res = requests.get(url, params=params, verify=False, timeout=30)
        res.raise_for_status()
        data = res.json()
        alarms = data.get("alarmlist", [])
        print(f"[✅] Retrieved {len(alarms)} alarms from API")
        return alarms
    except Exception as e:
        print(f"[❌] Alarm query error: {e}")
        return None


def query_reports_by_range(jsession, dev_id, begin_time=None, end_time=None):
    """
    Query reports/history with custom date range
    
    Args:
        jsession: Session token from login
        dev_id: Device ID
        begin_time: Start time in format "YYYY-MM-DD HH:MM:SS" or datetime object
        end_time: End time in format "YYYY-MM-DD HH:MM:SS" or datetime object
    
    Returns:
        Report data or None if error
    """
    # Try multiple report endpoints
    endpoints = [
        "StandardApiAction_queryHistory.action",
        "StandardApiAction_queryHistoryTrack.action",
        "StandardApiAction_getHistory.action",
        "StandardApiAction_queryReport.action"
    ]
    
    for endpoint in endpoints:
        url = f"{BASE_URL}/{endpoint}"
        params = {
            "jsession": jsession,
            "DevIDNO": dev_id,
            "devIdno": dev_id,  # Try both parameter names
            "toMap": 1
        }
        
        # Add date range parameters if provided
        if begin_time:
            if isinstance(begin_time, datetime):
                begin_time_str = begin_time.strftime("%Y-%m-%d %H:%M:%S")
            else:
                begin_time_str = begin_time
            params["beginTime"] = begin_time_str
            params["begintime"] = begin_time_str
            params["beginDate"] = begin_time_str.split()[0]  # Just date part
        
        if end_time:
            if isinstance(end_time, datetime):
                end_time_str = end_time.strftime("%Y-%m-%d %H:%M:%S")
            else:
                end_time_str = end_time
            params["endTime"] = end_time_str
            params["endtime"] = end_time_str
            params["endDate"] = end_time_str.split()[0]  # Just date part
        
        try:
            print(f"[QUERY] Trying endpoint: {endpoint}")
            print(f"[QUERY] Range: {begin_time} to {end_time}")
            res = requests.get(url, params=params, verify=False, timeout=30)
            if res.status_code == 200:
                try:
                    data = res.json()
                    print(f"[✅] Successfully retrieved data from {endpoint}")
                    return data
                except Exception:
                    print(f"[⚠️] {endpoint} returned non-JSON response")
                    continue
        except Exception as e:
            print(f"[⚠️] {endpoint} failed: {e}")
            continue
    
    print(f"[❌] All report endpoints failed")
    return None


def poll_alarms(jsession, dev_id):
    url = f"{BASE_URL}/StandardApiAction_vehicleAlarm.action"
    params = {
        "jsession": jsession,
        "DevIDNO": dev_id,
        "toMap": 1
    }
    try:
        res = requests.get(url, params=params, verify=False)
        res.raise_for_status()
        data = res.json()
        alarms = data.get("alarmlist", [])
        if not alarms:
            print(f"[🟢] No alarms at {datetime.now().strftime('%H:%M:%S')}")
            return

        print(f"[🔔] {len(alarms)} raw alarms received.")

        # NEW: print every raw alarm exactly as returned by the API
        print("[LIST] Raw alarms in this poll (full objects):")
        for idx, alarm in enumerate(alarms, start=1):
            # Print the raw dict so we don't miss any fields (helps debug cases like lane departure)
            print(f"  #{idx:02d} | {alarm!r}")

        # Print unique types for visibility
        try:
            unique_types = sorted({a.get('type') for a in alarms})
            print(f"[ℹ️] Unique raw alarm types in this batch: {unique_types}")
        except Exception:
            pass

        grouped = group_alarms(alarms)

        for g in grouped:
            print(f" • [Grouped Alarm] {g['type']} | Date: {g['arm_date']} | Time: {g['arm_time']}")

        if grouped:
            insert_to_supabase(grouped)
        elif UPLOAD_RAW_IF_NO_MATCH:
            print("[⚠️] No matches found — uploading raw alarms for testing.")
            raw_upload = []
            for a in alarms:
                date_str, time_str = parse_date_time_from_desc(a.get("desc") or "")
                raw_upload.append({
                    "type": str(a.get("type")),
                    "arm_date": date_str,
                    "arm_time": time_str,
                    "description": a.get("desc"),
                    "device_id": DEVICE_ID
                })
            insert_to_supabase(raw_upload)

    except Exception as e:
        print(f"[❌] Alarm poll error: {e}")


def main():
    print("=" * 60)
    print("Alarm Tracker - Starting...")
    print("=" * 60)
    print(f"Server: {BASE_URL}")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Poll Interval: {POLL_INTERVAL} seconds")
    print("=" * 60)
    
    jsession = login()
    if not jsession:
        print("\n[ERROR] Failed to login. Exiting...")
        print("[INFO] Please check:")
        print("    1. Server is running and accessible")
        print("    2. Network connection is working")
        print("    3. Firewall is not blocking the connection")
        print("    4. Server IP address is correct")
        return
    
    print("\n[OK] Starting alarm polling...")
    print(f"[INFO] Polling every {POLL_INTERVAL} seconds...\n")
    
    while True:
        try:
            poll_alarms(jsession, DEVICE_ID)
        except KeyboardInterrupt:
            print("\n[WARNING] Stopped by user")
            break
        except Exception as e:
            print(f"[ERROR] Error in polling loop: {e}")
            print("[RETRY] Retrying in 10 seconds...")
        
        time.sleep(POLL_INTERVAL)


def test_custom_range():
    """Test function to query alarms and reports with custom date range"""
    print("=" * 60)
    print("Custom Range Query Test")
    print("=" * 60)
    
    jsession = login()
    if not jsession:
        print("[ERROR] Cannot test - login failed")
        return
    
    # Example: Query last 7 days
    end_time = datetime.now()
    begin_time = end_time - timedelta(days=7)
    
    print(f"\n[TEST] Querying alarms from {begin_time.strftime('%Y-%m-%d %H:%M:%S')} to {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test alarm query
    alarms = query_alarms_by_range(jsession, DEVICE_ID, begin_time, end_time)
    if alarms:
        print(f"[✅] Found {len(alarms)} alarms in date range")
        if alarms:
            grouped = group_alarms(alarms)
            print(f"[✅] Grouped into {len(grouped)} alarm pairs")
            for g in grouped[:5]:  # Show first 5
                print(f"  • {g['type']} on {g['arm_date']} at {g['arm_time']}")
    else:
        print("[⚠️] No alarms found or query failed")
    
    # Test report query
    print(f"\n[TEST] Querying reports from {begin_time.strftime('%Y-%m-%d %H:%M:%S')} to {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    reports = query_reports_by_range(jsession, DEVICE_ID, begin_time, end_time)
    if reports:
        print(f"[✅] Report query successful")
        print(f"[INFO] Report keys: {list(reports.keys())[:10]}")
    else:
        print("[⚠️] Report query failed")


if __name__ == "__main__":
    import sys
    
    # Check if user wants to test custom range
    if len(sys.argv) > 1 and sys.argv[1] == "--custom-range":
        test_custom_range()
    elif len(sys.argv) > 1 and sys.argv[1] == "--query-range":
        # Allow specifying custom range via command line
        if len(sys.argv) >= 4:
            begin_str = sys.argv[2]
            end_str = sys.argv[3]
            jsession = login()
            if jsession:
                alarms = query_alarms_by_range(jsession, DEVICE_ID, begin_str, end_str)
                if alarms:
                    grouped = group_alarms(alarms)
                    print(f"\n[RESULT] Found {len(grouped)} grouped alarms")
                    for g in grouped:
                        print(f"  • {g['type']} on {g['arm_date']} at {g['arm_time']}")
        else:
            print("Usage: python alarm.py --query-range 'YYYY-MM-DD HH:MM:SS' 'YYYY-MM-DD HH:MM:SS'")
    else:
        main()