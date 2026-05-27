import sqlite3
import json
import time
import threading
import random
import paho.mqtt.client as mqtt

DB_FILE = 'attendance_buffer.db'
BROKER = 'broker.hivemq.com'
PORT = 1883
TOPIC = 'campus/gates/gate_1/attendance'

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
    """Inserts a record instantly. Simulates YOLOv8 pipeline writing data."""
    # Use Unix timestamp (seconds)
    current_timestamp = time.time()
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (student_id, timestamp, similarity_score)
        VALUES (?, ?, ?)
    ''', (student_id, current_timestamp, similarity_score))
    conn.commit()
    conn.close()
    print(f"[BUFFER] Saved edge detection for {student_id} at {current_timestamp}")

def sync_daemon(mqtt_client):
    """
    Background thread that infinitely loops, queries the top 50 rows,
    publishes them via MQTT (QoS 1), and deletes on success.
    """
    while True:
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Query top 50 oldest rows
            cursor.execute('''
                SELECT id, student_id, timestamp, similarity_score 
                FROM events ORDER BY id ASC LIMIT 50
            ''')
            rows = cursor.fetchall()
            
            if not rows:
                conn.close()
                time.sleep(2)
                continue
                
            for row in rows:
                event_id, student_id, timestamp, similarity_score = row
                
                payload = {
                    "student_id": student_id,
                    "timestamp": timestamp,
                    "similarity_score": similarity_score
                }
                
                # Publish with QoS 1
                msg_info = mqtt_client.publish(TOPIC, json.dumps(payload), qos=1)
                
                # Block and wait for QoS 1 PUBACK confirmation
                msg_info.wait_for_publish()
                
                if msg_info.is_published():
                    print(f"[DAEMON] 📤 Published event {event_id} ({student_id}) to {TOPIC}")
                    # Only delete from buffer if we know the broker received it
                    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
                    conn.commit()
                else:
                    raise Exception(f"Failed to publish event {event_id}")

            conn.close()
            time.sleep(1) # Brief pause before next batch
            
        except Exception as e:
            print(f"[DAEMON] ⚠️ Network/Sync Error: {e}. Retrying in 5 seconds...")
            # Network drops or publish failures end up here
            time.sleep(5)

# Paho MQTT Callbacks
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[MQTT] ✅ Connected to broker at {BROKER}")
    else:
        print(f"[MQTT] ❌ Failed to connect, return code {rc}")

def on_disconnect(client, userdata, rc, properties=None):
    print("[MQTT] 🔌 Disconnected from broker.")

if __name__ == "__main__":
    print("=== Starting Edge Daemon ===")
    
    # 1. Initialize DB
    init_db()
    
    # 2. Set up Paho MQTT client
    # Use fallback try-except for paho v1 vs v2 api differences
    try:
        mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    except AttributeError:
        mqtt_client = mqtt.Client() # paho < 2.0 fallback
        
    mqtt_client.on_connect = on_connect
    mqtt_client.on_disconnect = on_disconnect
    
    print(f"[MQTT] Connecting to {BROKER}:{PORT}...")
    try:
        mqtt_client.connect(BROKER, PORT, 60)
        mqtt_client.loop_start() # Start the network loop in the background
    except Exception as e:
        print(f"[MQTT] Connection Error: {e}")
        # The daemon loop will handle retries and network drops
    
    # 3. Start background sync thread
    daemon_thread = threading.Thread(target=sync_daemon, args=(mqtt_client,), daemon=True)
    daemon_thread.start()
    
    print("[SYSTEM] Starting mock YOLOv8 camera feed (Ctrl+C to stop)...")
    # 4. Run mock data generation
    try:
        while True:
            # Simulate a face detection
            dummy_student = f"student_{random.randint(100, 999)}"
            dummy_score = round(random.uniform(0.65, 0.99), 2)
            
            # Instantly buffer it locally
            save_to_buffer(dummy_student, dummy_score)
            
            # Sleep 3 seconds between detections
            time.sleep(3)
            
    except KeyboardInterrupt:
        print("\n[SYSTEM] Shutting down Edge Daemon...")
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
