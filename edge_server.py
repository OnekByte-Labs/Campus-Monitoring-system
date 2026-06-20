from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import subprocess
import time
import os
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for React Dashboard

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def generate_mjpeg_stream(source_id):
    """
    Generator function that continuously reads the latest frame
    from the RAM disk and yields it as a multipart JPEG.
    """
    import tempfile
    ram_disk = "/dev/shm" if os.name != 'nt' else tempfile.gettempdir()
    file_path = f"{ram_disk}/frame_{source_id}.jpg"
    
    while True:
        try:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    frame = f.read()
                
                if frame:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            else:
                # If frame not found, wait a bit
                time.sleep(0.5)
        except Exception as e:
            logging.error(f"Error reading frame {source_id}: {e}")
            time.sleep(0.5)
            
        # Cap at roughly 20 FPS to save CPU
        time.sleep(0.05)

@app.route('/video_feed_<camera_id>', strict_slashes=False)
def video_feed(camera_id):
    try:
        # Sanitize camera_id to prevent path traversal
        cid = int(camera_id)
        return Response(generate_mjpeg_stream(cid), mimetype='multipart/x-mixed-replace; boundary=frame')
    except ValueError:
        return jsonify({"error": "Invalid camera ID"}), 400

@app.route('/<path:path>')
def catch_all(path):
    logging.warning(f"404 Not Found: Received request for unknown path: /{path}")
    return jsonify({"error": "Not Found", "path": path}), 404

@app.route('/start-enroll', methods=['POST'])
def start_enroll():
    data = request.json
    student_id = data.get('student_id')
    
    if not student_id:
        return jsonify({"status": "error", "message": "student_id is required"}), 400

    logging.info(f"Starting enrollment for student: {student_id}")
    
    try:
        # Since edge_server runs globally, we must explicitly point to the venv's python binary
        # Replace the default 'python3' below with the absolute path to your venv's python!
        # Example: venv_python = '/home/jetson/myenv/bin/python3'
        venv_python = os.getenv('VENV_PYTHON', 'python3') 
        
        subprocess.Popen([venv_python, "enroll_trt.py", "--id", student_id])
        return jsonify({"status": "capturing"}), 200
    except Exception as e:
        logging.error(f"Failed to start enrollment: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    logging.info("Starting Edge Server on port 5001...")
    # host='0.0.0.0' allows external connections from the network
    app.run(host='0.0.0.0', port=5001, threaded=True)
