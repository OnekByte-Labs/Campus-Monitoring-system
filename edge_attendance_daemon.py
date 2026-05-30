import sqlite3
import json
import time
import threading
import paho.mqtt.client as mqtt

# --- Configuration ---
DB_FILE = 'attendance_buffer.db'
BROKER = 'broker.hivemq.com'
PORT = 1883
TOPIC = 'campus/gates/gate_1/attendance'
COOLDOWN_SECONDS = 300  # 5 minutes

# In-memory dictionary to track when a student was last logged
# Format: { "student_id": timestamp (float) }
last_seen = {}

# --- Database & Buffer Logic ---

def init_db():
    """Initializes the local SQLite database buffer."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            timestamp REAL NOT NULL,
            similarity_score REAL NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print("[DB] Initialized local buffer database.")

def save_to_buffer(student_id, similarity_score):
    """
    Saves a detection event to the local SQLite database.
    This acts as a durable buffer before syncing to MQTT.
    """
    current_timestamp = time.time()
    
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO events (student_id, timestamp, similarity_score)
            VALUES (?, ?, ?)
        ''', (student_id, current_timestamp, similarity_score))
        conn.commit()
        conn.close()
        print(f"[BUFFER] 📥 Saved local edge detection for {student_id} (Score: {similarity_score:.2f})")
    except Exception as e:
        print(f"[BUFFER ERROR] ❌ Failed to save to local DB: {e}")

# --- Background Sync Daemon ---

def sync_daemon(mqtt_client):
    """
    Isolated background thread that continuously queries the local SQLite buffer
    and publishes events to the MQTT broker. It ensures failover resiliency.
    """
    while True:
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Query the oldest 50 rows
            cursor.execute('''
                SELECT id, student_id, timestamp, similarity_score 
                FROM events ORDER BY id ASC LIMIT 50
            ''')
            rows = cursor.fetchall()
            
            if not rows:
                conn.close()
                time.sleep(2)  # Wait briefly if buffer is empty
                continue
                
            for row in rows:
                event_id, student_id, timestamp, similarity_score = row
                
                payload = {
                    "student_id": student_id,
                    "timestamp": timestamp,
                    "similarity_score": similarity_score
                }
                
                # Publish to MQTT with QoS 1
                msg_info = mqtt_client.publish(TOPIC, json.dumps(payload), qos=1)
                
                # Block until we receive the PUBACK from the broker
                msg_info.wait_for_publish()
                
                if msg_info.is_published():
                    print(f"[DAEMON] 📤 Published event {event_id} ({student_id}) to {TOPIC}")
                    # Safely delete the row ONLY after successful MQTT transmission
                    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
                    conn.commit()
                else:
                    raise Exception(f"Failed to publish event {event_id}")

            conn.close()
            time.sleep(1) # Brief pause before processing the next batch
            
        except Exception as e:
            # Catch network drops or broker disconnects safely
            print(f"[DAEMON] ⚠️ Network/Sync Error: {e}. Retrying in 5 seconds...")
            time.sleep(5)

# --- MQTT Callbacks ---

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[MQTT] ✅ Connected to broker at {BROKER}:{PORT}")
    else:
        print(f"[MQTT] ❌ Failed to connect, return code {rc}")

def on_disconnect(client, userdata, rc, properties=None):
    print("[MQTT] 🔌 Disconnected from broker.")

# --- Main Application Loop ---

if __name__ == "__main__":
    print("=== Starting Edge Attendance Daemon ===")
    
    # 1. Initialize Local Database
    init_db()
    
    # 2. Configure MQTT Client
    try:
        mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    except AttributeError:
        # Fallback for paho-mqtt versions < 2.0
        mqtt_client = mqtt.Client()
        
    mqtt_client.on_connect = on_connect
    mqtt_client.on_disconnect = on_disconnect
    
    print(f"[MQTT] Connecting to {BROKER}:{PORT}...")
    try:
        mqtt_client.connect(BROKER, PORT, 60)
        # Start network loop asynchronously (handles pinging and auto-reconnects)
        mqtt_client.loop_start() 
    except Exception as e:
        print(f"[MQTT] Connection Error on startup: {e}")
        # The daemon thread will handle retries gracefully if offline
    
    # 3. Start the Background Sync Thread
    daemon_thread = threading.Thread(target=sync_daemon, args=(mqtt_client,), daemon=True)
    daemon_thread.start()
    
    print("[VISION] Starting Computer Vision Face Recognition Loop...")
    print("[VISION] (Press Ctrl+C to shutdown gracefully)")
    
    # 4. Main Thread: Computer Vision Inference Loop
    try:
        while True:
            # ---------------------------------------------------------
            # --- PLACEHOLDER FOR main_dual_cam.py INFERENCE ENGINE ---
            # ---------------------------------------------------------
            # Insert your DeepStream frame capture, YOLOv8 detection, 
            # and ArcFace embedding extraction logic here.
            
            # Example simulated detection:
            # match_found, student_id, similarity_score = run_arcface_inference(frame)
            
            # Simulated dummy data for demonstration:
            import random
            match_found = True
            student_id = f"student_{random.randint(100, 105)}" # Small range to test debounce
            similarity_score = round(random.uniform(0.70, 0.99), 2)
            
            if match_found:
                current_time = time.time()
                
                # --- Debounce / Cooldown Logic ---
                if student_id in last_seen:
                    time_since_last_seen = current_time - last_seen[student_id]
                    if time_since_last_seen < COOLDOWN_SECONDS:
                        # Print debug info occasionally or skip silently
                        # print(f"[VISION] Skipping {student_id} (Cooldown active: {time_since_last_seen:.1f}s / {COOLDOWN_SECONDS}s)")
                        pass
                    else:
                        # Cooldown expired, log it again
                        last_seen[student_id] = current_time
                        save_to_buffer(student_id, similarity_score)
                else:
                    # First time seeing this student
                    last_seen[student_id] = current_time
                    save_to_buffer(student_id, similarity_score)
            
            # ---------------------------------------------------------
            # End of Inference Engine Placeholder
            # ---------------------------------------------------------
            
            # Simulate camera FPS sleep (e.g., ~30 FPS)
            time.sleep(0.033)
            
    except KeyboardInterrupt:
        print("\n[SYSTEM] Shutting down Edge Attendance Daemon...")
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("[SYSTEM] Goodbye.")
