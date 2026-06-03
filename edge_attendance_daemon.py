"""
deepstream_edge_daemon.py — Jetson Nano DeepStream + MQTT Edge Pipeline
=====================================================================
Architecture:
  v4l2src → nvvideoconvert → nvstreammux (batch=2)
         → PGIE (YOLOv8n-face) → Tracker (IOU) → SGIE (MobileFaceNet)
         → nvmultistreamtiler → nvdsosd → nveglglessink

Edge Integration:
  Replaces synchronous HTTP cloud logging with a thread-safe local 
  SQLite buffer and a background MQTT synchronization daemon. 
  Includes 5-minute DB cooldown, throttled terminal monitoring, 
  and explicit name passing to prevent OS variable bleed.
"""

import gi
import sys
import os
import ctypes
import math
import time
import numpy as np
import sqlite3
import json
import threading
import paho.mqtt.client as mqtt

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
import pyds

# Only import the local watchlist loader
from db_utils import load_all_embeddings

# ======================== EDGE DAEMON CONFIG ======================== #
DB_FILE = 'attendance_buffer.db'
BROKER = 'broker.hivemq.com'
PORT = 1883
TOPIC = 'campus/gates/gate_1/attendance'

# ======================== DEEPSTREAM GLOBALS ======================== #
COOLDOWN_SEC          = 300        # 5 minutes between re-logging same person to DB
SIMILARITY_THRESHOLD  = 0.40       # cosine-similarity floor
MUXER_BATCH_TIMEOUT   = 40000      # microseconds
CACHE_EVICT_INTERVAL  = 100        # frames between stale-ID cleanup
CACHE_STALE_FRAMES    = 150        # evict IDs not seen for this many frames

frame_counter  = 0                 
last_logged    = {}                # {user_id: timestamp}
fps_streams    = {}                # {source_id: {last_time, frame_count, fps}}
track_id_cache = {}                # {object_id: (display_name, best_score, last_frame_seen)}

# ======================== EDGE DAEMON LOGIC ======================== #

def init_db():
    """Initializes the local SQLite database buffer with student_name."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            student_name TEXT NOT NULL,
            timestamp REAL NOT NULL,
            similarity_score REAL NOT NULL,
            camera_id INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print("[DB] Initialized local SQLite buffer database with student_name support.")

def save_to_buffer(student_id, student_name, similarity_score, camera_id):
    """Instantly saves a detection event, name, and camera source to the local database."""
    current_timestamp = time.time()
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO events (student_id, student_name, timestamp, similarity_score, camera_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (student_id, student_name, current_timestamp, similarity_score, camera_id))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[BUFFER ERROR] ❌ Failed to save to local DB: {e}")

def sync_daemon(mqtt_client):
    """Background thread to push local SQLite logs (including name) to MQTT broker."""
    while True:
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute('SELECT id, student_id, student_name, timestamp, similarity_score, camera_id FROM events ORDER BY id ASC LIMIT 50')
            rows = cursor.fetchall()
            
            if not rows:
                conn.close()
                time.sleep(2)
                continue
                
            for row in rows:
                event_id, student_id, student_name, timestamp, similarity_score, camera_id = row
                
                payload = {
                    "student_id": student_id,
                    "student_name": student_name,
                    "timestamp": int(timestamp),
                    "similarity_score": float(similarity_score),
                    "camera_id": camera_id
                }
                
                msg_info = mqtt_client.publish(TOPIC, json.dumps(payload), qos=1)
                msg_info.wait_for_publish(timeout=5)
                
                if msg_info.is_published():
                    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
                    conn.commit()
                else:
                    raise Exception(f"Timeout on event {event_id}")

            conn.close()
            time.sleep(1) 
            
        except Exception as e:
            print(f"[DAEMON] ⚠️ Network Sync Error: {e}. Retrying in 5 seconds...")
            time.sleep(5)

# --- MQTT Callbacks ---
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[MQTT] ✅ Connected to broker at {BROKER}:{PORT}")
    else:
        print(f"[MQTT] ❌ Failed to connect, return code {rc}")

def on_disconnect(client, userdata, rc, properties=None):
    print("[MQTT] 🔌 Disconnected from broker.")


# ======================== LOAD & BUILD WATCHLIST ======================== #

embeddings_db = load_all_embeddings()
print(f"[INFO] Loaded {len(embeddings_db)} enrolled face(s) from database")

for user in embeddings_db:
    norm = np.linalg.norm(user['embedding'])
    if norm > 1e-8:
        user['embedding'] = user['embedding'] / norm

if len(embeddings_db) > 0:
    _emb_dim = len(embeddings_db[0]['embedding'])
    watchlist_matrix = np.vstack(
        [u['embedding'].reshape(1, _emb_dim) for u in embeddings_db]
    ).astype(np.float32)
    watchlist_names   = [u['name']    for u in embeddings_db]
    watchlist_ids     = [u['user_id'] for u in embeddings_db]
    print(f"[INFO] Watchlist matrix built: {watchlist_matrix.shape}")
else:
    watchlist_matrix = None
    watchlist_names  = []
    watchlist_ids    = []
    _emb_dim         = 0
    print("[WARN] No enrolled faces — recognition disabled")


# ======================== VECTORIZED FACE MATCHING ======================== #

def match_face_vectorized(live_embedding_np):
    if watchlist_matrix is None or watchlist_matrix.shape[0] == 0:
        return None, None, -1.0

    norm = np.linalg.norm(live_embedding_np)
    if norm < 1e-8:
        return None, None, -1.0

    query = (live_embedding_np / norm).astype(np.float32)
    q_dim = query.shape[0]
    w_dim = watchlist_matrix.shape[1]
    
    if q_dim != w_dim:
        min_dim = min(q_dim, w_dim)
        query_use  = query[:min_dim]
        matrix_use = watchlist_matrix[:, :min_dim]
        qn = np.linalg.norm(query_use)
        if qn > 1e-8:
            query_use = query_use / qn
        matrix_use = matrix_use / (np.linalg.norm(matrix_use, axis=1, keepdims=True) + 1e-8)
    else:
        query_use  = query
        matrix_use = watchlist_matrix

    scores = matrix_use @ query_use
    best_idx   = int(np.argmax(scores))
    best_score = float(scores[best_idx])

    if best_score > SIMILARITY_THRESHOLD:
        return watchlist_names[best_idx], watchlist_ids[best_idx], best_score
    return None, None, best_score


# ======================== PIPELINE PROBE ======================== #

def osd_sink_pad_buffer_probe(pad, info, u_data):
    global frame_counter, track_id_cache

    gst_buffer = info.get_buffer()
    if not gst_buffer:
        return Gst.PadProbeReturn.OK

    batch_meta = pyds.gst_buffer_get_nvds_batch_meta(hash(gst_buffer))
    l_frame = batch_meta.frame_meta_list

    while l_frame is not None:
        try:
            frame_meta = pyds.NvDsFrameMeta.cast(l_frame.data)
        except StopIteration:
            break

        source_id = frame_meta.source_id
        frame_counter += 1
        now = time.time()

        # FPS Tracking
        if source_id not in fps_streams:
            fps_streams[source_id] = {'last_time': now, 'frame_count': 0, 'fps': 0.0}
        fps_streams[source_id]['frame_count'] += 1
        elapsed = now - fps_streams[source_id]['last_time']
        if elapsed >= 1.0:
            fps_streams[source_id]['fps'] = (fps_streams[source_id]['frame_count'] / elapsed)
            fps_streams[source_id]['frame_count'] = 0
            fps_streams[source_id]['last_time'] = now
        current_fps = fps_streams[source_id]['fps']

        display_meta = pyds.nvds_acquire_display_meta_from_pool(batch_meta)
        display_meta.num_labels = 1
        py_nvosd_text_params = display_meta.text_params[0]
        py_nvosd_text_params.display_text = f"FPS: {current_fps:.1f}"
        py_nvosd_text_params.x_offset = 10
        py_nvosd_text_params.y_offset = 12
        py_nvosd_text_params.font_params.font_name = "Serif"
        py_nvosd_text_params.font_params.font_size = 11
        py_nvosd_text_params.font_params.font_color.set(0.0, 1.0, 0.0, 1.0)
        py_nvosd_text_params.set_bg_clr = 1
        py_nvosd_text_params.text_bg_clr.set(0.0, 0.0, 0.0, 0.7)
        pyds.nvds_add_display_meta_to_frame(frame_meta, display_meta)

        active_ids_this_frame = set()

        l_obj = frame_meta.obj_meta_list
        while l_obj is not None:
            try:
                obj_meta = pyds.NvDsObjectMeta.cast(l_obj.data)
            except StopIteration:
                break

            obj_id = obj_meta.object_id
            active_ids_this_frame.add(obj_id)

            # --- CACHE HIT ---
            if obj_id in track_id_cache:
                cached_name, cached_score, _ = track_id_cache[obj_id]
                track_id_cache[obj_id] = (cached_name, cached_score, frame_counter)

                if cached_name is not None:
                    _apply_recognised_overlay(obj_meta, cached_name, cached_score)

                    # 1. CONTINUOUS TERMINAL OUTPUT (Throttled)
                    if frame_counter % 15 == 0: 
                        print(f"[VISION] 👀 Tracking: {cached_name}")

                    # 2. DATABASE COOLDOWN LOGIC
                    uid = _uid_for_name(cached_name)
                    if uid is not None:
                        if (uid not in last_logged or now - last_logged[uid] > COOLDOWN_SEC):
                            # Passing the explicit name and source_id here
                            save_to_buffer(uid, cached_name, cached_score, source_id)
                            last_logged[uid] = now
                            print(f"==================================================")
                            print(f"[ATTENDANCE] 💾 {cached_name} officially logged to DB via Cache on Cam {source_id}!")
                            print(f"==================================================")

                    try:
                        l_obj = l_obj.next
                    except StopIteration:
                        break
                    continue
                else:
                    _apply_unknown_overlay(obj_meta)
                    if frame_counter % 5 != 0:
                        try:
                            l_obj = l_obj.next
                        except StopIteration:
                            break
                        continue

            # --- CACHE MISS ---
            recognised = False
            l_user_meta = obj_meta.obj_user_meta_list

            while l_user_meta is not None:
                try:
                    user_meta = pyds.NvDsUserMeta.cast(l_user_meta.data)
                except StopIteration:
                    break
                meta_type = user_meta.base_meta.meta_type

                if meta_type == pyds.NvDsMetaType.NVDSINFER_TENSOR_OUTPUT_META:
                    tensor_meta = pyds.NvDsInferTensorMeta.cast(user_meta.user_meta_data)

                    if tensor_meta.unique_id != 2:
                        try:
                            l_user_meta = l_user_meta.next
                        except StopIteration:
                            break
                        continue

                    layer = pyds.get_nvds_LayerInfo(tensor_meta, 0)
                    ptr = ctypes.cast(pyds.get_ptr(layer.buffer), ctypes.POINTER(ctypes.c_float))

                    emb_dim = layer.dims.d[0]
                    if emb_dim <= 0:
                        emb_dim = layer.dims.numElements

                    live_embedding = np.copy(np.ctypeslib.as_array(ptr, shape=(emb_dim,)))
                    norm = np.linalg.norm(live_embedding)
                    if norm > 1e-8:
                        live_embedding /= norm

                    name, user_id, score = match_face_vectorized(live_embedding)

                    if name is not None:
                        _apply_recognised_overlay(obj_meta, name, score)
                        track_id_cache[obj_id] = (name, score, frame_counter)
                        
                        # 1. CONTINUOUS TERMINAL OUTPUT
                        print(f"[VISION] 🎯 New Match Found: {name}!")
                        
                        # 2. DATABASE COOLDOWN LOGIC
                        if (user_id not in last_logged or now - last_logged[user_id] > COOLDOWN_SEC):
                            # Passing the explicit name and source_id here
                            save_to_buffer(user_id, name, score, source_id)
                            last_logged[user_id] = now
                            print(f"==================================================")
                            print(f"[ATTENDANCE] 💾 {name} officially logged to DB via SGIE on Cam {source_id}!")
                            print(f"==================================================")
                        
                        recognised = True
                    else:
                        track_id_cache[obj_id] = (None, score, frame_counter)
                    break

                try:
                    l_user_meta = l_user_meta.next
                except StopIteration:
                    break

            if not recognised:
                _apply_unknown_overlay(obj_meta)
                if obj_id not in track_id_cache:
                    track_id_cache[obj_id] = (None, 0.0, frame_counter)

            try:
                l_obj = l_obj.next
            except StopIteration:
                break

        # Cache Eviction
        if frame_counter % CACHE_EVICT_INTERVAL == 0:
            stale_ids = [
                oid for oid, (_, _, last_seen) in track_id_cache.items()
                if (frame_counter - last_seen) > CACHE_STALE_FRAMES
            ]
            for oid in stale_ids:
                del track_id_cache[oid]

        try:
            l_frame = l_frame.next
        except StopIteration:
            break

    return Gst.PadProbeReturn.OK

# ======================== OVERLAY HELPERS ======================== #
def _apply_recognised_overlay(obj_meta, name, score):
    display_name = name.split('_')[0]
    obj_meta.text_params.display_text = f"{display_name} ({score:.2f})"
    obj_meta.rect_params.border_color.set(0.0, 1.0, 0.0, 1.0)
    obj_meta.rect_params.border_width = 4
    obj_meta.text_params.font_params.font_name  = "Serif"
    obj_meta.text_params.font_params.font_size   = 12
    obj_meta.text_params.font_params.font_color.set(1.0, 1.0, 1.0, 1.0)
    obj_meta.text_params.set_bg_clr = 1
    obj_meta.text_params.text_bg_clr.set(0.0, 0.4, 0.0, 0.6)

def _apply_unknown_overlay(obj_meta):
    obj_meta.text_params.display_text = "Unknown"
    obj_meta.rect_params.border_color.set(1.0, 0.0, 0.0, 1.0)
    obj_meta.rect_params.border_width = 3
    obj_meta.text_params.font_params.font_name  = "Serif"
    obj_meta.text_params.font_params.font_size   = 12
    obj_meta.text_params.font_params.font_color.set(1.0, 1.0, 1.0, 1.0)
    obj_meta.text_params.set_bg_clr = 1
    obj_meta.text_params.text_bg_clr.set(0.6, 0.0, 0.0, 0.6)

def _uid_for_name(name):
    for i, n in enumerate(watchlist_names):
        if n == name:
            return watchlist_ids[i]
    return None

# ======================== SOURCE BIN HELPERS ======================== #
def cb_newpad(decodebin, decoder_src_pad, data):
    caps = decoder_src_pad.get_current_caps()
    gststruct = caps.get_structure(0)
    gstname = gststruct.get_name()
    source_bin = data
    features = caps.get_features(0)

    if gstname.find("video") != -1:
        if features.contains("memory:NVMM"):
            bin_ghost_pad = source_bin.get_static_pad("src")
            if not bin_ghost_pad.set_target(decoder_src_pad):
                print("Failed to link decoder src pad to source bin ghost pad")
        else:
            print("Error: Decodebin did not pick nvidia decoder plugin.")

def create_source_bin(index, uri):
    bin_name = f"source-bin-{index}"
    nbin = Gst.Bin.new(bin_name)

    if uri.startswith(("rtsp://", "http://", "https://", "file://")):
        uri_decode_bin = Gst.ElementFactory.make("uridecodebin", "uri-decode-bin")
        uri_decode_bin.set_property("uri", uri)
        uri_decode_bin.connect("pad-added", cb_newpad, nbin)
        uri_decode_bin.connect(
            "child-added",
            lambda child_proxy, obj, name, user_data:
                obj.set_property("drop-on-latency", True) if name.find("source") != -1 else None,
            nbin)
        Gst.Bin.add(nbin, uri_decode_bin)
    else:
        v4l2src = Gst.ElementFactory.make("v4l2src", f"v4l2src_{index}")
        v4l2src.set_property("device", uri)
        nvvidconv = Gst.ElementFactory.make("nvvideoconvert", f"nvvidconv_{index}")
        capsfilter = Gst.ElementFactory.make("capsfilter", f"caps_{index}")
        caps = Gst.Caps.from_string("video/x-raw(memory:NVMM), width=960, height=540, format=NV12")
        capsfilter.set_property("caps", caps)

        Gst.Bin.add(nbin, v4l2src)
        Gst.Bin.add(nbin, nvvidconv)
        Gst.Bin.add(nbin, capsfilter)

        v4l2src.link(nvvidconv)
        nvvidconv.link(capsfilter)

    bin_pad = nbin.add_pad(Gst.GhostPad.new_no_target("src", Gst.PadDirection.SRC))
    if not uri.startswith(("rtsp://", "http://", "https://", "file://")):
        nbin.get_static_pad("src").set_target(capsfilter.get_static_pad("src"))

    return nbin

# ======================== MAIN STARTUP ======================== #

def main(args):
    if len(args) < 2:
        print("Usage: python3 deepstream_edge_daemon.py <cam_uri> [cam2_uri ...]")
        print("  Example: python3 deepstream_edge_daemon.py /dev/video0")
        sys.exit(1)

    sources = args[1:]
    num_sources = len(sources)

    Gst.init(None)

    # 1. Start SQLite and Background MQTT Sync
    print("=" * 60)
    print("  INITIALIZING EDGE NETWORK DAEMON...")
    print("=" * 60)
    init_db()
    
    try:
        mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    except AttributeError:
        mqtt_client = mqtt.Client()
        
    mqtt_client.on_connect = on_connect
    mqtt_client.on_disconnect = on_disconnect
    print(f"[MQTT] Connecting to {BROKER}:{PORT}...")
    try:
        mqtt_client.connect(BROKER, PORT, 60)
        mqtt_client.loop_start() 
    except Exception as e:
        print(f"[MQTT] Connection Error on startup: {e}")
        
    daemon_thread = threading.Thread(target=sync_daemon, args=(mqtt_client,), daemon=True)
    daemon_thread.start()

    print("\n=" * 60)
    print("  INITIALIZING DEEPSTREAM PIPELINE...")
    print("=" * 60)
    
    pipeline = Gst.Pipeline()

    streammux = Gst.ElementFactory.make("nvstreammux", "Stream-muxer")
    streammux.set_property('width', 960)
    streammux.set_property('height', 540)
    streammux.set_property('batch-size', num_sources)
    streammux.set_property('live-source', 1)
    streammux.set_property('batched-push-timeout', MUXER_BATCH_TIMEOUT)
    streammux.set_property('nvbuf-memory-type', 0)
    pipeline.add(streammux)

    for i in range(num_sources):
        source_bin = create_source_bin(i, sources[i])
        pipeline.add(source_bin)
        padname = f"sink_{i}"
        sinkpad = streammux.get_request_pad(padname)
        srcpad = source_bin.get_static_pad("src")
        srcpad.link(sinkpad)

    pgie = Gst.ElementFactory.make("nvinfer", "primary-inference")
    pgie.set_property('config-file-path', "configs/pgie_config.txt")

    tracker = Gst.ElementFactory.make("nvtracker", "tracker")
    tracker.set_property('ll-lib-file', '/opt/nvidia/deepstream/deepstream/lib/libnvds_nvmultiobjecttracker.so')
    tracker.set_property('ll-config-file', 'configs/tracker_config.yml')
    tracker.set_property('tracker-width', 640)
    tracker.set_property('tracker-height', 640)

    sgie = Gst.ElementFactory.make("nvinfer", "secondary-nvinference-engine")
    sgie.set_property('config-file-path', "configs/sgie_config.txt")

    tiler = Gst.ElementFactory.make("nvmultistreamtiler", "nvtiler")
    tiler_rows = int(math.sqrt(num_sources))
    tiler_columns = int(math.ceil(float(num_sources) / tiler_rows))
    tiler.set_property("rows", tiler_rows)
    tiler.set_property("columns", tiler_columns)
    tiler.set_property("width", 1280)
    tiler.set_property("height", 720)

    nvvidconv = Gst.ElementFactory.make("nvvideoconvert", "convertor")
    nvosd = Gst.ElementFactory.make("nvdsosd", "onscreendisplay")
    transform = Gst.ElementFactory.make("nvegltransform", "nvegl-transform")
    sink = Gst.ElementFactory.make("nveglglessink", "nvvideo-renderer")
    sink.set_property('sync', False)
    sink.set_property('qos', False)

    for elem in [pgie, tracker, sgie, tiler, nvvidconv, nvosd]:
        pipeline.add(elem)
    if transform:
        pipeline.add(transform)
    pipeline.add(sink)

    streammux.link(pgie)
    pgie.link(tracker)
    tracker.link(sgie)
    sgie.link(tiler)
    tiler.link(nvvidconv)
    nvvidconv.link(nvosd)

    if transform:
        nvosd.link(transform)
        transform.link(sink)
    else:
        nvosd.link(sink)

    sgie_src_pad = sgie.get_static_pad("src")
    if sgie_src_pad:
        sgie_src_pad.add_probe(Gst.PadProbeType.BUFFER, osd_sink_pad_buffer_probe, 0)

    loop = GLib.MainLoop()
    bus = pipeline.get_bus()
    bus.add_signal_watch()

    def bus_call(bus, message, loop):
        t = message.type
        if t == Gst.MessageType.EOS:
            print("\n[EOS] End-of-stream")
            loop.quit()
        elif t == Gst.MessageType.WARNING:
            err, debug = message.parse_warning()
            sys.stderr.write(f"[WARNING] {err}: {debug}\n")
        elif t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            sys.stderr.write(f"[ERROR] {err}: {debug}\n")
            loop.quit()
        return True

    bus.connect("message", bus_call, loop)

    print("\n[VISION] Starting DeepStream Pipeline...")
    print("[VISION] Press Ctrl+C to stop gracefully\n")
    
    pipeline.set_state(Gst.State.PLAYING)

    try:
        loop.run()
    except KeyboardInterrupt:
        print("\n[INFO] Interrupted by user")
    except BaseException:
        pass

    print("[SYSTEM] Exiting app and cleaning up...")
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    pipeline.set_state(Gst.State.NULL)

if __name__ == '__main__':
    sys.exit(main(sys.argv))