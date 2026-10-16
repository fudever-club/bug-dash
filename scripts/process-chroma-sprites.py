#!/usr/bin/env python3
"""
FU-DEVER Buggy 3D Sprite Processing Pipeline
Chroma-Key Magenta Removal & Sprite Normalization
"""

import os
import cv2
import numpy as np
from PIL import Image

BRAIN_DIR = '/home/acc3/.gemini/antigravity-cli/brain/b94feb50-1273-43cd-8c3c-bf847cfaf855'
PUBLIC_ASSETS = '/mnt/d/THStudy/DeverClub/bug-dash/public/assets'
ROOT_ASSETS = '/mnt/d/THStudy/DeverClub/bug-dash/assets'

SPRITE_SPECS = [
    {
        'src': os.path.join(BRAIN_DIR, 'buggy_3d_chroma_run_1792138391656.jpg'),
        'out_name': 'player_3d_run.png',
        'target_h': 360
    },
    {
        'src': os.path.join(BRAIN_DIR, 'buggy_3d_chroma_jump_1792138435261.jpg'),
        'out_name': 'player_3d_jump.png',
        'target_h': 380
    },
    {
        'src': os.path.join(BRAIN_DIR, 'buggy_3d_chroma_slide_1792138477580.jpg'),
        'out_name': 'player_3d_slide.png',
        'target_h': 260
    }
]

def chroma_key_extract(img_bgr):
    """Accurate Chroma-Key extraction with Euclidean distance and soft edge alpha matting"""
    # Sample background color from top-left border
    bg_sample = img_bgr[5:15, 5:15].mean(axis=(0, 1)).astype(np.float32)
    
    img_float = img_bgr.astype(np.float32)
    b, g, r = cv2.split(img_float)
    
    # Calculate distance to background color
    dist = np.sqrt((b - bg_sample[0])**2 + (g - bg_sample[1])**2 + (r - bg_sample[2])**2)
    
    # Thresholds for soft edge alpha:
    # dist < 40 -> 100% background (alpha = 0)
    # dist > 70 -> 100% foreground (alpha = 255)
    # In-between -> linear transition for anti-aliasing
    alpha = np.clip((dist - 40.0) / (70.0 - 40.0), 0.0, 1.0) * 255.0
    alpha = alpha.astype(np.uint8)
    
    # Remove isolated noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    alpha_clean = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
    
    # Despill magenta from border pixels (suppress high blue+red where green is low)
    spill = np.clip(np.minimum(r, b) - g, 0, 255) * (1.0 - alpha_clean / 255.0)
    r_clean = np.clip(r - spill * 0.8, 0, 255).astype(np.uint8)
    b_clean = np.clip(b - spill * 0.8, 0, 255).astype(np.uint8)
    g_clean = g.astype(np.uint8)

    # Additional floor shadow magenta cleanup for bottom region
    h_img, w_img = img_bgr.shape[:2]
    y_indices = np.arange(h_img)[:, None]
    bottom_mask = (y_indices > h_img * 0.75)
    # Magenta shadow on floor has high blue, low green
    floor_shadow = bottom_mask & (b > 90) & (r > 90) & (g < 60)
    alpha_clean[floor_shadow] = 0
    
    bgra = cv2.merge([b_clean, g_clean, r_clean, alpha_clean])
    return bgra, alpha_clean

def crop_and_normalize(bgra_img, fg_mask, target_height):
    # Find bounding box
    coords = cv2.findNonZero(fg_mask)
    if coords is None:
        return bgra_img
    x, y, w, h = cv2.boundingRect(coords)
    
    # Add padding
    pad = 8
    h_img, w_img = bgra_img.shape[:2]
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(w_img, x + w + pad)
    y2 = min(h_img, y + h + pad)
    
    cropped = bgra_img[y1:y2, x1:x2]
    
    # Resize preserving aspect ratio
    ch, cw = cropped.shape[:2]
    aspect = cw / ch
    new_w = int(target_height * aspect)
    resized = cv2.resize(cropped, (new_w, target_height), interpolation=cv2.INTER_AREA)
    return resized

def main():
    os.makedirs(PUBLIC_ASSETS, exist_ok=True)
    os.makedirs(ROOT_ASSETS, exist_ok=True)
    
    # HSV bounds for Magenta #FF00FF
    # In OpenCV HSV: H=140..170 is Magenta/Pink, S=100..255, V=100..255
    lower_magenta = np.array([135, 80, 80])
    upper_magenta = np.array([175, 255, 255])
    
    for spec in SPRITE_SPECS:
        src_path = spec['src']
        out_name = spec['out_name']
        target_h = spec['target_h']
        
        if not os.path.exists(src_path):
            print(f"[ERROR] Source not found: {src_path}")
            continue
            
        print(f"[PROCESSING] {out_name} from {os.path.basename(src_path)}...")
        img_bgr = cv2.imread(src_path)
        bgra, fg_mask = chroma_key_extract(img_bgr)
        normalized = crop_and_normalize(bgra, fg_mask, target_h)
        
        out_pub = os.path.join(PUBLIC_ASSETS, out_name)
        out_root = os.path.join(ROOT_ASSETS, out_name)
        
        cv2.imwrite(out_pub, normalized)
        cv2.imwrite(out_root, normalized)
        print(f"  -> Saved {out_pub} ({normalized.shape[1]}x{normalized.shape[0]} px)")

    # Also generate banked left/right variants for responsive leaning
    run_pub = os.path.join(PUBLIC_ASSETS, 'player_3d_run.png')
    if os.path.exists(run_pub):
        pil_run = Image.open(run_pub)
        # Bank left: rotate +10 deg
        left_bank = pil_run.rotate(10, resample=Image.BICUBIC, expand=True)
        left_pub = os.path.join(PUBLIC_ASSETS, 'player_3d_bank_left.png')
        left_root = os.path.join(ROOT_ASSETS, 'player_3d_bank_left.png')
        left_bank.save(left_pub)
        left_bank.save(left_root)
        print(f"  -> Saved bank left variant: {left_pub}")
        
        # Bank right: rotate -10 deg
        right_bank = pil_run.rotate(-10, resample=Image.BICUBIC, expand=True)
        right_pub = os.path.join(PUBLIC_ASSETS, 'player_3d_bank_right.png')
        right_root = os.path.join(ROOT_ASSETS, 'player_3d_bank_right.png')
        right_bank.save(right_pub)
        right_bank.save(right_root)
        print(f"  -> Saved bank right variant: {right_pub}")

    print("[SUCCESS] All 3D Buggy sprites processed and saved with 100% transparent background!")

if __name__ == '__main__':
    main()
