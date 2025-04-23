import os
import cv2
import time
import numpy as np
import logging
import sys
import tempfile

logger = logging.getLogger(__name__)

# Add site-packages path if needed
sys.path.append(r'C:\Users\hmarwah2\pose_estimation\ildoonet-tf-pose-estimation\venv\lib\site-packages')

from tf_pose.estimator import TfPoseEstimator
from tf_pose.networks import get_graph_path, model_wh

# Suppress TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Setup logging
# logger = logging.getLogger('OpenPose-Batch-Processor')
# logger.setLevel(logging.DEBUG)
# ch = logging.StreamHandler()
# ch.setLevel(logging.DEBUG)
# ch.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s'))
# logger.addHandler(ch)

# Parameters
input_folder = 'unzipped_videos/Stepsync'
output_folder = 'processed_videos'
model = 'mobilenet_thin'
resize = '432x368'
resize_out_ratio = 4.0

def process_video(input_path, output_path=None, e=None, w=432, h=368, resize_out_ratio=4.0):
    """Process a video file with pose estimation"""
    if output_path is None:
        output_path = input_path.replace('.mp4', '_processed.mp4')
    
    if e is None:
        e = TfPoseEstimator(get_graph_path('mobilenet_thin'), target_size=(w, h))
        
    # Create a temporary directory to store the output
    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, "processed_" + input_file.filename)
    
    # Save the uploaded file temporarily
    temp_input_path = os.path.join(temp_dir, input_file.filename)
    input_file.save(temp_input_path)
    
    # Initialize OpenPose estimator (you'll need to set this up)
    e = TfPoseEstimator(get_graph_path(args.model), target_size=(w, h))
    
    # Process the video
    cap = cv2.VideoCapture(temp_input_path)
    
    if not cap.isOpened():
        logger.error(f"❌ Cannot open video: {temp_input_path}")
        return None

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        humans = e.inference(frame, resize_to_default=(w > 0 and h > 0), upsample_size=resize_out_ratio)
        frame = TfPoseEstimator.draw_humans(frame, humans, imgcopy=False)
        out.write(frame)

    cap.release()
    out.release()
    
    # Clean up the input file
    os.remove(temp_input_path)
    
    return output_path

def main():
    print("🔍 Looking for videos in:", os.path.abspath(input_folder))

    if not os.path.exists(input_folder):
        logger.error(f"❌ Input folder not found: {os.path.abspath(input_folder)}")
        return

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Load pose estimation model
    w, h = model_wh(resize)
    if w <= 0 or h <= 0:
        w, h = 432, 368
    e = TfPoseEstimator(get_graph_path(model), target_size=(w, h))

    # Process each video
    for filename in os.listdir(input_folder):
        if filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            video_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, f"processed_{filename}")
            process_video(video_path, output_path, e, w, h)

    logger.info("🎉 All videos processed.")

if __name__ == '__main__':
    main()
