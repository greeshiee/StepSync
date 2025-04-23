import sys
from tf_pose.estimator import TfPoseEstimator

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import uuid
from process_video2 import process_video
from code_json_file import process_video_to_json, extract_keypoints
import cv2
from tf_pose.networks import get_graph_path, model_wh

app = Flask(__name__)
CORS(app)

# Initialize pose estimator once
model_type = 'mobilenet_thin'
w, h = model_wh('432x368')
pose_estimator = TfPoseEstimator(get_graph_path(model_type), target_size=(w, h))

def analyze_videos(choreo_path, dance_path):
    """Analyze both videos and return comparison results"""
    # Process videos to get pose data
    choreo_data = process_video_to_analysis(choreo_path)
    dance_data = process_video_to_analysis(dance_path)
    
    # Here you would add your comparison logic
    similarity_score = calculate_similarity(choreo_data, dance_data)
    
    return {
        'similarity_score': similarity_score,
        'key_differences': find_key_differences(choreo_data, dance_data)
    }

def process_video_to_analysis(video_path):
    """Wrapper to process video and return analysis data"""
    # Create temp json path
    temp_dir = tempfile.mkdtemp()
    json_path = os.path.join(temp_dir, "keypoints.json")
    
    # Use your existing function
    process_video_to_json(video_path, json_path, pose_estimator, w, h)
    
    # Load and return the data
    with open(json_path, 'r') as f:
        return json.load(f)

def calculate_similarity(data1, data2):
    """Placeholder for your similarity calculation"""
    # Implement your actual comparison logic here
    return 0.85  # dummy value

def find_key_differences(data1, data2):
    """Placeholder for difference detection"""
    # Implement your actual difference detection here
    return []  # dummy value

@app.route('/api/feedback', methods=['POST'])
def feedback():
    if 'choreography' not in request.files or 'dance' not in request.files:
        return jsonify({'error': 'Both videos are required'}), 400
    
    try:
        # Create temp directory for processing
        temp_dir = tempfile.mkdtemp()
        
        # Save uploaded files
        choreo_path = os.path.join(temp_dir, "choreo.mp4")
        dance_path = os.path.join(temp_dir, "dance.mp4")
        request.files['choreography'].save(choreo_path)
        request.files['dance'].save(dance_path)
        
        # Process videos with pose estimation
        processed_choreo = process_video(choreo_path)
        processed_dance = process_video(dance_path)
        
        # Analyze the results
        analysis = analyze_videos(choreo_path, dance_path)
        
        # Generate response
        return jsonify({
            'message': 'Analysis complete',
            'analysis': analysis,
            'video_urls': {
                'choreography': f'/api/videos/choreo_{uuid.uuid4()}',
                'dance': f'/api/videos/dance_{uuid.uuid4()}'
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up temp files
        for f in [choreo_path, dance_path]:
            if os.path.exists(f):
                os.remove(f)

@app.route('/api/videos/<video_id>', methods=['GET'])
def get_video(video_id):
    # In a real implementation, you'd look up the actual file
    # For demo purposes, we'll return a placeholder
    return jsonify({'message': 'Video would be served here'}), 501

if __name__ == '__main__':
    app.run(debug=True)