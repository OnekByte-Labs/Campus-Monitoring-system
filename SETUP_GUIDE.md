# 🛠️ SETUP_GUIDE.md — Deployment Manual

> **Bare-metal deployment guide for the Real-Time Edge-to-Cloud Facial Recognition & Attendance System.** This document covers hardware provisioning, firmware prerequisites, the dual-Python environment architecture, face enrollment, live inference execution, cloud backend deployment, and production hardening.

---

## Table of Contents

- [Phase 0: Hardware & System Prerequisites](#phase-0-hardware--system-prerequisites)
- [Phase 1: Environment Setup & The Dual-Python Rule](#phase-1-environment-setup--the-dual-python-rule)
- [Phase 2: Face Enrollment (Inside Venv)](#phase-2-face-enrollment-inside-venv)
- [Phase 3: Live Pipeline Execution (System Python)](#phase-3-live-pipeline-execution-system-python)
- [Phase 4: Cloud Backend & Database Deployment](#phase-4-cloud-backend--database-deployment)
- [Phase 5: Production Optimization & Troubleshooting](#phase-5-production-optimization--troubleshooting)

---

## Phase 0: Hardware & System Prerequisites

### Edge Hardware

| Component | Requirement | Notes |
|---|---|---|
| **Compute Board** | NVIDIA Jetson Nano 4GB (B01) | Other Jetson family boards (Xavier NX, Orin Nano) are compatible with minor config changes |
| **Storage** | 64GB+ microSD (UHS-I Class 10) | TensorRT engine builds can consume 2–4 GB of temporary space |
| **Power Supply** | 5V/4A barrel jack (J48 jumper set) | USB power (5V/2A) is insufficient for dual-camera + TensorRT workloads |
| **Camera(s)** | USB UVC webcam(s) or CSI camera(s) | Tested with Logitech C270/C920 (USB), Raspberry Pi Camera Module v2 (CSI) |
| **Network** | Ethernet or Wi-Fi (USB dongle or M.2) | Required for `edge_bridge.py` sync to cloud backend |
| **Cooling** | Active fan or heatsink with fan | Sustained TensorRT inference will thermal throttle without active cooling |

### Firmware & SDK Stack

| Software | Required Version | Installation Source |
|---|---|---|
| **JetPack SDK** | 4.6.1 (L4T R32.7.1) | [NVIDIA SDK Manager](https://developer.nvidia.com/embedded/jetpack) |
| **CUDA** | 10.2 | Bundled with JetPack 4.6.1 |
| **cuDNN** | 8.2.1 | Bundled with JetPack 4.6.1 |
| **TensorRT** | 8.2.1 | Bundled with JetPack 4.6.1 |
| **DeepStream SDK** | 6.0.1 | [NVIDIA DeepStream for Jetson](https://developer.nvidia.com/deepstream-getting-started) |
| **Python** | 3.6.9 (System) | Pre-installed with Ubuntu 18.04 on JetPack 4.6.1 |
| **GStreamer** | 1.14.5 | Pre-installed with JetPack |
| **OpenCV** | 4.1.1 (with CUDA) | Pre-installed with JetPack |

### Cloud / Server Requirements

| Component | Requirement |
|---|---|
| **Node.js** | v18+ (v20 LTS recommended) |
| **PostgreSQL** | 15+ (via Supabase or self-hosted) |
| **Redis** | 6+ (for rate limiting — optional, falls back to local) |
| **Docker** | 20+ (optional, for containerized backend deployment) |
| **Network** | Static IP or domain for the backend server, accessible from the Jetson's network |

---

## Phase 1: Environment Setup & The Dual-Python Rule

### ⚠️ CRITICAL: Why Two Python Environments?

This project **mandates** a strict split between two Python execution contexts:

| Context | Used For | Reason |
|---|---|---|
| **Python Virtual Environment (`venv`)** | Offline enrollment only (`enroll_trt.py`) | Requires `onnxruntime`, `opencv-python`, and optionally `ultralytics` — heavy packages that should not bloat the system Python installation |
| **System Python (`/usr/bin/python3`)** | Live DeepStream inference (`edge_daemon.py`, `edge_bridge.py`, `edge_server.py`) | NVIDIA's `pyds` (DeepStream Python bindings) are installed globally at `/opt/nvidia/deepstream/deepstream/lib/` and **cannot be imported inside a virtual environment** because they depend on system-level GStreamer and DeepStream shared libraries that venvs cannot resolve |

**Violating this rule will produce:**
- `ModuleNotFoundError: No module named 'pyds'` — if you run `edge_daemon.py` inside a venv
- `ModuleNotFoundError: No module named 'onnxruntime'` — if you run `enroll_trt.py` with system Python (unless you install it globally, which is not recommended)

### Step 1.1: Install System-Level Dependencies

These packages are required for the live inference pipeline and must be installed **globally**:

```bash
# GStreamer Python bindings (usually pre-installed on JetPack)
sudo apt-get update
sudo apt-get install -y python3-gi python3-gi-cairo gir1.2-gstreamer-1.0

# Flask and network dependencies for edge_server.py and edge_bridge.py
sudo pip3 install flask flask-cors requests python-dotenv

# Verify pyds is accessible (it's installed by DeepStream SDK)
python3 -c "import pyds; print('pyds OK')"

# If pyds import fails, ensure DeepStream Python bindings are installed:
# cd /opt/nvidia/deepstream/deepstream/lib/
# sudo python3 setup.py install
```

### Step 1.2: Create the Virtual Environment for Enrollment

```bash
# Navigate to the project directory
cd ~/FACE_Detection_Jetson

# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install enrollment dependencies
pip install --upgrade pip
pip install onnxruntime opencv-python numpy

# (Optional) For ONNX model conversion from PyTorch:
# pip install ultralytics onnx onnxsim

# Verify
python3 -c "import onnxruntime; print('ONNX Runtime OK:', onnxruntime.__version__)"

# IMPORTANT: Deactivate when done!
deactivate
```

### Step 1.3: Prepare Model Files

Ensure the following files exist in the `models/` directory:

```
models/
├── yolov8n-face.onnx                          # YOLOv8n-face detector (ONNX, opset 11)
├── yolov8n-face.onnx_b2_gpu0_fp16.engine      # Auto-built by TensorRT on first run
├── w600k_mbf.onnx                              # MobileFaceNet original (static batch)
├── w600k_mbf_dynamic.onnx                      # Dynamic batch version (use fix_mbf_batch.py)
└── w600k_mbf_dynamic.onnx_b8_gpu0_fp16.engine  # Auto-built by TensorRT on first run
```

**If you only have the original ONNX files:**

```bash
# Convert MobileFaceNet to dynamic batch (required for SGIE batch-size=8)
source venv/bin/activate
pip install onnx
python3 fix_mbf_batch.py --input models/w600k_mbf.onnx --output models/w600k_mbf_dynamic.onnx
deactivate
```

**If you need to export YOLOv8n-face from PyTorch:**

```bash
source venv/bin/activate
pip install ultralytics
python3 fix_onnx.py    # Exports yolov8n-face.pt → yolov8n-face.onnx (opset 11, batch=16)
deactivate
```

> **Note:** TensorRT engines (`.engine` files) are auto-generated on the Jetson during the first pipeline startup. This initial build takes 5-15 minutes. Subsequent launches use the cached engine files instantly.

### Step 1.4: Compile the Custom YOLO Parser Library

The PGIE config references a custom bounding-box parser:

```
custom-lib-path=/home/blackbox/FACE_Detection_Jetson/libnvds_infercustomparser_yolov8.so
parse-bbox-func-name=NvDsInferParseYolo
```

If the `.so` file is not present, you need to compile it from the DeepStream YOLO custom parser sources:

```bash
# Typically found at:
cd /opt/nvidia/deepstream/deepstream/sources/objectDetector_Yolo/nvdsinfer_custom_impl_Yolo/
sudo make
# Copy the resulting .so to your project directory
cp libnvds_infercustomparser_yolov8.so ~/FACE_Detection_Jetson/
```

### Step 1.5: Update Config Paths

The DeepStream config files contain absolute paths that must match your system. Edit the following files:

**`configs/pgie_config.txt`** — Update these lines:
```ini
onnx-file=/home/<YOUR_USER>/FACE_Detection_Jetson/models/yolov8n-face.onnx
model-engine-file=/home/<YOUR_USER>/FACE_Detection_Jetson/models/yolov8n-face.onnx_b2_gpu0_fp16.engine
labelfile-path=/home/<YOUR_USER>/FACE_Detection_Jetson/labels.txt
custom-lib-path=/home/<YOUR_USER>/FACE_Detection_Jetson/libnvds_infercustomparser_yolov8.so
```

**`configs/sgie_config.txt`** — Update these lines:
```ini
onnx-file=/home/<YOUR_USER>/FACE_Detection_Jetson/models/w600k_mbf_dynamic.onnx
model-engine-file=/home/<YOUR_USER>/FACE_Detection_Jetson/models/w600k_mbf_dynamic.onnx_b8_gpu0_fp16.engine
```

---

## Phase 2: Face Enrollment (Inside Venv)

### Step 2.1: Structure the Image Database

Create subdirectories under `image_db/` — one per person. Place 3-4 photographs per subject taken from **different angles** (front, left profile, right profile, slight tilt):

```
image_db/
├── aditya/
│   ├── aditya_front.jpg
│   ├── aditya_left.jpg
│   ├── aditya_right.jpg
│   └── aditya_tilt.jpg
├── sharad/
│   ├── sharad_front.jpg
│   ├── sharad_left.jpg
│   └── sharad_right.jpg
├── Aniket/
│   ├── aniket_1.jpg
│   ├── aniket_2.jpg
│   └── aniket_3.jpg
└── Raj/
    ├── raj_1.jpg
    └── raj_2.jpg
```

**Guidelines for enrollment photos:**
- Use well-lit, clear images (avoid motion blur)
- Ensure the face occupies a significant portion of the frame
- The script auto-crops faces using OpenCV's Haar cascade — full-body photos are acceptable but face-only crops produce better embeddings
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.bmp`

### Step 2.2: Run Auto-Enrollment

```bash
# MUST be inside the virtual environment
source venv/bin/activate

# Run the auto-enrollment script
python3 enroll_trt.py

# MUST deactivate after enrollment!
deactivate
```

**Expected output:**

```
============================================================
  AUTO-ENROLLMENT from image_db/
============================================================
  Found 4 student folder(s): ['Aniket', 'Raj', 'aditya', 'sharad']

  [ENROLL] 'Aniket' — processing 3 image(s)...
    [INFO] Auto-cropped face at Box=156x156
    ✓ aniket_1.jpg  dim=512  norm=1.0000  first5=[0.0234 -0.0156 ...]
    ✓ aniket_2.jpg  dim=512  norm=1.0000  first5=[0.0198 -0.0201 ...]
    ✓ aniket_3.jpg  dim=512  norm=1.0000  first5=[0.0211 -0.0178 ...]
    → Fused 3 embedding(s): dim=512  norm=1.0000
    ✓ SUCCESS: 'Aniket' enrolled into database

  [SKIP] 'sharad' — already enrolled in DB (no changes made)
  ...
============================================================
  ENROLLMENT COMPLETE
    New enrollments : 2
    Skipped (exists): 2
    Total in DB     : 4
============================================================
```

**What happens behind the scenes:**
1. For each student folder, `has_embedding(student_name)` checks if they already exist in `attendance.db` → skips if present
2. Each image is loaded, face-cropped via Haar cascade, preprocessed identically to the DeepStream SGIE (symmetric padding to 112×112, `(pixel-127.5)/128.0` normalization)
3. MobileFaceNet ONNX runs on CPU, outputting a 512-D embedding per image
4. All per-image embeddings are L2-normalized, then **averaged** and re-normalized
5. The single fused embedding is stored as raw FP32 bytes (`BLOB`) in the SQLite `Users` table

### Step 2.3: Legacy Single-Image Enrollment (Optional)

For enrolling via a live camera capture (used by the dashboard's remote enrollment feature):

```bash
source venv/bin/activate
python3 enroll_trt.py /path/to/image.jpg student_name
deactivate
```

---

## Phase 3: Live Pipeline Execution (System Python)

### ⚠️ CRITICAL: NO VIRTUAL ENVIRONMENT!

The DeepStream pipeline **must** run under system Python. Ensure no venv is active:

```bash
# Safety: force-deactivate any active venv
deactivate 2>/dev/null

# Verify you're using system Python
which python3
# Expected: /usr/bin/python3

python3 -c "import pyds; print('pyds OK')"
# Expected: pyds OK
```

### Step 3.1: Launch the Inference Engine

**Single camera:**
```bash
python3 edge_daemon.py /dev/video0
```

**Dual camera:**
```bash
python3 edge_daemon.py /dev/video0 /dev/video1
```

**RTSP IP camera:**
```bash
python3 edge_daemon.py rtsp://admin:password@192.168.1.50:554/stream1
```

**Mixed sources:**
```bash
python3 edge_daemon.py /dev/video0 rtsp://192.168.1.50:554/stream1
```

**Expected startup output:**

```
[INFO] Loaded 4 enrolled face(s) from database
[INFO] Watchlist matrix built: (4, 512)
============================================================
  INITIALIZING DEEPSTREAM INFERENCE ENGINE...
============================================================
[DB] Initialized local RAM-disk SQLite buffer (local_buffer).

[VISION] Starting DeepStream Pipeline...
[VISION] Press Ctrl+C to stop gracefully
```

> **First-run warning:** TensorRT engine building takes 5-15 minutes on Jetson Nano. Subsequent launches are instant.

### Step 3.2: Launch the Edge Bridge Daemon (Separate Terminal)

The sync daemon runs independently and forwards buffered records to the cloud backend:

```bash
# In a new terminal (still system Python, no venv)
export BACKEND_IP=192.168.1.7    # Your cloud backend server IP
python3 edge_bridge.py
```

**Expected output:**
```
2026-07-13 20:30:00 - INFO - Starting Edge Bridge Daemon...
2026-07-13 20:30:02 - INFO - Found 3 unsent records. Attempting sync to http://192.168.1.7:3000/api/v1/events/attendance...
2026-07-13 20:30:02 - INFO - Record 1 synced successfully. Deleting from local buffer.
```

### Step 3.3: Launch the MJPEG Streaming Server (Separate Terminal)

For live video feed access from the dashboard:

```bash
python3 edge_server.py
```

**Expected output:**
```
2026-07-13 20:30:00 - INFO - Starting Edge Server on port 5001...
```

Access the live feed at: `http://<JETSON_IP>:5001/video_feed_0`

### Step 3.4: Monitor Local Logs

**Real-time attendance CSV:**
```bash
tail -f attendance.csv
```

**RAM-disk SQLite buffer inspection:**
```bash
sqlite3 /dev/shm/attendance.db "SELECT * FROM local_buffer;"
```

---

## Phase 4: Cloud Backend & Database Deployment

### Step 4.1: Set Up PostgreSQL (Supabase)

#### Option A: Supabase (Recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Navigate to **Settings → Database** and copy:
   - **Connection string (Transaction mode)** → Use as `DATABASE_URL`
   - **Connection string (Session mode)** → Use as `DIRECT_URL`

#### Option B: Self-Hosted PostgreSQL

```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb attendance_system
sudo -u postgres psql -c "CREATE USER attendance_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE attendance_system TO attendance_user;"
```

### Step 4.2: Deploy the Database Schema via Prisma

The Prisma schema (`attendance-express-backend/prisma/schema.prisma`) defines three tables:

```sql
-- This is auto-generated by Prisma. For manual setup, run these in the Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS "attendance_logs" (
    "id"               SERIAL PRIMARY KEY,
    "student_id"       VARCHAR(50) NOT NULL,
    "student_name"     VARCHAR(100),
    "camera_id"        INTEGER,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "direction"        VARCHAR(10) NOT NULL DEFAULT 'IN',
    "timestamp"        TIMESTAMP NOT NULL,
    "created_at"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "attendance_logs_student_id_idx" ON "attendance_logs"("student_id");
CREATE INDEX "attendance_logs_timestamp_idx" ON "attendance_logs"("timestamp");

CREATE TABLE IF NOT EXISTS "students" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id"    VARCHAR(50) UNIQUE NOT NULL,
    "full_name"     VARCHAR(100) NOT NULL,
    "room_number"   VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED',
    "status"        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "devices" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "device_id"     VARCHAR(50) UNIQUE NOT NULL,
    "name"          VARCHAR(100) NOT NULL,
    "role"          VARCHAR(10) NOT NULL,
    "status"        VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Step 4.3: Configure Environment Variables

Create the `.env` file in `attendance-express-backend/`:

```bash
cd attendance-express-backend
cp .env.example .env   # Or create from scratch
```

**`.env` file contents:**

```env
# ===========================
# DATABASE (PostgreSQL / Supabase)
# ===========================
# Supabase transaction-mode connection string (for Prisma Client)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase direct connection string (for Prisma Migrate/Push)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ===========================
# SERVER
# ===========================
PORT=3000

# ===========================
# AUTHENTICATION
# ===========================
# API key that the Jetson edge_bridge.py uses to authenticate POST requests
# This MUST match the API_KEY constant in edge_bridge.py
JETSON_API_KEY=sk_edge_attendance_9f8d7a6b5c4d3e2f1

# ===========================
# REDIS (Rate Limiting)
# ===========================
# Optional: falls back to redis://localhost:6379 if not set
REDIS_URL=redis://localhost:6379

# ===========================
# EDGE DEVICE
# ===========================
# IP of the Jetson Nano on the local network (for MJPEG proxy and remote enrollment)
JETSON_NANO_IP=192.168.1.100
```

### Step 4.4: Install Dependencies & Generate Prisma Client

```bash
cd attendance-express-backend

# Install Node.js dependencies
npm install

# Generate Prisma Client from schema
npx prisma generate

# Push the schema to your database (creates tables if they don't exist)
npx prisma db push
```

### Step 4.5: Start the Backend Server

**Development mode (with hot-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Expected output:**
```
{"level":30,"msg":"Connected to Redis for Rate Limiting"}
{"level":30,"msg":"🕒 Initializing Cron Jobs..."}
{"level":30,"msg":"✅ Cron Jobs Scheduled Successfully"}
{"level":30,"msg":"🚀 API Gateway running on port 3000"}
```

### Step 4.6: Verify the API

```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"OK","uptime":12.345}

# Simulate an attendance event from the edge
curl -X POST http://localhost:3000/api/v1/events/attendance \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_edge_attendance_9f8d7a6b5c4d3e2f1" \
  -d '{
    "student_id": "sharad",
    "student_name": "sharad",
    "timestamp": 1720900000,
    "similarity_score": 0.85,
    "device_id": "JETSON_NANO_01",
    "camera_id": 0
  }'
# Expected: {"success":true,"message":"Attendance logged successfully","data":{...}}

# Query today's attendance
curl http://localhost:3000/api/v1/events/attendance/today
```

### Step 4.7: Deploy the Warden Dashboard (Optional)

```bash
cd warden-dashboard

# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
# Serve via Nginx or any static file server
```

### Step 4.8: Docker Deployment (Optional)

**Backend only:**
```bash
cd attendance-express-backend
docker build -t attendance-backend .
docker run -d -p 3000:3000 --env-file .env attendance-backend
```

**Full stack with Docker Compose** (create `docker-compose.yml` in project root):
```yaml
version: '3.8'
services:
  backend:
    build: ./attendance-express-backend
    ports:
      - "3000:3000"
    env_file: ./attendance-express-backend/.env
    depends_on:
      - redis

  dashboard:
    build: ./warden-dashboard
    ports:
      - "80:80"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Phase 5: Production Optimization & Troubleshooting

### 5.1: Maximizing Tegra Performance

Run these commands on the Jetson before launching the pipeline:

```bash
# Set to maximum performance mode (10W 4-core mode)
sudo nvpmodel -m 0

# Lock CPU/GPU/EMC clocks to maximum frequency
sudo jetson_clocks

# Verify power mode
sudo nvpmodel -q
# Expected: NV Power Mode: MAXN

# (Optional) Monitor thermals and power in real-time
sudo tegrastats
```

### 5.2: Systemd Service Integration

Create a systemd service so the DeepStream pipeline starts automatically on boot:

**`/etc/systemd/system/edge-attendance.service`:**

```ini
[Unit]
Description=Edge Attendance DeepStream Inference Engine
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/blackbox/FACE_Detection_Jetson
Environment="DISPLAY=:0"
Environment="XAUTHORITY=/run/user/1000/.Xauthority"

# CRITICAL: Use /usr/bin/python3 (System Python) — NOT the venv!
ExecStartPre=/usr/bin/nvpmodel -m 0
ExecStartPre=/usr/bin/jetson_clocks
ExecStart=/usr/bin/python3 /home/blackbox/FACE_Detection_Jetson/edge_daemon.py /dev/video0

Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Create a companion service for the sync daemon:**

**`/etc/systemd/system/edge-bridge.service`:**

```ini
[Unit]
Description=Edge Bridge Sync Daemon
After=edge-attendance.service
Requires=edge-attendance.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/blackbox/FACE_Detection_Jetson
Environment="BACKEND_IP=192.168.1.7"
ExecStart=/usr/bin/python3 /home/blackbox/FACE_Detection_Jetson/edge_bridge.py

Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Create a companion service for the MJPEG server:**

**`/etc/systemd/system/edge-server.service`:**

```ini
[Unit]
Description=Edge MJPEG Streaming Server
After=edge-attendance.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/blackbox/FACE_Detection_Jetson
ExecStart=/usr/bin/python3 /home/blackbox/FACE_Detection_Jetson/edge_server.py

Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and start all services:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable edge-attendance.service edge-bridge.service edge-server.service
sudo systemctl start edge-attendance.service edge-bridge.service edge-server.service

# Check status
sudo systemctl status edge-attendance.service

# View live logs
sudo journalctl -u edge-attendance.service -f
```

### 5.3: Common Pitfalls & Fixes

---

#### ❌ `ModuleNotFoundError: No module named 'pyds'`

**Cause:** You are running `edge_daemon.py` inside a Python virtual environment. The `pyds` module is installed globally by NVIDIA DeepStream and cannot be resolved inside a venv.

**Fix:**
```bash
deactivate 2>/dev/null
/usr/bin/python3 edge_daemon.py /dev/video0
```

**Permanent fix:** Ensure your systemd service uses `ExecStart=/usr/bin/python3` (not a venv python).

---

#### ❌ TensorRT Engine Build Fails / Hangs

**Cause:** Insufficient memory on Jetson Nano (4GB shared between CPU and GPU). TensorRT engine building is memory-intensive.

**Fix:**
```bash
# 1. Increase swap space
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 2. Kill unnecessary processes
sudo systemctl stop gdm          # Stop GUI desktop
sudo systemctl stop NetworkManager  # Or use ethernet instead

# 3. Set max performance mode before building
sudo nvpmodel -m 0
sudo jetson_clocks

# 4. Re-run the pipeline (engine will auto-build)
python3 edge_daemon.py /dev/video0
```

**Note:** The engine file name includes batch size and GPU ID (e.g., `_b2_gpu0_fp16.engine`). If you change `batch-size` in the config, delete the old `.engine` file to force a rebuild.

---

#### ❌ GStreamer Pipeline Fails to Initialize / `Gst.State.NULL`

**Cause:** Missing GStreamer plugins, camera device permissions, or display server issues.

**Fix:**
```bash
# Check if the camera device exists
ls -la /dev/video*

# Test camera access directly
gst-launch-1.0 v4l2src device=/dev/video0 ! videoconvert ! xvimagesink

# If permission denied:
sudo usermod -aG video $USER
# Log out and back in

# For headless (no display) operation, use fakesink instead of nveglglessink:
# Edit edge_daemon.py: change sink type to 'fakesink'
```

---

#### ❌ OpenCV Stream Drops / Camera Disconnects

**Cause:** USB bandwidth saturation with multiple cameras, or USB hub power limits.

**Fix:**
```bash
# Check USB bandwidth
lsusb -t

# Use lower resolution in the capsfilter (edit edge_daemon.py create_source_bin):
# Change: width=960, height=540
# To:     width=640, height=480

# For RTSP cameras, add drop-on-latency to prevent buffer overflow:
# (Already handled in create_source_bin for uridecodebin sources)
```

---

#### ❌ SQLite Database Lock Errors

**Cause:** `edge_daemon.py` and `edge_bridge.py` accessing the same SQLite file simultaneously.

**Fix:** The codebase already handles this with `timeout=5.0` on all SQLite connections (`edge_daemon.py` line 71). If you still encounter issues:

```bash
# Check for stale lock files
ls -la /dev/shm/attendance.db*

# Remove journal/WAL files if corrupted
rm -f /dev/shm/attendance.db-journal /dev/shm/attendance.db-wal

# Restart both daemons
sudo systemctl restart edge-attendance.service edge-bridge.service
```

---

#### ❌ `edge_bridge.py` Cannot Connect to Backend

**Cause:** Wrong `BACKEND_IP`, firewall rules, or backend not running.

**Fix:**
```bash
# Test connectivity from Jetson
curl -v http://192.168.1.7:3000/health

# Check the environment variable
echo $BACKEND_IP

# Set it correctly
export BACKEND_IP=<YOUR_BACKEND_SERVER_IP>

# Verify the API key matches between edge_bridge.py and the backend's .env JETSON_API_KEY
```

---

#### ❌ All Faces Showing "Unknown" Despite Enrollment

**Cause:** Dimension mismatch between enrollment embeddings and live SGIE output, or the SGIE is not outputting tensor metadata.

**Fix:**
```bash
# 1. Verify SGIE config has output-tensor-meta=1
grep "output-tensor-meta" configs/sgie_config.txt
# Expected: output-tensor-meta=1

# 2. Verify enrollment used the same preprocessing
# Check embedding dimensions in the database:
python3 -c "
import sqlite3, numpy as np
conn = sqlite3.connect('attendance.db')
c = conn.cursor()
c.execute('SELECT name, LENGTH(embedding) FROM Users')
for name, size in c.fetchall():
    dim = size // 4  # FP32 = 4 bytes
    print(f'{name}: {dim}-D embedding ({size} bytes)')
conn.close()
"

# 3. If dimensions don't match (e.g., 128 vs 512), re-enroll:
# Delete the database and re-run enrollment
rm attendance.db
source venv/bin/activate
python3 enroll_trt.py
deactivate

# 4. Lower the similarity threshold if scores are borderline:
# Edit edge_daemon.py line 36: SIMILARITY_THRESHOLD = 0.35
```

---

#### ❌ Dashboard Cannot Access Live Video Feed

**Cause:** MJPEG proxy chain broken (Dashboard → Backend → Jetson Flask server).

**Fix:**
```bash
# 1. Verify edge_server.py is running on the Jetson
curl http://<JETSON_IP>:5001/video_feed_0
# Should return a continuous MJPEG stream

# 2. Verify JETSON_NANO_IP is set in the backend's .env
grep JETSON_NANO_IP attendance-express-backend/.env

# 3. Test the proxy endpoint on the backend
curl http://<BACKEND_IP>:3000/api/v1/events/feed/0

# 4. Ensure the Jetson's firewall allows port 5001
sudo ufw allow 5001
```

---

### 5.4: Performance Benchmarking

Use the included FPS benchmarking tool to measure raw camera throughput without AI model overhead:

```bash
# System Python (no venv)
python3 test_fps_no_model.py /dev/video0

# Dual camera benchmark
python3 test_fps_no_model.py /dev/video0 /dev/video1
```

This runs the GStreamer pipeline with `nvstreammux → nvmultistreamtiler → nvdsosd → nveglglessink` (skipping PGIE/Tracker/SGIE), giving you the hardware ceiling FPS for your camera and display setup.

---

### 5.5: Register Camera Devices for IN/OUT Tracking

The backend supports directional attendance (IN vs OUT) based on registered camera roles:

```bash
# Register Camera 0 as the "IN" gate
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_id": "0", "name": "Main Gate Entry", "role": "IN"}'

# Register Camera 1 as the "OUT" gate
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"device_id": "1", "name": "Main Gate Exit", "role": "OUT"}'
```

When `edge_bridge.py` sends an attendance record with `camera_id: 0`, the backend's `event.service.js` looks up the device role and sets the `direction` field to `"IN"` or `"OUT"` accordingly.
