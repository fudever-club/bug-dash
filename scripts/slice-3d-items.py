#!/usr/bin/env python3
"""
FU-DEVER 3D Game Items Slicing Pipeline
Extract 5 high-resolution 3D items from Chroma-Key sheet
"""

import os
import cv2
import numpy as np

SRC_SHEET = '/home/acc3/.gemini/antigravity-cli/brain/b94feb50-1273-43cd-8c3c-bf847cfaf855/items_3d_chroma_sheet_1792143248026.jpg'
PUB_DIR = '/mnt/d/THStudy/DeverClub/bug-dash/public/assets'
ROOT_DIR = '/mnt/d/THStudy/DeverClub/bug-dash/assets'

ITEM_NAMES = [
    'item_3d_star.png',
    'item_3d_coffee.png',
    'item_3d_gem.png',
    'item_3d_bug.png',
    'item_3d_deadline.png'
]

def main():
    os.makedirs(PUB_DIR, exist_ok=True)
    os.makedirs(ROOT_DIR, exist_ok=True)

    img = cv2.imread(SRC_SHEET)
    h, w = img.shape[:2]

    # Sample magenta background from top-left
    bg_sample = img[5:20, 5:20].mean(axis=(0, 1)).astype(np.float32)

    img_float = img.astype(np.float32)
    b, g, r = cv2.split(img_float)

    # Euclidean distance to magenta
    dist = np.sqrt((b - bg_sample[0])**2 + (g - bg_sample[1])**2 + (r - bg_sample[2])**2)

    # Soft alpha threshold
    alpha = np.clip((dist - 45.0) / (75.0 - 45.0), 0.0, 1.0) * 255.0
    alpha = alpha.astype(np.uint8)

    # Strict Magenta kill (any pixel with high blue, high red, and low green)
    magenta_bleed = (b > 110) & (r > 130) & (g < 95)
    alpha[magenta_bleed] = 0

    # Clean small artifacts & slight edge erosion to remove fringe
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
    alpha = cv2.erode(alpha, kernel, iterations=1)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)

    # Despill magenta from border pixels
    spill = np.clip(np.minimum(r, b) - g, 0, 255) * (1.0 - alpha / 255.0)
    r_clean = np.clip(r - spill * 0.9, 0, 255).astype(np.uint8)
    b_clean = np.clip(b - spill * 0.9, 0, 255).astype(np.uint8)
    g_clean = g.astype(np.uint8)

    bgra = cv2.merge([b_clean, g_clean, r_clean, alpha])

    # Find connected components to isolate 5 items
    contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter valid bounding boxes (area > 5000)
    boxes = []
    for c in contours:
        area = cv2.contourArea(c)
        if area > 8000:
            x, y, bw, bh = cv2.boundingRect(c)
            boxes.append((x, y, bw, bh))

    # Sort boxes from left to right (by X coordinate)
    boxes = sorted(boxes, key=lambda b: b[0])
    print(f"Found {len(boxes)} items on sheet.")

    if len(boxes) != 5:
        # Fallback to 5 equal vertical slices
        print("Using grid slice fallback...")
        step = w // 5
        boxes = [(i * step + 20, 100, step - 40, h - 200) for i in range(5)]

    pad = 8
    for i, (x, y, bw, bh) in enumerate(boxes[:5]):
        name = ITEM_NAMES[i]
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w, x + bw + pad)
        y2 = min(h, y + bh + pad)

        cropped = bgra[y1:y2, x1:x2]

        # Target 256px resolution for maximum clarity
        target_size = 256
        ch, cw = cropped.shape[:2]
        aspect = cw / ch
        if aspect > 1:
            nw = target_size
            nh = int(target_size / aspect)
        else:
            nh = target_size
            nw = int(target_size * aspect)

        resized = cv2.resize(cropped, (nw, nh), interpolation=cv2.INTER_AREA)

        # Center on 256x256 square canvas
        square = np.zeros((target_size, target_size, 4), dtype=np.uint8)
        off_x = (target_size - nw) // 2
        off_y = (target_size - nh) // 2
        square[off_y:off_y+nh, off_x:off_x+nw] = resized

        out_pub = os.path.join(PUB_DIR, name)
        out_root = os.path.join(ROOT_DIR, name)
        cv2.imwrite(out_pub, square)
        cv2.imwrite(out_root, square)
        print(f"  -> Extracted {name} ({target_size}x{target_size} px)")

    print("[SUCCESS] All 5 high-resolution 3D items extracted!")

if __name__ == '__main__':
    main()
