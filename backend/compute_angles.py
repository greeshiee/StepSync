#!/usr/bin/env python3
import json
import argparse
import numpy as np

# ——— Define which joints to measure ———
# COCO indices: 5=left_shoulder, 7=left_elbow, 9=left_wrist, etc.
ANGLE_DEFS = {
    "left_elbow":  (5, 7, 9),
    "right_elbow": (6, 8, 10),
    "left_knee":   (11,13,15),
    "right_knee":  (12,14,16),
}

def get_kp(pt_dict, idx):
    """
    Given a dict of keypoints for one person, return (x,y,conf)
    for index idx (COCO index). If missing, returns (None,None,0).
    """
    kp = pt_dict.get(str(idx), {})
    return kp.get("x"), kp.get("y"), kp.get("confidence", 0)

def angle_between(a, b, c):
    """
    Compute the angle at point b formed by points a–b–c.
    a, b, c are (x,y) tuples.
    """
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    # protect against zero-length
    if np.linalg.norm(ba)==0 or np.linalg.norm(bc)==0:
        return None
    cosang = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    cosang = np.clip(cosang, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

def main():
    p = argparse.ArgumentParser(
        description="Compute joint angles from a COCO-style pose JSON."
    )
    p.add_argument("input_json",  help="path to input pose JSON")
    p.add_argument("output_json", help="where to write angles JSON")
    p.add_argument(
        "--conf-thresh", "-c",
        type=float,
        default=0.3,
        help="minimum confidence to trust a keypoint (default: 0.3)"
    )
    args = p.parse_args()

    # 1) load
    with open(args.input_json, "r") as f:
        frames = json.load(f)

    output = []
    # 2) process each frame
    for frame in frames:
        frame_idx = frame.get("frame")
        people = frame.get("keypoints", [])
        if not people:
            continue
        kps = people[0]  # if multiple people, adjust accordingly

        angles = {}
        for name, (ai, bi, ci) in ANGLE_DEFS.items():
            ax, ay, ac = get_kp(kps, ai)
            bx, by, bc = get_kp(kps, bi)
            cx, cy, cc = get_kp(kps, ci)

            # skip if any confidence too low
            if min(ac, bc, cc) < args.conf_thresh:
                angles[name] = None
            else:
                angles[name] = angle_between((ax,ay), (bx,by), (cx,cy))

        output.append({
            "frame": frame_idx,
            "angles": angles
        })

    # 3) write out
    with open(args.output_json, "w") as f:
        json.dump(output, f, indent=2)

    print(f"✔️  Computed angles for {len(output)} frames → {args.output_json}")

if __name__ == "__main__":
    main()
