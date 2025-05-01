# pose_estimator.py
from tf_pose_estimation.tf_pose.estimator import TfPoseEstimator
from tf_pose_estimation.tf_pose.networks import get_graph_path

def get_estimator():
    return TfPoseEstimator(get_graph_path('cmu'), target_size=(432, 368))