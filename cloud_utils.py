import queue
import threading
import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ==========================================
# BACKEND CONFIGURATION
# ==========================================
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000/api/events/attendance")
SERVICE_API_KEY = os.getenv("SERVICE_API_KEY", "")

# Queue for non-blocking HTTP requests
_log_queue = queue.Queue()
_worker_thread = None
_stop_event = threading.Event()

def _http_worker():
    """Background thread worker to process the queue and send HTTP requests."""
    headers = {
        "x-api-key": SERVICE_API_KEY,
        "Content-Type": "application/json"
    }
    
    while not _stop_event.is_set() or not _log_queue.empty():
        try:
            # Wait up to 1 second for an item
            payload = _log_queue.get(timeout=1.0)
            
            try:
                response = requests.post(BACKEND_URL, json=payload, headers=headers, timeout=5.0)
                response.raise_for_status()
                # print(f"  [CLOUD] Successfully logged {payload['student_id']} to Supabase.")
            except requests.exceptions.RequestException as e:
                print(f"  [CLOUD ERROR] Failed to log to Supabase: {e}")
                # Optionally: queue.put(payload) if you want to retry later, 
                # but dropping is safer for high-frequency logs to avoid RAM bloat.
                
            _log_queue.task_done()
        except queue.Empty:
            continue

def start_cloud_logger():
    """Starts the background thread for sending logs to the cloud."""
    global _worker_thread
    if _worker_thread is None or not _worker_thread.is_alive():
        _stop_event.clear()
        _worker_thread = threading.Thread(target=_http_worker, daemon=True)
        _worker_thread.start()
        print("[CLOUD] Cloud logger background thread started.")

def stop_cloud_logger():
    """Signals the background thread to stop and waits for it to finish."""
    global _worker_thread
    if _worker_thread is not None and _worker_thread.is_alive():
        print("[CLOUD] Stopping cloud logger...")
        _stop_event.set()
        _worker_thread.join(timeout=3.0)
        print("[CLOUD] Cloud logger stopped.")

def send_to_cloud(student_name, camera_id, score):
    """
    Formats the event as JSON and pushes it to the background queue.
    This function returns immediately (non-blocking).
    """
    payload = {
        "student_id": student_name,
        "camera_id": camera_id,
        "timestamp": datetime.utcnow().isoformat() + "Z", # ISO8601 format
        "confidence_score": float(score)
    }
    _log_queue.put(payload)
