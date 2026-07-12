# 🎯 Real-Time Edge-to-Cloud Facial Recognition & Attendance System

This project is a resilient, edge-to-cloud facial recognition attendance system. It runs a hardware-accelerated computer vision pipeline on an **NVIDIA Jetson Nano** using the **DeepStream SDK** to process dual-camera feeds, detect faces with **YOLOv8**, and extract embeddings using **MobileFaceNet (ArcFace)**. 

To ensure robust data delivery even in spotty network conditions, the edge node acts as an **MQTT Publisher** with a local SQLite buffer. A background sync daemon pushes data to a public MQTT broker (e.g., HiveMQ). A **Node.js** backend listens to the broker and logs the attendance directly to a **Supabase (PostgreSQL)** database.

---
"TESTING REMOTE"
## 🏗 System Architecture

### 1. Edge Node (NVIDIA Jetson Nano)
- **Computer Vision Loop**: GStreamer pipeline with TensorRT-optimized models. Runs continuously on the main thread to ensure high FPS.
- **Debounce Logic**: Enforces a 5-minute (300s) cooldown per recognized student before allowing them to be logged again, preventing database spam from continuous video frames.
- **Local Buffer**: `attendance_buffer.db` (SQLite). Detections are instantly saved here to prevent data loss.
- **MQTT Sync Daemon**: An isolated background thread polls the SQLite database and publishes the events via MQTT (QoS 1). Records are only deleted from the buffer after receiving a `PUBACK` confirmation from the broker.

### 2. Cloud Backend (Node.js & Supabase/Prisma)
- **Express Server**: Handles API requests from the React dashboard.
- **Prisma/Supabase Integration**: Uses Prisma ORM to securely insert and manage attendance and student records in a PostgreSQL database.
- **Dynamic Routing**: Configured via `.env` files to dynamically route hardware triggers to the Jetson Nano IP.

### 3. Warden Dashboard (React/Vite)
- **Live Surveillance**: Pulls multi-part JPEG streams directly from the Jetson's RAM disk.
- **Manual Multi-Angle Capture**: A guided, 5-step interactive UX that allows the warden to capture a robust 3D facial profile (Center, Left, Right, Up, Down).
- **Environment Driven**: Connects to the Jetson and Backend dynamically using `VITE_JETSON_IP` and `VITE_BACKEND_URL` from the local `.env` file.

---

## 📁 Project Structure

```text
FACE_Detection_Jetson/
├── edge_attendance_daemon.py     # Main edge application (DeepStream + MQTT Sync)
├── enroll_trt.py                 # Offline utility to enroll new faces
├── db_utils.py                   # Utilities to load enrolled face embeddings
├── configs/                      # DeepStream config files (YOLO, Tracker, MobileFaceNet)
├── models/                       # ONNX models & auto-generated TensorRT engines
├── image_db/                     # Directory for face enrollment images
│
├── attendance-mqtt-backend/      # Cloud Backend
│   ├── mqttListener.js           # Node.js MQTT subscriber & Supabase writer
│   ├── package.json              # Node.js dependencies (type: module)
│   └── .env                      # Contains SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
```

---

## 🚀 Setup & Installation

### Edge Node (Jetson Nano)
1. **Prerequisites**: JetPack 4.6.1, DeepStream 6.0.1, Python 3.6+ with GStreamer bindings (`pyds`).
2. **Install MQTT Client**:
   ```bash
   pip3 install paho-mqtt
   ```
3. **Enroll Faces**: Place photos of students in `image_db/<student_name>/` and run the offline enrollment script to extract and save their embeddings.
   ```bash
   python3 enroll_trt.py
   ```
4. **Run the Daemon**: Pass one or more camera sources (USB, RTSP, HTTP) as arguments.
   ```bash
   python3 edge_attendance_daemon.py /dev/video0
   ```

### Cloud Backend (Node.js)
1. **Navigate to the backend directory**:
   ```bash
   cd attendance-mqtt-backend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file containing your Supabase credentials and the Jetson IP:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
   JETSON_NANO_IP=192.168.1.8
   ```
4. **Setup Supabase Database**:
   Run the following SQL in your Supabase SQL Editor to create the required table:
   ```sql
   CREATE TABLE attendance_logs (
     id SERIAL PRIMARY KEY,
     student_id VARCHAR(50) NOT NULL,
     student_name VARCHAR(100),
     timestamp TIMESTAMP NOT NULL,
     similarity_score REAL NOT NULL
   );
   ```
5. **Start the Listener**:
   ```bash
   node mqttListener.js
   ```

---

## ⚡ Key Features & Resiliency

- **Asynchronous Processing**: The MQTT publishing logic runs in an isolated thread, ensuring the DeepStream video pipeline never drops frames due to network latency.
- **Zero Data Loss Strategy**: Edge buffering guarantees that if the Jetson Nano loses Wi-Fi connectivity, attendance records safely pile up in the local SQLite database. Once the network is restored, the daemon automatically reconnects and burst-publishes the backlog.
- **Vectorized Math**: Face matching utilizes a pre-loaded numpy matrix for O(1) similarity score calculation.
- **Multi-Camera Support**: Handles multiple video sources simultaneously out-of-the-box using the `nvstreammux` component.
