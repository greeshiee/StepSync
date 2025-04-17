import os
import cv2
import time
import numpy as np
import logging
import sys

# Add site-packages path if needed
sys.path.append(r'C:\Users\hmarwah2\pose_estimation\ildoonet-tf-pose-estimation\venv\lib\site-packages')

from tf_pose.estimator import TfPoseEstimator
from tf_pose.networks import get_graph_path, model_wh

# Suppress TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Setup logging
logger = logging.getLogger('OpenPose-Batch-Processor')
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
ch.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s'))
logger.addHandler(ch)

# Parameters
input_folder = 'unzipped_videos/Stepsync'
output_folder = 'processed_videos'
model = 'mobilenet_thin'
resize = '432x368'
resize_out_ratio = 4.0

def process_video(video_path, output_path, e, w, h):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        logger.error(f"❌ Cannot open video: {video_path}")
        return

    # Get FPS and resolution, use fallback if unavailable
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

    print(f"📏 Video settings — FPS: {fps}, Width: {width}, Height: {height}")

    # Set up video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    logger.info(f"🔄 Processing: {os.path.basename(video_path)}")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # OpenPose inference
        humans = e.inference(frame, resize_to_default=(w > 0 and h > 0), upsample_size=resize_out_ratio)
        frame = TfPoseEstimator.draw_humans(frame, humans, imgcopy=False)

        out.write(frame)

        # Show frame in window
        cv2.imshow("Pose Estimation", frame)
        if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit early
            break

    cap.release()
    out.release()
    cv2.destroyAllWindows()
    logger.info(f"✅ Saved: {output_path}")

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
