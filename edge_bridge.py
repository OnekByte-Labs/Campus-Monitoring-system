import sqlite3
import time
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DB_PATH = '/dev/shm/attendance.db'
import os
BACKEND_IP = os.getenv('BACKEND_IP', 'localhost')
API_URL = f'http://{BACKEND_IP}:3000/api/v1/events/attendance'
API_KEY = 'sk_edge_attendance_9f8d7a6b5c4d3e2f1'

HEADERS = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
}

def sync_data():
    try:
        # Connect to local SQLite DB
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Fetch unsent records
        cursor.execute("SELECT id, student_id, student_name, timestamp, similarity_score, camera_id FROM local_buffer")
        records = cursor.fetchall()

        if not records:
            conn.close()
            return

        logging.info(f"Found {len(records)} unsent records. Attempting sync to {API_URL}...")

        # Process each record
        for record in records:
            rec_id, student_id, student_name, timestamp, similarity_score, camera_id = record
            
            payload = {
                "student_id": student_id,
                "student_name": student_name,
                "timestamp": timestamp,
                "similarity_score": similarity_score,
                "device_id": "JETSON_NANO_01",
                "camera_id": int(camera_id) if camera_id is not None else None
            }

            try:
                # Send HTTP POST to backend
                response = requests.post(API_URL, json=payload, headers=HEADERS, timeout=5)

                if response.status_code in (200, 201):
                    logging.info(f"Record {rec_id} synced successfully. Deleting from local buffer.")
                    cursor.execute("DELETE FROM local_buffer WHERE id = ?", (rec_id,))
                    conn.commit()
                elif 400 <= response.status_code < 500:
                    logging.warning(f"Server rejected record {rec_id} with Client Error {response.status_code}. Response: {response.text}. Deleting to prevent queue block.")
                    cursor.execute("DELETE FROM local_buffer WHERE id = ?", (rec_id,))
                    conn.commit()
                else:
                    logging.warning(f"Server error {response.status_code} for record {rec_id}. Response: {response.text}")

            except requests.exceptions.RequestException as e:
                logging.error(f"Network error while syncing record {rec_id} to {API_URL}: {e}")
                # Network dropped or unreachable, leave in DB and try later
                continue

    except sqlite3.OperationalError as e:
        logging.warning(f"Database error (it may not exist yet or is locked): {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    logging.info("Starting Edge Bridge Daemon...")
    while True:
        sync_data()
        time.sleep(2)
