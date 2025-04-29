#!/usr/bin/env python3
import json
import math
import argparse


def load_angles(json_path):
    """
    Load a JSON of the form:
      [
        { "frame": 0, "angles": { "left_elbow": 134.5, … } },
        …
      ]
    Returns a dict: frame_index → angles dict.
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    result = {}
    for entry in data:
        frame = entry.get("frame")
        ang   = entry.get("angles")
        if frame is None or ang is None:
            continue
        result[frame] = ang
    return result


def compute_similarity(a1, a2):
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


def format_timestamp(frame, fps):
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


def analyze_videos(ref_json, usr_json, fps, out_path=None):
    angles_ref = load_angles(ref_json)
    angles_usr = load_angles(usr_json)
    shared     = set(angles_ref) & set(angles_usr)
    sims       = {f: compute_similarity(angles_ref[f], angles_usr[f]) for f in shared}

    # filter out frames with no valid comparisons
    valid = {f: score for f, score in sims.items() if score != math.inf}
    if not valid:
        print("No valid frames with comparable joint angles found.")
        return

    worst = get_top_n(valid, n=5, best=False)
    best  = get_top_n(valid, n=5, best=True)

    lines = []
    lines.append("Frames Needing Improvement:\n")
    for f, _ in worst:
        tip = rule_based_feedback(f, angles_ref[f], angles_usr[f], improvement=True)
        if tip:
            ts = format_timestamp(f, fps)
            lines.append(f"Frame {f} (at {ts}): {tip}\n")

    lines.append("\nFrames Where You’re At Your Best:\n")
    for f, _ in best:
        praise = rule_based_feedback(f, angles_ref[f], angles_usr[f], improvement=False)
        if praise:
            ts = format_timestamp(f, fps)
            lines.append(f"Frame {f} (at {ts}): {praise}\n")

    output = "\n".join(lines)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Results written to {out_path}")
    else:
        print(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Compare two angle-JSONs and generate 5 frames needing improvement + 5 frames at best."
    )
    parser.add_argument("reference", help="Path to reference angles JSON")
    parser.add_argument("user",      help="Path to user angles JSON")
    parser.add_argument(
        "--fps", type=float, default=30.0,
        help="Frame rate of video (frames per second) for timestamp conversion"
    )
    parser.add_argument(
        "-o", "--output",
        help="Optional path to write results to (plain-text file)"
    )
    args = parser.parse_args()

    analyze_videos(args.reference, args.user, fps=args.fps, out_path=args.output)
