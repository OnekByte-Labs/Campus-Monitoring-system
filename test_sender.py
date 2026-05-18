import time
import json
import queue
import random
import threading
import requests
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
_stop_event = threading.Event()

def generate_dummy_event():
    """Generates a random JSON payload simulating an attendance event."""
    student_id = f"STU_{random.randint(100, 999)}"
    camera_id = f"cam_mock_{random.randint(1, 4)}"
    timestamp = datetime.utcnow().isoformat() + "Z"
    confidence_score = round(random.uniform(0.85, 0.99), 4)

    return {
        "student_id": student_id,
        "camera_id": camera_id,
        "timestamp": timestamp,
        "confidence_score": confidence_score
    }

def _http_worker():
    """Background thread worker to process the queue and send HTTP requests."""
    headers = {
        "x-api-key": SERVICE_API_KEY,
        "Content-Type": "application/json"
    }
    
    print("[CLOUD] Background worker thread started. Waiting for data...")
    
    while not _stop_event.is_set() or not _log_queue.empty():
        try:
            # Wait up to 1 second for an item from the queue
            payload = _log_queue.get(timeout=1.0)
            
            try:
                print(f"[HTTP] Sending data for {payload['student_id']} from {payload['camera_id']}...")
                response = requests.post(BACKEND_URL, json=payload, headers=headers, timeout=5.0)
                response.raise_for_status()
                print(f"[HTTP SUCCESS] Data logged successfully.")
            except requests.exceptions.RequestException as e:
                print(f"[HTTP ERROR] Network error or timeout: {e}")
                # We drop the payload here to simulate edge device behavior where queuing forever could crash memory
                
            _log_queue.task_done()
        except queue.Empty:
            continue
            
    print("[CLOUD] Background worker thread exiting.")

def main():
    """Main loop simulating the facial recognition pipeline."""
    # Start background thread
    worker_thread = threading.Thread(target=_http_worker, daemon=True)
    worker_thread.start()
    
    print("=" * 50)
    print("  EDGE DEVICE MOCK SENDER STARTED  ")
    print("  Press Ctrl+C to stop             ")
    print("=" * 50)

    try:
        # Simulate video pipeline running infinitely
        while True:
            # Sleep for 2 to 5 seconds to simulate students walking past
            sleep_time = random.uniform(2.0, 5.0)
            time.sleep(sleep_time)
            
            # A face is "detected"
            dummy_event = generate_dummy_event()
            print(f"[DETECTION] Simulated face detection: {dummy_event['student_id']} (Score: {dummy_event['confidence_score']})")
            
            # Push non-blocking payload to queue
            _log_queue.put(dummy_event)

    except KeyboardInterrupt:
        print("\n[INFO] Keyboard interrupt received. Stopping gracefully...")
    finally:
        _stop_event.set()
        worker_thread.join(timeout=3.0)
        print("[INFO] Application exited.")

if __name__ == "__main__":
    main()
