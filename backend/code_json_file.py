import os
import cv2
import json
import logging
import sys

# Add path to site-packages if needed
sys.path.append(r'C:\Users\hmarwah2\pose_estimation\ildoonet-tf-pose-estimation\venv\lib\site-packages')

from tf_pose.estimator import TfPoseEstimator
from tf_pose.networks import get_graph_path, model_wh

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OpenPose-Keypoint-Extractor")

# Folder paths
input_folder = 'temp_processed_videos'
output_folder = 'keypoints_json'
model = 'mobilenet_thin'
resize = '432x368'
resize_out_ratio = 4.0

# Safe keypoint extractor (avoids KeyError)
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

# Process a single video
def process_video_to_json(video_path, output_json_path, e=None, w=432, h=368):
    if e is None:
        e = TfPoseEstimator(get_graph_path('mobilenet_thin'), target_size=(w, h))
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"❌ Cannot open video: {video_path}")
        return

    frame_num = 0
    video_data = []

    while cap.isOpened():
        ret, image = cap.read()
        if not ret:
            break

        humans = e.inference(image, resize_to_default=(w > 0 and h > 0), upsample_size=resize_out_ratio)
        keypoints = extract_keypoints(humans, image.shape[1], image.shape[0])

        video_data.append({
            'frame': frame_num,
            'keypoints': keypoints
        })

        frame_num += 1

    cap.release()

    with open(output_json_path, 'w') as f:
        json.dump(video_data, f, indent=2)

    logger.info(f"✅ Saved keypoints to: {output_json_path}")

# Main batch processor
def main():
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    w, h = model_wh(resize)
    if w <= 0 or h <= 0:
        w, h = 432, 368
    e = TfPoseEstimator(get_graph_path(model), target_size=(w, h))

    for filename in os.listdir(input_folder):
        if filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            video_path = os.path.join(input_folder, filename)
            json_filename = os.path.splitext(filename)[0] + '.json'
            output_json_path = os.path.join(output_folder, json_filename)

            logger.info(f"📦 Extracting from: {filename}")
            process_video_to_json(video_path, output_json_path, e, w, h)

    logger.info("🎉 All videos processed and keypoints saved.")

if __name__ == '__main__':
    main()
