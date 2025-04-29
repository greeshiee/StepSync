from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import uuid
import numpy as np
import json
import cv2
import math
from tf_pose.estimator import TfPoseEstimator
from tf_pose.networks import get_graph_path

import shutil

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEST_MODE_FILES = {
    "choreography": {
        "json": os.path.abspath("tempfiles/OgBhangra_keypoints.json"),
        "video": os.path.abspath("tempfiles/processed_JeevBhangra.mp4")
    },
    "dance": {
        "json": os.path.abspath("tempfiles/Jeev_keypoints.json"),
        "video": os.path.abspath("tempfiles/processed_OgBhangra.mp4")
    }
}


app = Flask(__name__)
CORS(app,
     origins=["http://localhost:5173"],
     allow_headers=["Content-Type", "Range", "Authorization"],
     methods=["GET", "POST", "OPTIONS"],
     supports_credentials=True,
     expose_headers=["Range"]
)


MODEL_TYPE = 'mobilenet_thin'
TARGET_SIZE = (432, 368)

pose_estimator = TfPoseEstimator(get_graph_path(MODEL_TYPE), target_size=TARGET_SIZE)

def extract_keypoints(humans, image_w, image_h):
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

def process_video_to_json(video_path, output_video_path=None):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    if output_video_path:
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
    else:
        out = None

    video_data = []
    frame_idx = 0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    last_progress = -1

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        humans = pose_estimator.inference(frame, resize_to_default=True, upsample_size=4.0)
        
        keypoints = extract_keypoints(humans, frame.shape[1], frame.shape[0])
        video_data.append({'frame': frame_idx, 'keypoints': keypoints})

        if out:
            frame = TfPoseEstimator.draw_humans(frame, humans, imgcopy=False)
            out.write(frame)

        # testing - delete later
        frame_idx += 1
        progress = int((frame_idx/total_frames)*100)
        if progress % 10 == 0 and progress > 0 and progress != last_progress:
            print(f"Processing: {progress}% complete")
            last_progress = progress

    cap.release()
    if out:
        out.release()
        
    return video_data



ANGLE_DEFS = {
    "left_elbow": (5, 7, 9),
    "right_elbow": (6, 8, 10),
    "left_knee": (11, 13, 15),
    "right_knee": (12, 14, 16),
}

def get_kp(pt_dict, idx):
    kp = pt_dict.get(str(idx), {})
    return kp.get("x"), kp.get("y"), kp.get("confidence", 0)

def angle_between(a, b, c):
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    
    if np.linalg.norm(ba) == 0 or np.linalg.norm(bc) == 0:
        return None
    
    cos_theta = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    cos_theta = np.clip(cos_theta, -1.0, 1.0)
    return np.degrees(np.arccos(cos_theta))

def compute_angles_for_data(video_data):
    angle_data = []
    for frame in video_data:
        people = frame.get("keypoints", [])
        
        if not people:
            continue
            
        kps = people[0] if people else {}
        
        angles = {}
        for joint, (a, b, c) in ANGLE_DEFS.items():
            ax, ay, a_conf = get_kp(kps, a)
            bx, by, b_conf = get_kp(kps, b)
            cx, cy, c_conf = get_kp(kps, c)
            
            if min(a_conf, b_conf, c_conf) < 0.3:
                angles[joint] = None
            else:
                angles[joint] = angle_between((ax, ay), (bx, by), (cx, cy))
        
        angle_data.append({
            "frame": frame["frame"],
            "angles": angles
        })
    
    return angle_data


def format_timestamp(frame, fps=30.0):
    """
    Convert a frame index to a mm:ss.SS timestamp string given fps.
    """
    seconds = frame / fps
    mins = int(seconds // 60)
    secs = seconds - mins * 60
    return f"{mins:02d}:{secs:05.2f}"

def rule_based_feedback(frame, ang_ref, ang_usr, improvement=True):
    """
    For each joint, compute delta = user_angle - ref_angle.
    • If improvement: pick the joint with the largest |delta| and suggest how to correct it.
    • If praise: pick the joint with the smallest |delta| and praise it.
    """
    deltas = {
        joint: ang_usr[joint] - ang_ref[joint]
        for joint in ang_ref
        if joint in ang_usr and ang_usr[joint] is not None and ang_ref[joint] is not None
    }
    if not deltas:
        return None

    if improvement:
        joint, delta = max(deltas.items(), key=lambda kv: abs(kv[1]))
        direction = "bend more" if delta < 0 else "bend less"
        return (
            f"Your **{joint.replace('_', ' ')}** is off by {abs(delta):.1f}° — "
            f"try to {direction} toward {ang_ref[joint]:.0f}°."
        )
    else:
        joint, delta = min(deltas.items(), key=lambda kv: abs(kv[1]))
        return (
            f"Your **{joint.replace('_', ' ')}** is spot-on (within {abs(delta):.1f}°) — great job!"
        )

def get_spread_frames(scores, frames_data, n=5, best=True, fps=30):
    """
    Get top n frames that are spread out to avoid consecutive frames.
    best=True → lowest diffs (your best).
    best=False → highest diffs (need improvement).
    Returns list of frame dicts with feedback and timestamps.
    """
    # Sort frames by similarity (best or worst first)
    sorted_frames = sorted(
        frames_data,
        key=lambda x: x['similarity'],
        reverse=not best
    )
    
    selected_frames = []
    last_frame_num = -10  # Initialize with a value that won't conflict
    
    for frame in sorted_frames:
        frame_num = frame['frame']
        # Only select frames at least 5 frames apart
        if abs(frame_num - last_frame_num) > 5:  
            selected_frames.append(frame)
            last_frame_num = frame_num
            if len(selected_frames) >= n:
                break
    
    # If we didn't get enough frames, add the next best ones regardless of spacing
    if len(selected_frames) < n:
        for frame in sorted_frames:
            if frame not in selected_frames:
                selected_frames.append(frame)
                if len(selected_frames) >= n:
                    break
    
    return selected_frames

def calculate_similarity(choreo_data, dance_data, fps=30):
    # Convert both datasets to consistent format
    def prepare_angles(data):
        if isinstance(data, list) and len(data) > 0 and 'keypoints' in data[0]:
            # This is processed video data (from process_video_to_json)
            return compute_angles_for_data(data)
        elif isinstance(data, list) and len(data) > 0 and 'angles' in data[0]:
            # This is test data (already has angles)
            return data
        return []
    
    angles_choreo = prepare_angles(choreo_data)
    angles_dance = prepare_angles(dance_data)
    
    # Convert to dict format for easier processing
    angles_ref = {frame['frame']: frame['angles'] for frame in angles_choreo if 'angles' in frame}
    angles_usr = {frame['frame']: frame['angles'] for frame in angles_dance if 'angles' in frame}
    
    # Get shared frames
    shared = set(angles_ref.keys()) & set(angles_usr.keys())
    
    # Calculate similarity for all shared frames
    sims = {}
    for frame in shared:
        similarity = compute_angle_similarity(angles_ref[frame], angles_usr[frame])
        if similarity != math.inf:
            sims[frame] = similarity
    
    if not sims:
        return 0.0, [], []
    
    # Get top frames
    worst = get_top_n(sims, n=5, best=False)
    best = get_top_n(sims, n=5, best=True)
    
    # Prepare results
    enhanced_best_frames = []
    for frame, _ in best:
        feedback = rule_based_feedback(
            frame, 
            angles_ref.get(frame, {}), 
            angles_usr.get(frame, {}),
            improvement=False
        )
        enhanced_best_frames.append({
            'frame': frame,
            'similarity': 1 - (sims[frame] / 180),  # Convert to similarity score (0-1)
            'timestamp': format_timestamp(frame, fps),
            'feedback': feedback or "No significant joint angles detected"
        })
    
    enhanced_worst_frames = []
    for frame, _ in worst:
        feedback = rule_based_feedback(
            frame, 
            angles_ref.get(frame, {}), 
            angles_usr.get(frame, {}),
            improvement=True
        )
        enhanced_worst_frames.append({
            'frame': frame,
            'similarity': 1 - (sims[frame] / 180),  # Convert to similarity score (0-1)
            'timestamp': format_timestamp(frame, fps),
            'feedback': feedback or "No significant joint angles detected"
        })
    
    # Calculate overall similarity (average of all frame similarities)
    overall_similarity = sum(1 - (s / 180) for s in sims.values()) / len(sims) if sims else 0.0
    
    return overall_similarity, enhanced_best_frames, enhanced_worst_frames

def compute_angle_similarity(a1, a2):
    """
    Average absolute difference across all common, non-None angles.
    Returns math.inf if no valid comparisons.
    """
    keys = [k for k in a1 if k in a2 and a1[k] is not None and a2[k] is not None]
    if not keys:
        return math.inf
    total = sum(abs(a1[k] - a2[k]) for k in keys)
    return total / len(keys)

def get_top_n(sim_map, n=5, best=True):
    """
    Return the top-n frames by similarity.
    best=True → lowest diffs (your best).
    best=False → highest diffs (need improvement).
    """
    return sorted(
        sim_map.items(),
        key=lambda kv: kv[1],
        reverse=not best
    )[:n]

def calculate_frame_similarities(angles_choreo, angles_dance):
    total_sim = 0.0
    count = 0
    frame_similarities = []
    min_frames = min(len(angles_choreo), len(angles_dance))
    
    for i in range(min_frames):
        frame_sim, frame_count = process_frame(
            angles_choreo[i]["angles"], 
            angles_dance[i]["angles"]
        )
        
        total_sim += frame_sim
        count += frame_count
        frame_similarities.append({
            "frame": i,
            "similarity": frame_sim / frame_count if frame_count > 0 else 0.0
        })
    
    return total_sim, count, frame_similarities

def process_frame(a1, a2):
    frame_sim = 0.0
    frame_count = 0
    
    for joint in a1:
        if joint in a2 and a1[joint] is not None and a2[joint] is not None:
            angle_diff = abs(a1[joint] - a2[joint])
            joint_sim = 1.0 - (angle_diff / 180.0)
            frame_sim += joint_sim
            frame_count += 1
    
    return frame_sim, frame_count

def get_best_worst_frames(frame_similarities, top_n=5):
    sorted_frames = sorted(frame_similarities, key=lambda x: x["similarity"], reverse=True)
    return sorted_frames[:top_n], sorted_frames[-top_n:]




video_cache = {}
@app.route('/api/feedback', methods=['GET', 'POST'])
def feedback():
    if request.method == 'GET':
        return jsonify({
            'message': 'Test mode working!',
            'test_data': {
                'similarity': 0.85,
                'video_urls': {
                    'choreography': '/api/videos/test_choreo',
                    'dance': '/api/videos/test_dance'
                }
            }
        })
    
    print("\n=== Headers ===")
    print(request.headers)
    print("\n=== Form Data ===")
    print(request.form)
    print("\n=== Files ===")
    print(request.files)
    print("\n\n--- NEW REQUEST RECEIVED ---")

    test_mode = 'test' in request.args

    if test_mode:
        print("TESTING - USING PREPROCESSED FILES")
        try:
            with open(TEST_MODE_FILES['choreography']['json']) as f:
                choreo_data = json.load(f)
            with open(TEST_MODE_FILES['dance']['json']) as f:
                dance_data = json.load(f)

            # Ensure test data has the right structure
            if isinstance(choreo_data, list) and len(choreo_data) > 0 and 'angles' not in choreo_data[0]:
                choreo_data = compute_angles_for_data(choreo_data)
            if isinstance(dance_data, list) and len(dance_data) > 0 and 'angles' not in dance_data[0]:
                dance_data = compute_angles_for_data(dance_data)

            temp_dir = tempfile.mkdtemp()
            processed_dir = os.path.join(temp_dir, "processed")
            os.makedirs(processed_dir, exist_ok=True)

            choreo_processed_path = os.path.join(processed_dir, "choreo_processed.mp4")
            dance_processed_path = os.path.join(processed_dir, "dance_processed.mp4")
            shutil.copyfile(TEST_MODE_FILES['choreography']['video'], choreo_processed_path)
            shutil.copyfile(TEST_MODE_FILES['dance']['video'], dance_processed_path)

            fps = 30
            similarity, best_frames, worst_frames = calculate_similarity(choreo_data, dance_data, fps)
            # ... rest of the test code ...

            choreo_id = str(uuid.uuid4())
            dance_id = str(uuid.uuid4())
            video_cache[choreo_id] = choreo_processed_path
            video_cache[dance_id] = dance_processed_path

            return jsonify({
                'message': 'Analysis complete',
                'similarity': similarity,
                'frame_analysis': {
                    'best_frames': best_frames,
                    'worst_frames': worst_frames
                },
                'video_urls': {
                    'choreography': f'/api/videos/{choreo_id}',
                    'dance': f'/api/videos/{dance_id}'
                },
                'analysis_data': {
                    'choreography': choreo_data,
                    'dance': dance_data
                }
            })
        except Exception as e:
            import traceback
            print("Error:", e)
            traceback.print_exc()
            return jsonify({'error': f'Test mode failed: {str(e)}'}), 500


    
    if 'choreography' not in request.files or 'dance' not in request.files:
        return jsonify({'error': 'Both videos are required'}), 400

    try:
        temp_dir = tempfile.mkdtemp()
        print(f"Created temp dir: {temp_dir}")

        choreo_path = os.path.join(temp_dir, "choreo.mp4")
        dance_path = os.path.join(temp_dir, "dance.mp4")
        request.files['choreography'].save(choreo_path)
        request.files['dance'].save(dance_path)

        processed_dir = os.path.join(temp_dir, "processed")
        os.makedirs(processed_dir, exist_ok=True)
        
        print("Processing choreography...")
        choreo_processed_path = os.path.join(processed_dir, "choreo_processed.mp4")
        choreo_data = process_video_to_json(choreo_path, output_video_path=choreo_processed_path)

        print("Processing dance...")
        dance_processed_path = os.path.join(processed_dir, "dance_processed.mp4")
        dance_data = process_video_to_json(dance_path, output_video_path=dance_processed_path)

        similarity = calculate_similarity(choreo_data, dance_data)

        choreo_id = str(uuid.uuid4())
        dance_id = str(uuid.uuid4())
        
        video_cache[choreo_id] = choreo_processed_path
        video_cache[dance_id] = dance_processed_path

        return jsonify({
            'message': 'Analysis complete',
            'similarity': similarity,
            'video_urls': {
                'choreography': f'/api/videos/{choreo_id}',
                'dance': f'/api/videos/{dance_id}'
            },
            'analysis_data': {
                'choreography': choreo_data,
                'dance': dance_data
            }
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if not test_mode:
            for f in [choreo_path, dance_path]:
                try:
                    if f and os.path.exists(f):
                        os.remove(f)
                except:
                    pass



@app.route('/api/videos/<video_id>')
def serve_video(video_id):
    video_path = video_cache.get(video_id)
    if not video_path or not os.path.exists(video_path):
        print(f"Video not found: {video_path}")
        return jsonify({'error': 'Video not found'}), 404
    try:
        return send_file(
            video_path,
            mimetype='video/mp4',
            as_attachment=False,
            conditional=True
        )
    except Exception as e:
        print(f"Error serving video {video_path}: {e}")
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)