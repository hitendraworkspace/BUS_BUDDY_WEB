import json
import time
from datetime import datetime

import requests

from alarm import BASE_URL, DEVICE_ID, USERNAME, PASSWORD, check_server_connectivity


def login():
    """Lightweight login that reuses the same credentials/constants as alarm.py."""
    if not check_server_connectivity():
        print("[WARN] Connectivity check failed, trying login anyway...")

    url = f"{BASE_URL}/StandardApiAction_login.action"
    params = {"account": USERNAME, "password": PASSWORD}

    try:
        res = requests.post(url, params=params, verify=False, timeout=30)
        res.raise_for_status()
        data = res.json()
        if data.get("result") == 0:
            jsession = data["jsession"]
            print(f"[OK] Logged in, jsession={jsession}")
            return jsession
        print(f"[ERROR] Login failed, result={data.get('result')}, raw={data}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
    return None


def fetch_alarms(jsession: str):
    """Call StandardApiAction_vehicleAlarm and return raw JSON."""
    url = f"{BASE_URL}/StandardApiAction_vehicleAlarm.action"
    params = {
        "jsession": jsession,
        "DevIDNO": DEVICE_ID,
        "toMap": 2,
    }

    res = requests.get(url, params=params, verify=False, timeout=30)
    res.raise_for_status()
    return res.json()


def main():
    print("=" * 60)
    print("Raw Alarm Debugger (vehicleAlarm)")
    print("=" * 60)
    print(f"Server: {BASE_URL}")
    print(f"Device ID: {DEVICE_ID}")
    print("This script will print the FULL raw JSON response from vehicleAlarm ONLY when alarms exist.\n")

    jsession = login()
    if not jsession:
        print("[FATAL] Could not login, exiting.")
        return

    while True:
        try:
            data = fetch_alarms(jsession)

            # Most implementations return something like:
            # { "result": 0, "alarmlist": [ {...}, {...} ] }
            alarms = []
            if isinstance(data, dict):
                alarms = data.get("alarmlist") or data.get("alarmList") or data.get("alarms") or []

            if alarms:
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print("\n" + "-" * 60)
                print(f"[TIME] {now} | {len(alarms)} alarm(s) detected")
                # Pretty-print the entire JSON so you can see every field/bit
                print(json.dumps(data, indent=2, ensure_ascii=False))
        except KeyboardInterrupt:
            print("\n[INFO] Stopped by user.")
            break
        except Exception as e:
            print(f"[ERROR] Failed to fetch status: {e}")

        # Adjust interval as needed while debugging
        time.sleep(1)


if __name__ == "__main__":
    main()


