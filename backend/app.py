from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import uuid
import json
import cv2
from tf_pose.estimator import TfPoseEstimator
from tf_pose.networks import get_graph_path

app = Flask(__name__)
CORS(app)

# Constants
MODEL_TYPE = 'mobilenet_thin'  # Consistent model across all processing
TARGET_SIZE = (432, 368)

# Initialize pose estimator once at startup
pose_estimator = TfPoseEstimator(get_graph_path(MODEL_TYPE), target_size=TARGET_SIZE)

def extract_keypoints(humans, image_w, image_h):
    """Consistent keypoint extraction across all files"""
    keypoints_list = []
    for human in humans:
        human_kps = {}
        for part_idx, part in human.body_parts.items():
            human_kps[str(part_idx)] = {
                'x': round(part.x * image_w, 2),
                'y': round(part.y * image_h, 2),
                'confidence': round(part.score, 3)
            }
        keypoints_list.append(human_kps)
    return keypoints_list

def process_video_to_json(video_path):
    """Process video and return keypoints data"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    video_data = []
    frame_num = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        humans = pose_estimator.inference(frame, resize_to_default=True, upsample_size=4.0)
        keypoints = extract_keypoints(humans, frame.shape[1], frame.shape[0])

        video_data.append({
            'frame': frame_num,
            'keypoints': keypoints
        })
        frame_num += 1

    cap.release()
    return video_data

def calculate_similarity(choreo_data, dance_data):
    """Implement your actual similarity calculation here"""
    # Placeholder - implement your comparison logic
    min_frames = min(len(choreo_data), len(dance_data))
    if min_frames == 0:
        return 0
    
    matches = 0
    for i in range(min_frames):
        # Compare keypoints between frames
        # This should be your actual comparison algorithm
        if some_similarity_condition(choreo_data[i], dance_data[i]):
            matches += 1
    
    return matches / min_frames

@app.route('/api/feedback', methods=['POST'])
def feedback():
    print("\n\n--- NEW REQUEST RECEIVED ---")
    
    if 'choreography' not in request.files or 'dance' not in request.files:
        print("Error: Missing files!")
        return jsonify({'error': 'Both videos are required'}), 400

    try:
        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        print(f"Created temp dir: {temp_dir}")
        
        # Save uploaded files
        choreo_path = os.path.join(temp_dir, "choreo.mp4")
        dance_path = os.path.join(temp_dir, "dance.mp4")
        request.files['choreography'].save(choreo_path)
        request.files['dance'].save(dance_path)
        print("Saved video files temporarily")

        # Process videos - ADD VERBOSE LOGGING
        print("Processing choreography video...")
        choreo_data = process_video_to_json(choreo_path)
        print("Processing dance video...")
        dance_data = process_video_to_json(dance_path)
        
        # Calculate similarity
        similarity = calculate_similarity(choreo_data, dance_data)
        print(f"Calculated similarity: {similarity}")

        # Generate response
        response = {
            'message': 'Analysis complete',
            'similarity': similarity,
            'video_urls': {
                'choreography': f'/api/videos/choreo_{uuid.uuid4()}',
                'dance': f'/api/videos/dance_{uuid.uuid4()}'
            }
        }
        print("Returning response:", response)
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing videos: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up
        print("Cleaning up temp files...")
        for f in [choreo_path, dance_path]:
            try:
                if f and os.path.exists(f):
                    os.remove(f)
            except Exception as e:
                print(f"Error removing {f}: {e}")

@app.route('/api/videos/<video_id>')
def serve_video(video_id):
    # In a real implementation, you would:
    # 1. Look up the actual video file based on video_id
    # 2. Return the video file with proper headers
    return jsonify({'error': 'Video serving not implemented'}), 501

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)