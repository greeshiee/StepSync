from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import shutil
import subprocess
import uuid
import time
import threading  
import re

app = Flask(__name__)
CORS(app)

# === Config ===
UPLOAD_DIR = os.path.join(os.getcwd(), 'temp_uploads')
VIDEO_DIR = r'C:\HoT\demo\video'
VIS_SCRIPT_RELATIVE = 'demo/vis2.py'
PYTHON_EXECUTABLE = r'C:\Users\zionr\anaconda3\envs\hot2\python.exe'  
PROJECT_ROOT = r'C:\HoT'
FEEDBACK_SCRIPT = r'C:\HoT\Feedback\compareDefNPZ.py'  

os.makedirs(UPLOAD_DIR, exist_ok=True)

# === Progress Tracker ===
progress_status = {"choreo.mp4": 0, "dance.mp4": 0}  
progress_lock = threading.Lock()  

def run_feedback_script():
    process = subprocess.Popen(
        [PYTHON_EXECUTABLE, 'Feedback/compareDefNPZ.py', '--frame', '10', '--top', '10'],
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    avg_similarity = None
    top_frames = []
    bottom_frames = []
    output_lines = []
    capture_top = capture_bottom = False

    for line in process.stdout:
        line = line.strip()
        output_lines.append(line)

        # Capture average similarity
        match = re.search(r'Average similarity score: ([\d.]+)/100', line)
        if match:
            avg_similarity = float(match.group(1))

        # Toggle top/bottom capture flags
        if "Top 10 Most Similar Frames" in line:
            capture_top = True
            capture_bottom = False
            continue
        elif "Top 10 Least Similar Frames" in line:
            capture_top = False
            capture_bottom = True
            continue
        elif line.startswith("====="):
            capture_top = False
            capture_bottom = False
            continue

        # Capture actual top/bottom frame lines
        if capture_top:
            frame_match = re.search(r'Frame (\d+): Similarity Score ([\d.]+)/100', line)
            if frame_match:
                top_frames.append({
                    "frame": int(frame_match.group(1)),
                    "score": float(frame_match.group(2))
                })

        if capture_bottom:
            frame_match = re.search(r'Frame (\d+): Similarity Score ([\d.]+)/100', line)
            if frame_match:
                bottom_frames.append({
                    "frame": int(frame_match.group(1)),
                    "score": float(frame_match.group(2))
                })

    process.stdout.close()
    process.wait()

    return {
        "average_similarity": avg_similarity,
        "top_frames": top_frames,
        "bottom_frames": bottom_frames,
        "raw_output": output_lines
    }


@app.route('/api/feedback-result', methods=['GET'])
def feedback_result():
    result = run_feedback_script()
    return jsonify(result)

def update_progress_and_maybe_run(video_name, stage):  
    with progress_lock:
        progress_status[video_name] = stage
        if all(v == 3 for v in progress_status.values()):
            print("Both videos done. Running feedback script.")
            run_feedback_script()

# === Feedback Upload Route ===
@app.route('/api/feedback', methods=['POST'])
def feedback():
    choreography = request.files.get('choreography')
    dance = request.files.get('dance')

    if not choreography or not dance:
        return jsonify({'error': 'Both videos are required.'}), 400

    uid = str(uuid.uuid4())
    temp_choreo_path = os.path.join(UPLOAD_DIR, f'{uid}_choreo.mp4')
    temp_dance_path = os.path.join(UPLOAD_DIR, f'{uid}_dance.mp4')
    choreography.save(temp_choreo_path)
    dance.save(temp_dance_path)

    vis_choreo_path = os.path.join(VIDEO_DIR, 'choreo.mp4')
    vis_dance_path = os.path.join(VIDEO_DIR, 'dance.mp4')
    shutil.copy(temp_choreo_path, vis_choreo_path)
    shutil.copy(temp_dance_path, vis_dance_path)

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
        bufsize=1
    )

    progress_map = {
        "Generated 2D pose successfully!": 1,
        "Generated 3D pose successfully!": 2,
        "Generated visualization successfully!": 3,
    }

    for line in process.stdout:
        clean_line = line.strip()
        progress_stage = progress_map.get(clean_line, None)

        if progress_stage is not None:
            update_progress_and_maybe_run(video_name, progress_stage)  # NEW
            yield f"event: progress\ndata: {progress_stage}\n\n"

        yield f"data: {clean_line}\n\n"

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
