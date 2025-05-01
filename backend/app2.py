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
FEEDBACK_SCRIPT = r'C:\HoT\Feedback\compareFeatExtrac.py'  

os.makedirs(UPLOAD_DIR, exist_ok=True)

# === Progress Tracker ===
progress_status = {"choreo.mp4": 0, "dance.mp4": 0}  
progress_lock = threading.Lock()  

def run_feedback_script(frames_path, def_path, frame=10, top=10):
    process = subprocess.Popen(
        [
            PYTHON_EXECUTABLE,
            'Feedback/compareFeatExtrac.py',
            frames_path,
            def_path
        ],
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    metrics = {}
    top_frames = []
    bottom_frames = []
    output_lines = []

    capture_top = False
    capture_bottom = False

    for line in process.stdout:
        line = line.strip()
        if not line:
            continue  # skip empty lines

        output_lines.append(line)

        # Capture top and bottom frames
        if line.startswith("Top 10 Frames (most similar):"):
            capture_top = True
            capture_bottom = False
            continue
        elif line.startswith("Bottom 10 Frames (least similar):"):
            capture_top = False
            capture_bottom = True
            continue
        elif line.startswith("====="):
            capture_top = False
            capture_bottom = False
            continue

        
        if ":" in line and not capture_top and not capture_bottom:
            key, value = line.split(":", 1)
            key = key.strip().lower().replace(" ", "_")

            # strip desc.
            value = value.strip().split()[0]
            try:
                metrics[key] = float(value)
            except ValueError:
                pass  # skip if not a float

        
        if capture_top or capture_bottom:
            parts = line.split(" - ")
            if len(parts) == 2:
                frame_part, score_part = parts
                try:
                    frame_num = int(frame_part.split()[1])
                    score = float(score_part.split(":")[1].replace("/100", "").strip())
                    frame_data = {"frame": frame_num, "score": score}
                    if capture_top:
                        top_frames.append(frame_data)
                    elif capture_bottom:
                        bottom_frames.append(frame_data)
                except (IndexError, ValueError):
                    continue  

    process.stdout.close()
    process.wait()

    return {
        "metrics": metrics,
        "top_frames": top_frames,
        "bottom_frames": bottom_frames,
        "raw_output": output_lines,
    }

@app.route('/api/feedback-result', methods=['GET'])
def feedback_result():
    result = run_feedback_script(
            frames_path=r"C:\HoT\demo\output\dance\output_3D\output_keypoints_3d.npz",
            def_path=r"C:\HoT\demo\output\choreo\output_3D\output_keypoints_3d.npz"
            )
    print("Feedback Result:", result)
    return jsonify(result)

def update_progress_and_maybe_run(video_name, stage):  
    with progress_lock:
        progress_status[video_name] = stage
        if all(v == 3 for v in progress_status.values()):
            print("Both videos done. Running feedback script.")
            run_feedback_script(
            frames_path=r"C:\HoT\demo\output\dance\output_3D\output_keypoints_3d.npz",
            def_path=r"C:\HoT\demo\output\choreo\output_3D\output_keypoints_3d.npz"
            )

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