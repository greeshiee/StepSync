from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import shutil
import subprocess
import uuid
import time

app = Flask(__name__)
CORS(app)

# === Config ===
UPLOAD_DIR = os.path.join(os.getcwd(), 'temp_uploads')
VIDEO_DIR = r'C:\HoT\demo\video'
VIS_SCRIPT_RELATIVE = 'demo/vis2.py'
PYTHON_EXECUTABLE = r'C:\Users\zionr\anaconda3\envs\hot2\python.exe'  
PROJECT_ROOT = r'C:\HoT'

os.makedirs(UPLOAD_DIR, exist_ok=True)

# === Feedback Route ===
@app.route('/api/feedback', methods=['POST'])
def feedback():
    choreography = request.files.get('choreography')
    dance = request.files.get('dance')

    if not choreography or not dance:
        return jsonify({'error': 'Both videos are required.'}), 400

    # Save to temp uploads
    uid = str(uuid.uuid4())
    temp_choreo_path = os.path.join(UPLOAD_DIR, f'{uid}_choreo.mp4')
    temp_dance_path = os.path.join(UPLOAD_DIR, f'{uid}_dance.mp4')
    choreography.save(temp_choreo_path)
    dance.save(temp_dance_path)

    # Copy to demo/video with fixed names
    vis_choreo_path = os.path.join(VIDEO_DIR, 'choreo.mp4')
    vis_dance_path = os.path.join(VIDEO_DIR, 'dance.mp4')
    shutil.copy(temp_choreo_path, vis_choreo_path)
    shutil.copy(temp_dance_path, vis_dance_path)

    # Optional: allow time for filesystem to sync
    time.sleep(1)

    return jsonify({'message': 'Videos uploaded. You can now stream progress.'})

# === Log Streaming Generator ===
def generate_vis_output(video_name):
    process = subprocess.Popen(
        [PYTHON_EXECUTABLE, 'demo/vis2.py', '--video', video_name],
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1  # line-buffered
    )

    for line in process.stdout:
        yield f"data: {line.strip()}\n\n"

    process.stdout.close()
    process.wait()

# === Stream Route ===
@app.route('/api/stream/<video_name>')
def stream_logs(video_name):
    if video_name not in ['choreo.mp4', 'dance.mp4']:
        return jsonify({'error': 'Invalid video name.'}), 400
    return Response(generate_vis_output(video_name), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True)
