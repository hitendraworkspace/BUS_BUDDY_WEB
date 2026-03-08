import json
import time
from datetime import datetime
from typing import Dict, Set

import requests

from alarm import BASE_URL, DEVICE_ID, USERNAME, PASSWORD, check_server_connectivity


def login() -> str | None:
  """Login and return jsession using same credentials as alarm.py."""
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


def fetch_alarms(jsession: str) -> Dict:
  """Call StandardApiAction_vehicleAlarm and return raw JSON dict."""
  url = f"{BASE_URL}/StandardApiAction_vehicleAlarm.action"
  params = {
    "jsession": jsession,
    "DevIDNO": DEVICE_ID,
    "toMap": 2,
  }

  res = requests.get(url, params=params, verify=False, timeout=30)
  res.raise_for_status()
  return res.json()


def main() -> None:
  print("=" * 60)
  print("GUID Tracker - New vs Existing Alarms (vehicleAlarm)")
  print("=" * 60)
  print(f"Server: {BASE_URL}")
  print(f"Device ID: {DEVICE_ID}")
  print("Polling every 1s. For each alarm GUID, shows whether it is NEW or SEEN before.\n")

  jsession = login()
  if not jsession:
    print("[FATAL] Could not login, exiting.")
    return

  seen_guids: Set[str] = set()

  while True:
    try:
      data = fetch_alarms(jsession)

      alarms = []
      if isinstance(data, dict):
        alarms = data.get("alarmlist") or data.get("alarmList") or data.get("alarms") or []

      if alarms:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print("\n" + "-" * 60)
        print(f"[TIME] {now} | {len(alarms)} alarm(s) in this poll")

        for alarm in alarms:
          guid = str(alarm.get("guid"))
          is_new = guid not in seen_guids
          status_label = "NEW " if is_new else "SEEN"

          # Basic info to help understand the alarm
          st_type = alarm.get("stType")
          a_type = alarm.get("type")
          src_tm = alarm.get("srcTm")
          gps = alarm.get("Gps") or {}
          speed_raw = gps.get("sp", 0)
          speed_kmh = speed_raw / 10.0  # per docs: sp must be divided by 10
          pk = gps.get("pk")  # parking time (sec) if relevant

          print(
            f"[{status_label}] guid={guid} | stType={st_type} type={a_type} "
            f"| srcTm={src_tm} | sp={speed_kmh:.1f} km/h | pk={pk}"
          )

          if is_new:
            seen_guids.add(guid)

      # Short sleep so we poll ~every second
      time.sleep(1)

    except KeyboardInterrupt:
      print("\n[INFO] Stopped by user.")
      break
    except Exception as e:
      print(f"[ERROR] Polling error: {e}")
      # Small backoff before retrying
      time.sleep(2)


if __name__ == "__main__":
  main()


