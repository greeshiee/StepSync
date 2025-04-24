#!/usr/bin/env python3
import json
import argparse


def load_angles(json_path):
    """Load angles JSON and return a list of angle dictionaries sorted by frame."""
    with open(json_path, "r") as f:
        data = json.load(f)
    return sorted(data, key=lambda x: x.get("frame", 0))


def compute_similarity(angles1, angles2):
    """
    Compute a similarity score between two angle JSON lists.
    Similarity per angle = 1 - (abs(a1 - a2) / 180).
    Overall similarity is the average across all valid joints and frames.
    """
    total_sim = 0.0
    count = 0
    # Compare up to the shorter length
    n_frames = min(len(angles1), len(angles2))
    for i in range(n_frames):
        a1 = angles1[i]["angles"]
        a2 = angles2[i]["angles"]
        for joint in a1:
            if joint in a2:
                v1 = a1[joint]
                v2 = a2[joint]
                if v1 is None or v2 is None:
                    continue
                sim = 1.0 - (abs(v1 - v2) / 180.0)
                total_sim += sim
                count += 1
    if count == 0:
        return 0.0
    return (total_sim / count) * 100.0


def main():
    parser = argparse.ArgumentParser(
        description="Compare two angle JSON files and compute a similarity percentage."
    )
    parser.add_argument(
        "reference_json", help="Path to reference angles JSON file"
    )
    parser.add_argument(
        "user_json", help="Path to user angles JSON file"
    )
    args = parser.parse_args()

    ref_angles = load_angles(args.reference_json)
    usr_angles = load_angles(args.user_json)

    score = compute_similarity(ref_angles, usr_angles)
    print(f"Accuracy Score: {score:.2f}%")


if __name__ == "__main__":
    main()
