from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import shutil
import time

app = Flask(__name__)
CORS(app)

PYTHON_EXECUTABLE = r'C:\Users\zionr\anaconda3\envs\hot2\python.exe'
PROJECT_ROOT = r'C:\HoT'
VIS_SCRIPT_RELATIVE = 'demo/vis2.py'
VIDEO_DIR = os.path.join(PROJECT_ROOT, 'demo', 'video')

@app.route('/api/feedback', methods=['POST'])
def feedback():
    choreography = request.files.get('choreography')
    dance = request.files.get('dance')

    if not choreography or not dance:
        return jsonify({'error': 'Both videos are required.'}), 400

    os.makedirs('uploads', exist_ok=True)
    os.makedirs(VIDEO_DIR, exist_ok=True)

    # Save videos to a temporary upload directory first
    temp_choreo_path = os.path.join('uploads', 'choreo.mp4')
    temp_dance_path = os.path.join('uploads', 'dance.mp4')
    choreography.save(temp_choreo_path)
    dance.save(temp_dance_path)

    # Move videos to demo/video/ directory with expected names
    vis_choreo_path = os.path.join(VIDEO_DIR, 'choreo.mp4')
    vis_dance_path = os.path.join(VIDEO_DIR, 'dance.mp4')
    shutil.copy(temp_choreo_path, vis_choreo_path)
    shutil.copy(temp_dance_path, vis_dance_path)


    time.sleep(3)

    try:
        output_logs = []

        for filename in ['choreo.mp4', 'dance.mp4']:
            result = subprocess.run(
                [PYTHON_EXECUTABLE, 'demo/vis2.py', '--video', filename],
                capture_output=True,
                text=True,
                cwd=PROJECT_ROOT
            )

            if result.returncode != 0:
                return jsonify({'error': result.stderr.strip()}), 500

            output_logs.append(result.stdout.strip())

        return jsonify({'log': "\n\n".join(output_logs)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
