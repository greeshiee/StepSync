from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import subprocess
import os
import shutil
import time
import threading
import queue

app = Flask(__name__)
CORS(app)

PYTHON_EXECUTABLE = r'C:\Users\zionr\anaconda3\envs\hot2\python.exe'
PROJECT_ROOT = r'C:\HoT'
VIS_SCRIPT_RELATIVE = 'demo/vis2.py'
VIDEO_DIR = os.path.join(PROJECT_ROOT, 'demo', 'video')

log_queue = queue.Queue()

@app.route('/api/feedback', methods=['POST'])
def feedback():
    choreography = request.files.get('choreography')
    dance = request.files.get('dance')

    if not choreography or not dance:
        return jsonify({'error': 'Both videos are required.'}), 400

    os.makedirs('uploads', exist_ok=True)
    os.makedirs(VIDEO_DIR, exist_ok=True)

    temp_choreo_path = os.path.join('uploads', 'choreo.mp4')
    temp_dance_path = os.path.join('uploads', 'dance.mp4')
    choreography.save(temp_choreo_path)
    dance.save(temp_dance_path)

    vis_choreo_path = os.path.join(VIDEO_DIR, 'choreo.mp4')
    vis_dance_path = os.path.join(VIDEO_DIR, 'dance.mp4')
    shutil.copy(temp_choreo_path, vis_choreo_path)
    shutil.copy(temp_dance_path, vis_dance_path)

    time.sleep(1)  # Optional safety buffer

    def run_scripts():
        try:
            for filename in ['choreo.mp4', 'dance.mp4']:
                log_queue.put(f"Starting processing for {filename}...\n")
                process = subprocess.Popen(
                    [PYTHON_EXECUTABLE, 'demo/vis2.py', '--video', filename],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    cwd=PROJECT_ROOT
                )

                for line in process.stdout:
                    log_queue.put(line)

                process.stdout.close()
                returncode = process.wait()

                if returncode != 0:
                    log_queue.put(f"Error while processing {filename}. Return code: {returncode}\n")
                    break
                else:
                    log_queue.put(f"Finished processing {filename}\n")

        except Exception as e:
            log_queue.put(f"Exception: {str(e)}\n")

        log_queue.put("DONE")

    threading.Thread(target=run_scripts).start()
    return jsonify({'message': 'Processing started'})


@app.route('/api/feedback/stream')
def stream():
    def generate():
        while True:
            line = log_queue.get()
            yield f"data: {line}\n\n"
            if line.strip() == "DONE":
                break

    return Response(stream_with_context(generate()), mimetype='text/event-stream')


if __name__ == '__main__':
    app.run(debug=True, threaded=True)
