#!/usr/bin/env python3
"""
=============================================================================
FU-DEVER 3D Game Art & Multi-Frame Sprite Sheet Craftsman
High-Fidelity Automated Asset Pipeline for Reactor Rush / Bug Dash
=============================================================================
Enforces Anti-AI Stylized Game Art principles:
- 100% Clean 2X Background Plates (Layer 0, zero ghost artifacts, zero AI blur)
- Multi-Frame Animated Spritesheets (Layer 1, crisp RGBA, defringed alpha)
- 2X Flat 3D Glassmorphism HUD & UI Badges (Layer 3)
- Comprehensive Spritesheets JSON Metadata
=============================================================================
"""

import os
import sys
import json
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# ---------------------------------------------------------------------------
# Directories & Paths Setup
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
BRAIN_DIR = '/home/acc3/.gemini/antigravity-cli/brain/deedd593-dce8-47f3-a06b-49c5e229e4ec'

PUBLIC_REACTOR = os.path.join(PROJECT_ROOT, 'public', 'assets', 'reactor')
DIST_REACTOR = os.path.join(PROJECT_ROOT, 'dist', 'assets', 'reactor')
ROOT_REACTOR = os.path.join(PROJECT_ROOT, 'assets', 'reactor')

TARGET_FOLDERS = [PUBLIC_REACTOR, DIST_REACTOR, ROOT_REACTOR]

for folder in TARGET_FOLDERS:
    os.makedirs(folder, exist_ok=True)

# ---------------------------------------------------------------------------
# FU-DEVER Brand Color Tokens
# ---------------------------------------------------------------------------
PALETTE = {
    'deepSpace': (7, 10, 18),         # #070A12
    'surfaceCard': (15, 23, 42),      # #0F172A
    'fptOrange': (242, 111, 33),      # #F26F21
    'deverCyan': (0, 229, 255),       # #00E5FF
    'cyanGlow': (56, 189, 248),       # #38BDF8
    'deverMagenta': (255, 42, 133),   # #FF2A85
    'magentaGlow': (244, 114, 182),   # #F472B6
    'stemGold': (255, 214, 0),        # #FFD600
    'goldGlow': (250, 204, 21),       # #FACC15
    'freezeIce': (112, 225, 255),     # #70E1FF
    'crispWhite': (255, 255, 255)     # #FFFFFF
}

# ---------------------------------------------------------------------------
# Helper: Save image to all target deployment directories
# ---------------------------------------------------------------------------
def deploy_image(pil_img, filename, format_type='PNG', quality=95):
    for folder in TARGET_FOLDERS:
        dest_path = os.path.join(folder, filename)
        if format_type.upper() in ['JPG', 'JPEG']:
            pil_img.convert('RGB').save(dest_path, format='JPEG', quality=quality, optimize=True)
        else:
            pil_img.save(dest_path, format='PNG', optimize=True)
    print(f"  ✓ Deployed {filename} ({pil_img.size[0]}x{pil_img.size[1]} {format_type})")

# ---------------------------------------------------------------------------
# PART 1: 100% Clean 2X Background Plates (Layer 0)
# ---------------------------------------------------------------------------
def generate_background_plates():
    print("\n[STEP 1] Generating Clean 2X High-Resolution Background Plates (1280x1440)...")

    plate_configs = [
        {
            'src': os.path.join(BRAIN_DIR, 'round1_bg_plate_1792570699684.jpg'),
            'out': 'round1_bg.jpg',
            'y_top': 120,
            'desc': 'Power Grid & Magnetic Accelerator'
        },
        {
            'src': os.path.join(BRAIN_DIR, 'round2_bg_plate_1792570727129.jpg'),
            'out': 'round2_bg.jpg',
            'y_top': 120,
            'desc': 'Duo Arc Capacitor & Circuit Terminal'
        },
        {
            'src': os.path.join(BRAIN_DIR, 'round3_bg_plate_1792570748814.jpg'),
            'out': 'round3_bg.jpg',
            'y_top': 120,
            'desc': 'Cryo Sub-Zero Reactor Core'
        },
        {
            'src': os.path.join(BRAIN_DIR, 'victory_bg_plate_1792570775085.jpg'),
            'out': 'victory_bg.jpg',
            'y_top': 100,
            'desc': 'STEM Fair 2026 Champion Victory Stage'
        }
    ]

    for cfg in plate_configs:
        if not os.path.exists(cfg['src']):
            print(f"  [ERROR] Source plate missing: {cfg['src']}")
            continue

        im = Image.open(cfg['src'])
        w, h = im.size
        # Exact 8:9 aspect ratio crop (matching 640:720 canvas)
        target_h = int(w * 9.0 / 8.0)
        y_start = max(0, min(cfg['y_top'], h - target_h))
        cropped = im.crop((0, y_start, w, y_start + target_h))

        # Scale to 2X high-DPI resolution (1280x1440) using high-quality Lanczos resampling
        res_2x = cropped.resize((1280, 1440), Image.Resampling.LANCZOS)

        # Subtle unsharp mask to ensure cel-shaded ink outlines are tack sharp
        sharpened = res_2x.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))

        deploy_image(sharpened, cfg['out'], format_type='JPEG', quality=96)
        print(f"    - {cfg['desc']} -> {cfg['out']}")

# ---------------------------------------------------------------------------
# Helper: Clean, Defringe & Alpha-Matte Master Base Sprites
# ---------------------------------------------------------------------------
def load_and_clean_sprite(filename):
    """Loads a sprite from public/assets/reactor, trims empty bounds, and defringes alpha."""
    p = os.path.join(PUBLIC_REACTOR, filename)
    if not os.path.exists(p):
        raise FileNotFoundError(f"Base sprite not found: {p}")

    img = Image.open(p).convert('RGBA')
    arr = np.array(img)
    alpha = arr[:, :, 3]

    # Find non-zero bounds
    coords = cv2.findNonZero((alpha > 15).astype(np.uint8))
    if coords is None:
        return img
    x, y, w, h = cv2.boundingRect(coords)

    # Add small 2px safety padding
    pad = 2
    h_img, w_img = arr.shape[:2]
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(w_img, x + w + pad)
    y2 = min(h_img, y + h + pad)

    cropped_arr = arr[y1:y2, x1:x2].copy()

    # Alpha matting & morphological smoothing to eliminate jagged fringes
    c_alpha = cropped_arr[:, :, 3]
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    # Soften binary edges slightly for clean rendering against dark plates
    c_alpha_smooth = cv2.morphologyEx(c_alpha, cv2.MORPH_CLOSE, kernel)
    cropped_arr[:, :, 3] = c_alpha_smooth

    return Image.fromarray(cropped_arr, 'RGBA')

# ---------------------------------------------------------------------------
# Visual FX Helpers (Cel-shaded spark, lightning, starburst, smoke, flame)
# ---------------------------------------------------------------------------
def draw_cel_shaded_spark(draw, cx, cy, radius, primary_color, core_color=(255, 255, 255, 255)):
    """Draws a crisp 4-point diamond sparkle star with outer glow and white core."""
    r = radius
    r_core = max(1.5, r * 0.45)
    r_mid = max(1.0, r * 0.15)

    # 4-point outer diamond star
    pts = [
        (cx, cy - r), (cx + r_mid, cy - r_mid),
        (cx + r, cy), (cx + r_mid, cy + r_mid),
        (cx, cy + r), (cx - r_mid, cy + r_mid),
        (cx - r, cy), (cx - r_mid, cy - r_mid)
    ]
    draw.polygon(pts, fill=primary_color)

    # White-hot inner star
    pts_core = [
        (cx, cy - r_core), (cx + r_mid * 0.5, cy - r_mid * 0.5),
        (cx + r_core, cy), (cx + r_mid * 0.5, cy + r_mid * 0.5),
        (cx, cy + r_core), (cx - r_mid * 0.5, cy + r_mid * 0.5),
        (cx - r_core, cy), (cx - r_mid * 0.5, cy - r_mid * 0.5)
    ]
    draw.polygon(pts_core, fill=core_color)

def draw_electric_arc(draw, pts, primary_color, core_color=(255, 255, 255, 255), width=3):
    """Draws a jagged high-voltage electric arc bolt with bright neon aura and white core."""
    # Outer colored lightning
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=primary_color, width=width)
    # Inner white hot core
    if width > 1:
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i+1]], fill=core_color, width=max(1, width - 2))

def draw_plasma_exhaust_flame(draw, cx, cy, length, width, primary_color, core_color=(255, 255, 255, 255)):
    """Draws a directional cel-shaded ion thruster plume pointing downward."""
    # Outer plasma teardrop
    poly = [
        (cx - width / 2, cy),
        (cx + width / 2, cy),
        (cx + width * 0.3, cy + length * 0.6),
        (cx, cy + length),
        (cx - width * 0.3, cy + length * 0.6)
    ]
    draw.polygon(poly, fill=primary_color)

    # White-hot inner flame
    poly_core = [
        (cx - width * 0.25, cy),
        (cx + width * 0.25, cy),
        (cx, cy + length * 0.65)
    ]
    draw.polygon(poly_core, fill=core_color)

def draw_ice_crystal_burst(draw, cx, cy, radius, primary_color, core_color=(255, 255, 255, 255)):
    """Draws stylized hexagonal ice crystal needles and freezing vortex bursts."""
    angles = [0, 60, 120, 180, 240, 300]
    for deg in angles:
        rad = math.radians(deg)
        x_end = cx + math.cos(rad) * radius
        y_end = cy + math.sin(rad) * radius
        draw.line([(cx, cy), (x_end, y_end)], fill=primary_color, width=2)
        # Small barb spurs on each crystal arm
        spur_rad = math.radians(deg + 35)
        spur_x = cx + math.cos(rad) * (radius * 0.6) + math.cos(spur_rad) * (radius * 0.3)
        spur_y = cy + math.sin(rad) * (radius * 0.6) + math.sin(spur_rad) * (radius * 0.3)
        draw.line([(cx + math.cos(rad) * (radius * 0.6), cy + math.sin(rad) * (radius * 0.6)), (spur_x, spur_y)], fill=primary_color, width=1)

    draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=core_color)

# ---------------------------------------------------------------------------
# PART 2: Kart Multi-Frame Sprite Sheets (`sheet_kart_cyan` & `sheet_kart_pink`)
# ---------------------------------------------------------------------------
def generate_kart_spritesheets():
    print("\n[STEP 2] Generating Multi-Frame Kart Spritesheets (4 frames x 160x160 px)...")

    kart_configs = [
        {
            'base_file': 'sprite_kart_cyan.png',
            'out_file': 'sheet_kart_cyan.png',
            'primary_color': PALETTE['deverCyan'] + (255,),
            'glow_color': PALETTE['cyanGlow'] + (200,),
            'accent_name': 'Cyan'
        },
        {
            'base_file': 'sprite_kart_pink.png',
            'out_file': 'sheet_kart_pink.png',
            'primary_color': PALETTE['deverMagenta'] + (255,),
            'glow_color': PALETTE['magentaGlow'] + (200,),
            'accent_name': 'Pink'
        }
    ]

    FRAME_W = 160
    FRAME_H = 160
    TOTAL_FRAMES = 4
    SHEET_W = FRAME_W * TOTAL_FRAMES
    SHEET_H = FRAME_H

    for cfg in kart_configs:
        base_sprite = load_and_clean_sprite(cfg['base_file'])
        bw, bh = base_sprite.size

        # Scale base kart to fit within ~116 x 132 px inside 160x160 frame
        scale = min(116.0 / bw, 132.0 / bh)
        tw = int(bw * scale)
        th = int(bh * scale)
        kart_scaled = base_sprite.resize((tw, th), Image.Resampling.LANCZOS)

        # Baseline alignment: Kart wheels sit solidly at y ≈ 146
        base_x = (FRAME_W - tw) // 2
        base_y = 146 - th

        sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))

        for frame_idx in range(TOTAL_FRAMES):
            frame_x_offset = frame_idx * FRAME_W
            frame_img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(frame_img)

            # Ground Contact Shadow (Cel-shaded dark ambient occlusion oval)
            shadow_rx = 42
            shadow_ry = 6.5
            shadow_y = 147
            shadow_color = (4, 7, 15, 160)

            # --- FRAME 0: Idle nhịp nhàng, đèn LED sáng dịu ---
            if frame_idx == 0:
                draw.ellipse([80 - shadow_rx, shadow_y - shadow_ry, 80 + shadow_rx, shadow_y + shadow_ry], fill=shadow_color)
                frame_img.paste(kart_scaled, (base_x, base_y), kart_scaled)

                # Soft gentle LED glow on front bumper
                draw.ellipse([80 - 10, base_y + th - 24, 80 + 10, base_y + th - 18], fill=cfg['glow_color'])

            # --- FRAME 1: Bánh xe xoay phát sáng hồ quang, thân xe nhún nhẹ ---
            elif frame_idx == 1:
                # Suspension squash (+2px down, slight width expansion)
                squash_y = base_y + 2
                squash_w = int(tw * 1.015)
                squash_h = int(th * 0.985)
                kart_squashed = kart_scaled.resize((squash_w, squash_h), Image.Resampling.LANCZOS)
                kx = (FRAME_W - squash_w) // 2

                # Shadow slightly wider due to compression
                draw.ellipse([80 - (shadow_rx + 3), shadow_y - shadow_ry, 80 + (shadow_rx + 3), shadow_y + shadow_ry], fill=(4, 7, 15, 180))
                frame_img.paste(kart_squashed, (kx, squash_y), kart_squashed)

                # Wheel Arc Sparks (Left wheel x=34, Right wheel x=126, y=134)
                draw_cel_shaded_spark(draw, 34, 134, 7, cfg['primary_color'])
                draw_cel_shaded_spark(draw, 126, 134, 7, cfg['primary_color'])

                # Subtle wheel motion arc lines
                draw.arc([26, 126, 42, 142], start=120, end=300, fill=cfg['primary_color'], width=2)
                draw.arc([118, 126, 134, 142], start=60, end=240, fill=cfg['primary_color'], width=2)

            # --- FRAME 2: Ăng-ten và ống hút rung lắc cơ khí, đèn pha lóe sáng ---
            elif frame_idx == 2:
                # Suspension rebound (-2px up)
                rebound_y = base_y - 2
                rebound_w = int(tw * 0.99)
                rebound_h = int(th * 1.01)
                kart_rebound = kart_scaled.resize((rebound_w, rebound_h), Image.Resampling.LANCZOS)
                kx = (FRAME_W - rebound_w) // 2

                draw.ellipse([80 - (shadow_rx - 2), shadow_y - (shadow_ry - 1), 80 + (shadow_rx - 2), shadow_y + (shadow_ry - 1)], fill=(4, 7, 15, 140))
                frame_img.paste(kart_rebound, (kx, rebound_y), kart_rebound)

                # Headlights flare burst (dual crisp diamond flares at front lamps)
                lamp_y = rebound_y + rebound_h - 22
                draw_cel_shaded_spark(draw, 64, lamp_y, 9, cfg['primary_color'])
                draw_cel_shaded_spark(draw, 96, lamp_y, 9, cfg['primary_color'])

                # Antenna vibration micro-spark at top (cx=80, top of buggy)
                draw_cel_shaded_spark(draw, 82, rebound_y + 4, 6, (255, 255, 255, 255))

            # --- FRAME 3: Luồng phản lực phía sau bốc nhẹ, lốp xe hoàn tất 1 vòng quay ---
            elif frame_idx == 3:
                # Neutral baseline
                draw.ellipse([80 - shadow_rx, shadow_y - shadow_ry, 80 + shadow_rx, shadow_y + shadow_ry], fill=shadow_color)
                frame_img.paste(kart_scaled, (base_x, base_y), kart_scaled)

                # Rear Ion Thruster Plasma Jets firing backward
                # Keep within baseline y <= 153 for zero grounding drift
                draw_plasma_exhaust_flame(draw, 52, 138, length=12, width=8, primary_color=cfg['primary_color'])
                draw_plasma_exhaust_flame(draw, 108, 138, length=12, width=8, primary_color=cfg['primary_color'])

                # Small trailing plasma embers within baseline
                draw.ellipse([51, 151, 53, 153], fill=(255, 255, 255, 240))
                draw.ellipse([107, 151, 109, 153], fill=(255, 255, 255, 240))

            # Paste into master spritesheet
            sheet.paste(frame_img, (frame_x_offset, 0), frame_img)

        deploy_image(sheet, cfg['out_file'], format_type='PNG')
        print(f"  ✓ Produced {cfg['out_file']} for {cfg['accent_name']} Buggy.")

# ---------------------------------------------------------------------------
# PART 3: Circuit Mecha Sprite Sheets (`sheet_circuit_cyan` & `sheet_circuit_pink`)
# ---------------------------------------------------------------------------
def generate_circuit_spritesheets():
    print("\n[STEP 3] Generating Multi-Frame Circuit Mecha Spritesheets (4 frames x 160x160 px)...")

    configs = [
        {
            'base_file': 'sprite_circuit_cyan.png',
            'out_file': 'sheet_circuit_cyan.png',
            'primary_color': PALETTE['deverCyan'] + (255,),
            'spark_color': (255, 255, 255, 255),
            'accent_name': 'Cyan Crane Bot'
        },
        {
            'base_file': 'sprite_circuit_pink.png',
            'out_file': 'sheet_circuit_pink.png',
            'primary_color': PALETTE['deverMagenta'] + (255,),
            'spark_color': (255, 255, 255, 255),
            'accent_name': 'Pink Crane Bot'
        }
    ]

    FRAME_W = 160
    FRAME_H = 160
    TOTAL_FRAMES = 4
    SHEET_W = FRAME_W * TOTAL_FRAMES
    SHEET_H = FRAME_H

    for cfg in configs:
        base_sprite = load_and_clean_sprite(cfg['base_file'])
        bw, bh = base_sprite.size

        # Fit into ~134 x 114 px
        scale = min(134.0 / bw, 114.0 / bh)
        tw = int(bw * scale)
        th = int(bh * scale)
        bot_scaled = base_sprite.resize((tw, th), Image.Resampling.LANCZOS)

        base_x = (FRAME_W - tw) // 2
        base_y = 146 - th

        sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))

        for frame_idx in range(TOTAL_FRAMES):
            frame_x_offset = frame_idx * FRAME_W
            frame_img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(frame_img)

            shadow_rx = 46
            shadow_ry = 6.5
            shadow_y = 147
            draw.ellipse([80 - shadow_rx, shadow_y - shadow_ry, 80 + shadow_rx, shadow_y + shadow_ry], fill=(4, 7, 15, 160))

            # --- FRAME 0: Gập tay cơ khí, trạng thái chờ ---
            if frame_idx == 0:
                frame_img.paste(bot_scaled, (base_x, base_y), bot_scaled)
                # LED ready indicator on chest
                draw.ellipse([78, base_y + 40, 82, base_y + 44], fill=cfg['primary_color'])

            # --- FRAME 1: Vươn kẹp phóng tia lửa nhỏ ---
            elif frame_idx == 1:
                # Slight reach forward (+3px shift)
                reach_x = base_x + (3 if 'Cyan' in cfg['accent_name'] else -3)
                frame_img.paste(bot_scaled, (reach_x, base_y), bot_scaled)

                # Crane clamp tip spark (around x=135 or x=25)
                clamp_x = reach_x + tw - 8 if 'Cyan' in cfg['accent_name'] else reach_x + 8
                clamp_y = base_y + 36
                draw_cel_shaded_spark(draw, clamp_x, clamp_y, 8, cfg['primary_color'])
                # Micro spark dots
                draw.point([(clamp_x + 4, clamp_y - 4), (clamp_x - 3, clamp_y + 5)], fill=cfg['spark_color'])

            # --- FRAME 2: Kẹp chặt chốt điện hồ quang cực mạnh ---
            elif frame_idx == 2:
                frame_img.paste(bot_scaled, (base_x, base_y), bot_scaled)
                clamp_x = base_x + tw - 6 if 'Cyan' in cfg['accent_name'] else base_x + 6
                clamp_y = base_y + 36

                # Huge high-voltage electric arc discharge across the clamp
                arc_pts1 = [(clamp_x - 12, clamp_y - 10), (clamp_x - 4, clamp_y - 2), (clamp_x + 6, clamp_y - 12), (clamp_x + 14, clamp_y)]
                arc_pts2 = [(clamp_x - 8, clamp_y + 12), (clamp_x + 2, clamp_y + 4), (clamp_x + 10, clamp_y + 14), (clamp_x + 18, clamp_y + 2)]
                draw_electric_arc(draw, arc_pts1, cfg['primary_color'], (255, 255, 255, 255), width=3)
                draw_electric_arc(draw, arc_pts2, cfg['primary_color'], (255, 255, 255, 255), width=3)
                draw_cel_shaded_spark(draw, clamp_x, clamp_y, 14, cfg['primary_color'])

            # --- FRAME 3: Dòng điện chạy qua thân rô-bốt, giật lùi nhẹ ---
            elif frame_idx == 3:
                # Recoil backward (-2px shift)
                recoil_x = base_x - (2 if 'Cyan' in cfg['accent_name'] else -2)
                frame_img.paste(bot_scaled, (recoil_x, base_y), bot_scaled)

                # Electric ripple lines through torso mecha plating
                torso_cx = recoil_x + tw // 2
                torso_cy = base_y + th // 2
                body_arc = [(torso_cx - 16, torso_cy - 12), (torso_cx - 6, torso_cy), (torso_cx + 8, torso_cy - 6), (torso_cx + 16, torso_cy + 8)]
                draw_electric_arc(draw, body_arc, cfg['primary_color'], (255, 255, 255, 255), width=2)
                draw_cel_shaded_spark(draw, torso_cx, torso_cy, 6, cfg['primary_color'])

            sheet.paste(frame_img, (frame_x_offset, 0), frame_img)

        deploy_image(sheet, cfg['out_file'], format_type='PNG')
        print(f"  ✓ Produced {cfg['out_file']} for {cfg['accent_name']}.")

# ---------------------------------------------------------------------------
# PART 4: Cryo Mecha Sprite Sheets (`sheet_cryo_cyan` & `sheet_cryo_pink`)
# ---------------------------------------------------------------------------
def generate_cryo_spritesheets():
    print("\n[STEP 4] Generating Multi-Frame Cryo Mecha Spritesheets (4 frames x 160x160 px)...")

    configs = [
        {
            'base_file': 'sprite_cryo_cyan.png',
            'out_file': 'sheet_cryo_cyan.png',
            'ice_color': PALETTE['freezeIce'] + (255,),
            'white_core': (255, 255, 255, 255),
            'accent_name': 'Cyan Cryo Bot'
        },
        {
            'base_file': 'sprite_cryo_pink.png',
            'out_file': 'sheet_cryo_pink.png',
            'ice_color': PALETTE['freezeIce'] + (255,),
            'white_core': (255, 255, 255, 255),
            'accent_name': 'Pink Cryo Bot'
        }
    ]

    FRAME_W = 160
    FRAME_H = 160
    TOTAL_FRAMES = 4
    SHEET_W = FRAME_W * TOTAL_FRAMES
    SHEET_H = FRAME_H

    for cfg in configs:
        base_sprite = load_and_clean_sprite(cfg['base_file'])
        bw, bh = base_sprite.size

        # Fit into ~134 x 114 px
        scale = min(134.0 / bw, 114.0 / bh)
        tw = int(bw * scale)
        th = int(bh * scale)
        bot_scaled = base_sprite.resize((tw, th), Image.Resampling.LANCZOS)

        base_x = (FRAME_W - tw) // 2
        base_y = 146 - th

        sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))

        for frame_idx in range(TOTAL_FRAMES):
            frame_x_offset = frame_idx * FRAME_W
            frame_img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(frame_img)

            shadow_rx = 46
            shadow_ry = 6.5
            shadow_y = 147
            draw.ellipse([80 - shadow_rx, shadow_y - shadow_ry, 80 + shadow_rx, shadow_y + shadow_ry], fill=(4, 7, 15, 160))

            # Nozzle point is approximately at cannon front
            muzzle_x = base_x + tw - 12 if 'Cyan' in cfg['accent_name'] else base_x + 12
            muzzle_y = base_y + 40

            # --- FRAME 0: Nạp khí lạnh, khoang làm mát phát sáng ---
            if frame_idx == 0:
                frame_img.paste(bot_scaled, (base_x, base_y), bot_scaled)
                # Frost condensation ring around muzzle
                draw.ellipse([muzzle_x - 6, muzzle_y - 6, muzzle_x + 6, muzzle_y + 6], outline=cfg['ice_color'], width=1)
                draw.point([(muzzle_x - 8, muzzle_y - 2), (muzzle_x + 7, muzzle_y + 3)], fill=cfg['white_core'])

            # --- FRAME 1: Nòng súng lùi giật mở van, phóng tia sương băng ---
            elif frame_idx == 1:
                # Recoil backward (-3px)
                recoil_x = base_x - (3 if 'Cyan' in cfg['accent_name'] else -3)
                frame_img.paste(bot_scaled, (recoil_x, base_y), bot_scaled)
                m_x = recoil_x + tw - 12 if 'Cyan' in cfg['accent_name'] else recoil_x + 12

                # Shockwave vapor ring exiting muzzle
                draw.ellipse([m_x - 10, muzzle_y - 10, m_x + 10, muzzle_y + 10], outline=cfg['white_core'], width=2)
                draw_cel_shaded_spark(draw, m_x + (8 if 'Cyan' in cfg['accent_name'] else -8), muzzle_y, 7, cfg['ice_color'])

            # --- FRAME 2: Sóng băng tuyết -196°C bùng nổ cực mạnh ---
            elif frame_idx == 2:
                # Max recoil & bracing posture
                recoil_x = base_x - (4 if 'Cyan' in cfg['accent_name'] else -4)
                frame_img.paste(bot_scaled, (recoil_x, base_y), bot_scaled)
                m_x = recoil_x + tw - 10 if 'Cyan' in cfg['accent_name'] else recoil_x + 10

                # Explosive sub-zero blizzard blast cone
                blast_dir = 1 if 'Cyan' in cfg['accent_name'] else -1
                cone_tip = (m_x, muzzle_y)
                cone_top = (m_x + 36 * blast_dir, muzzle_y - 28)
                cone_bot = (m_x + 36 * blast_dir, muzzle_y + 28)
                cone_mid = (m_x + 42 * blast_dir, muzzle_y)

                # Freezing shockwave arcs
                draw.arc([min(m_x, m_x + 32 * blast_dir), muzzle_y - 24, max(m_x, m_x + 32 * blast_dir), muzzle_y + 24],
                         start=0, end=360, fill=cfg['ice_color'], width=2)

                # Hexagonal ice crystal bursts in front of cannon
                draw_ice_crystal_burst(draw, m_x + 20 * blast_dir, muzzle_y - 12, 10, cfg['ice_color'])
                draw_ice_crystal_burst(draw, m_x + 26 * blast_dir, muzzle_y + 14, 12, cfg['ice_color'])
                draw_ice_crystal_burst(draw, m_x + 34 * blast_dir, muzzle_y - 2, 14, cfg['ice_color'])

            # --- FRAME 3: Xả hơi sương mù, nòng súng trở về vị trí ---
            elif frame_idx == 3:
                frame_img.paste(bot_scaled, (base_x, base_y), bot_scaled)
                blast_dir = 1 if 'Cyan' in cfg['accent_name'] else -1

                # Dispersing cryogenic fog clouds
                fog_x = muzzle_x + 24 * blast_dir
                draw.ellipse([fog_x - 14, muzzle_y - 12, fog_x + 14, muzzle_y + 12], fill=(112, 225, 255, 90))
                draw.ellipse([fog_x + 10 * blast_dir - 10, muzzle_y - 6, fog_x + 10 * blast_dir + 10, muzzle_y + 14], fill=(112, 225, 255, 60))
                draw.point([(fog_x - 8, muzzle_y + 10), (fog_x + 6, muzzle_y - 14)], fill=cfg['white_core'])

            sheet.paste(frame_img, (frame_x_offset, 0), frame_img)

        deploy_image(sheet, cfg['out_file'], format_type='PNG')
        print(f"  ✓ Produced {cfg['out_file']} for {cfg['accent_name']}.")

# ---------------------------------------------------------------------------
# PART 5: Golden Plasma Energy Orb (`sheet_energy_orb.png` - 6x 64x64 px)
# ---------------------------------------------------------------------------
def generate_energy_orb_spritesheet():
    print("\n[STEP 5] Generating Multi-Frame 3D Plasma Energy Orb Spritesheet (6 frames x 64x64 px)...")

    FRAME_W = 64
    FRAME_H = 64
    TOTAL_FRAMES = 6
    SHEET_W = FRAME_W * TOTAL_FRAMES
    SHEET_H = FRAME_H

    sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))

    cx = 32
    cy = 32
    orb_radius = 14

    for frame_idx in range(TOTAL_FRAMES):
        frame_x_offset = frame_idx * FRAME_W
        frame_img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame_img)

        # 3D Orbital ring angles for current frame
        ring1_angle = (frame_idx * 30.0) % 180.0
        ring2_angle = ((frame_idx * 30.0) + 60.0) % 180.0

        # Pulse breathing effect on central plasma core
        pulse = math.sin(frame_idx * math.pi / 3.0) * 1.5
        curr_r = orb_radius + pulse

        # 1. Draw BACK half of orbital rings (behind plasma orb for 3D depth!)
        def draw_orbital_half(angle_deg, is_front):
            rad = math.radians(angle_deg)
            # Ellipse parameters
            major_r = 25.0
            minor_r = 9.0
            # Sample points along ellipse
            pts = []
            steps = 40
            start_t = 0.0 if is_front else math.pi
            end_t = math.pi if is_front else 2.0 * math.pi

            for i in range(steps + 1):
                t = start_t + (end_t - start_t) * (i / float(steps))
                x_local = major_r * math.cos(t)
                y_local = minor_r * math.sin(t)
                # Rotate by angle_deg
                rx = cx + (x_local * math.cos(rad) - y_local * math.sin(rad))
                ry = cy + (x_local * math.sin(rad) + y_local * math.cos(rad))
                pts.append((rx, ry))

            # Draw smooth arc
            color = (255, 214, 0, 240) if is_front else (242, 111, 33, 140)
            for i in range(len(pts) - 1):
                draw.line([pts[i], pts[i+1]], fill=color, width=2 if is_front else 1)

            # Draw electron particle on orbital ring
            if is_front:
                electron_t = (frame_idx * 60.0) % 180.0
                e_rad = math.radians(electron_t)
                ex_l = major_r * math.cos(e_rad)
                ey_l = minor_r * math.sin(e_rad)
                ex = cx + (ex_l * math.cos(rad) - ey_l * math.sin(rad))
                ey = cy + (ex_l * math.sin(rad) + ey_l * math.cos(rad))
                draw_cel_shaded_spark(draw, ex, ey, 4.5, (255, 214, 0, 255), (255, 255, 255, 255))

        # Render Back Halves
        draw_orbital_half(ring1_angle, is_front=False)
        draw_orbital_half(ring2_angle, is_front=False)

        # 2. Draw Golden Plasma Core (Multi-layered cel-shaded sphere with dark ink outline)
        # Outer dark ink contour
        draw.ellipse([cx - curr_r - 1.5, cy - curr_r - 1.5, cx + curr_r + 1.5, cy + curr_r + 1.5], fill=(15, 23, 42, 255))
        # Outer flame rim
        draw.ellipse([cx - curr_r, cy - curr_r, cx + curr_r, cy + curr_r], fill=PALETTE['fptOrange'] + (255,))
        # Mid golden plasma
        draw.ellipse([cx - curr_r * 0.75, cy - curr_r * 0.75, cx + curr_r * 0.75, cy + curr_r * 0.75], fill=PALETTE['stemGold'] + (255,))
        # Inner high-energy bright core
        draw.ellipse([cx - curr_r * 0.45, cy - curr_r * 0.45, cx + curr_r * 0.45, cy + curr_r * 0.45], fill=PALETTE['goldGlow'] + (255,))
        # White-hot fusion center
        draw.ellipse([cx - curr_r * 0.22, cy - curr_r * 0.22, cx + curr_r * 0.22, cy + curr_r * 0.22], fill=(255, 255, 255, 255))

        # 3. Draw FRONT half of orbital rings (in front of plasma orb)
        draw_orbital_half(ring1_angle, is_front=True)
        draw_orbital_half(ring2_angle, is_front=True)

        # 4. Tiny dynamic solar micro-flare
        flare_angle = frame_idx * (2.0 * math.pi / TOTAL_FRAMES)
        fx = cx + math.cos(flare_angle) * (curr_r + 3)
        fy = cy + math.sin(flare_angle) * (curr_r + 3)
        draw.line([(cx + math.cos(flare_angle) * curr_r, cy + math.sin(flare_angle) * curr_r), (fx, fy)], fill=(255, 255, 255, 230), width=1)

        sheet.paste(frame_img, (frame_x_offset, 0), frame_img)

    deploy_image(sheet, 'sheet_energy_orb.png', format_type='PNG')
    print("  ✓ Produced sheet_energy_orb.png (6x 64x64 px).")

# ---------------------------------------------------------------------------
# PART 6: Champion Trophy Sprite Sheet (`sheet_champ_trophy.png` - 4x 128x128 px)
# ---------------------------------------------------------------------------
def generate_trophy_spritesheet():
    print("\n[STEP 6] Generating Multi-Frame Champion Trophy Spritesheet (4 frames x 128x128 px)...")

    FRAME_W = 128
    FRAME_H = 128
    TOTAL_FRAMES = 4
    SHEET_W = FRAME_W * TOTAL_FRAMES
    SHEET_H = FRAME_H

    base_trophy = load_and_clean_sprite('sprite_champ_trophy.png')
    bw, bh = base_trophy.size

    # Fit into ~94 x 112 px centered inside 128x128 frame
    scale = min(94.0 / bw, 112.0 / bh)
    tw = int(bw * scale)
    th = int(bh * scale)
    trophy_scaled = base_trophy.resize((tw, th), Image.Resampling.LANCZOS)

    base_x = (FRAME_W - tw) // 2
    base_y = 124 - th

    sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))

    for frame_idx in range(TOTAL_FRAMES):
        frame_x_offset = frame_idx * FRAME_W
        frame_img = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame_img)

        # Trophy contact shadow on podium
        draw.ellipse([64 - 36, 122, 64 + 36, 128], fill=(4, 7, 15, 180))
        frame_img.paste(trophy_scaled, (base_x, base_y), trophy_scaled)

        # Star Sparkle Locations:
        # Left Handle: (base_x + 14, base_y + 32)
        # Top Rim / STEM Atom: (64, base_y + 12)
        # Right Handle: (base_x + tw - 14, base_y + 32)
        # Base Pedestal: (64, base_y + th - 12)

        # --- FRAME 0: Golden Ambient Radiance & Specular Sweep ---
        if frame_idx == 0:
            # Soft warm sheen on bowl
            draw.line([(base_x + 28, base_y + 40), (base_x + 36, base_y + 58)], fill=(255, 255, 255, 180), width=2)

        # --- FRAME 1: Left Handle Starburst ---
        elif frame_idx == 1:
            draw_cel_shaded_spark(draw, base_x + 14, base_y + 32, 10, PALETTE['stemGold'] + (255,))
            draw.ellipse([base_x + 14 - 3, base_y + 32 - 3, base_x + 14 + 3, base_y + 32 + 3], fill=(255, 255, 255, 255))

        # --- FRAME 2: Top Crown / STEM Atom Starburst ---
        elif frame_idx == 2:
            draw_cel_shaded_spark(draw, 64, base_y + 12, 13, PALETTE['stemGold'] + (255,))
            # Cross lens flare
            draw.line([(64 - 16, base_y + 12), (64 + 16, base_y + 12)], fill=(255, 255, 255, 220), width=1)
            draw.line([(64, base_y + 12 - 16), (64, base_y + 12 + 16)], fill=(255, 255, 255, 220), width=1)

        # --- FRAME 3: Right Handle & Pedestal Starburst ---
        elif frame_idx == 3:
            draw_cel_shaded_spark(draw, base_x + tw - 14, base_y + 32, 10, PALETTE['stemGold'] + (255,))
            draw_cel_shaded_spark(draw, 64, base_y + th - 12, 7, PALETTE['goldGlow'] + (255,))

        sheet.paste(frame_img, (frame_x_offset, 0), frame_img)

    deploy_image(sheet, 'sheet_champ_trophy.png', format_type='PNG')
    print("  ✓ Produced sheet_champ_trophy.png (4x 128x128 px).")

# ---------------------------------------------------------------------------
# PART 7: 2X High-DPI Flat 3D Glassmorphism HUD & UI Assets (Layer 3)
# ---------------------------------------------------------------------------
def generate_hud_ui_assets():
    print("\n[STEP 7] Generating Flat 3D Glassmorphism HUD Badges (Layer 3 - 2X Assets)...")

    # 1. Round Badge (`hud_round_badge.png` - 320x96 px)
    rb = Image.new('RGBA', (320, 96), (0, 0, 0, 0))
    d_rb = ImageDraw.Draw(rb)
    # Frosted dark acrylic container
    d_rb.rounded_rectangle([4, 4, 316, 92], radius=24, fill=(10, 16, 32, 225), outline=(15, 23, 42, 255), width=2)
    # Inner neon cyan bevel
    d_rb.rounded_rectangle([7, 7, 313, 89], radius=22, outline=(0, 229, 255, 200), width=2)
    # Glass specular sheen on upper 45%
    d_rb.rounded_rectangle([9, 9, 311, 44], radius=18, fill=(255, 255, 255, 24))
    # Corner technical notches
    d_rb.line([(18, 4), (4, 18)], fill=(0, 229, 255, 255), width=3)
    d_rb.line([(302, 4), (316, 18)], fill=(0, 229, 255, 255), width=3)
    deploy_image(rb, 'hud_round_badge.png', format_type='PNG')

    # 2. Timer Capsule (`hud_timer_capsule.png` - 320x96 px)
    tc = Image.new('RGBA', (320, 96), (0, 0, 0, 0))
    d_tc = ImageDraw.Draw(tc)
    # Full capsule shape (r=44)
    d_tc.rounded_rectangle([4, 4, 316, 92], radius=44, fill=(10, 16, 32, 230), outline=(15, 23, 42, 255), width=2)
    d_tc.rounded_rectangle([7, 7, 313, 89], radius=42, outline=(56, 189, 248, 220), width=2)
    # Upper gloss reflection
    d_tc.rounded_rectangle([10, 10, 310, 44], radius=38, fill=(255, 255, 255, 22))
    # Micro technical calibration tick marks along bottom
    for tx in range(60, 260, 16):
        d_tc.line([(tx, 76), (tx, 82)], fill=(56, 189, 248, 160), width=2)
    deploy_image(tc, 'hud_timer_capsule.png', format_type='PNG')

    # 3. Score Pill (`hud_score_pill.png` - 380x96 px)
    sp = Image.new('RGBA', (380, 96), (0, 0, 0, 0))
    d_sp = ImageDraw.Draw(sp)
    # Master Bento container
    d_sp.rounded_rectangle([4, 4, 376, 92], radius=24, fill=(10, 16, 32, 230), outline=(15, 23, 42, 255), width=2)
    d_sp.rounded_rectangle([7, 7, 373, 89], radius=22, outline=(255, 214, 0, 200), width=2)
    # Left emblem chamber (width 80)
    d_sp.rounded_rectangle([12, 12, 88, 84], radius=16, fill=(15, 23, 42, 240), outline=(255, 214, 0, 120), width=1)
    # Right recessed digital score counter window
    d_sp.rounded_rectangle([96, 12, 368, 84], radius=16, fill=(7, 10, 18, 250), outline=(242, 111, 33, 120), width=1)
    # Upper gloss reflection across score pill
    d_sp.rounded_rectangle([100, 14, 364, 42], radius=12, fill=(255, 255, 255, 18))
    deploy_image(sp, 'hud_score_pill.png', format_type='PNG')

    # 4. Combo Multiplier Badge (`hud_combo_multiplier.png` - 240x96 px)
    cm = Image.new('RGBA', (240, 96), (0, 0, 0, 0))
    d_cm = ImageDraw.Draw(cm)
    # Angled dynamic polygon badge
    poly = [(32, 4), (236, 4), (208, 92), (4, 92)]
    d_cm.polygon(poly, fill=(10, 16, 32, 235), outline=(15, 23, 42, 255))
    # Glowing neon magenta border
    poly_inner = [(34, 7), (232, 7), (206, 89), (8, 89)]
    d_cm.polygon(poly_inner, outline=(255, 42, 133, 230))
    # Warning chevron stripes on left
    for ch_x in [38, 54, 70]:
        d_cm.line([(ch_x, 24), (ch_x - 12, 72)], fill=(255, 214, 0, 180), width=3)
    # Upper gloss
    d_cm.polygon([(36, 10), (228, 10), (218, 44), (20, 44)], fill=(255, 255, 255, 25))
    deploy_image(cm, 'hud_combo_multiplier.png', format_type='PNG')

# ---------------------------------------------------------------------------
# PART 8: Spritesheet Metadata JSON (`spritesheets_metadata.json`)
# ---------------------------------------------------------------------------
def generate_metadata_json():
    print("\n[STEP 8] Generating spritesheets_metadata.json...")

    metadata = {
        "version": "2.0.0",
        "system": "Reactor Rush / Bug Dash Multi-Frame Animation Engine",
        "craftsman": "FU-DEVER 3D Game Art & Multi-Frame Sprite Sheet Craftsman",
        "aesthetic": "Stylized 3D Cel-shaded, Clean Graphic Vector, Zero AI Slop",
        "brandTokens": {
            "deepSpace": "#070A12",
            "surfaceCard": "#0F172A",
            "fptOrange": "#F26F21",
            "deverCyan": "#00E5FF",
            "deverMagenta": "#FF2A85",
            "stemGold": "#FFD600",
            "freezeIce": "#70E1FF",
            "crispWhite": "#FFFFFF"
        },
        "backgroundPlates": {
            "round1": {
                "file": "assets/reactor/round1_bg.jpg",
                "width": 1280,
                "height": 1440,
                "aspectRatio": "8:9",
                "theme": "Power Grid & Magnetic Accelerator"
            },
            "round2": {
                "file": "assets/reactor/round2_bg.jpg",
                "width": 1280,
                "height": 1440,
                "aspectRatio": "8:9",
                "theme": "Duo Arc Capacitor & Circuit Terminal"
            },
            "round3": {
                "file": "assets/reactor/round3_bg.jpg",
                "width": 1280,
                "height": 1440,
                "aspectRatio": "8:9",
                "theme": "Cryo Sub-Zero Reactor Core"
            },
            "victory": {
                "file": "assets/reactor/victory_bg.jpg",
                "width": 1280,
                "height": 1440,
                "aspectRatio": "8:9",
                "theme": "STEM Fair 2026 Champion Victory Stage"
            }
        },
        "spriteSheets": {
            "kartCyan": {
                "file": "assets/reactor/sheet_kart_cyan.png",
                "sheetWidth": 640,
                "sheetHeight": 160,
                "frameWidth": 160,
                "frameHeight": 160,
                "totalFrames": 4,
                "fps": 8,
                "animations": {
                    "idle": [0],
                    "drive": [0, 1, 2, 3],
                    "boost": [2, 3]
                },
                "framesDescription": [
                    "Frame 0: Xe idle nhịp nhàng, đèn LED sáng dịu",
                    "Frame 1: Bánh xe xoay phát sáng hồ quang, thân xe nhún nhẹ",
                    "Frame 2: Ăng-ten và ống hút rung lắc cơ khí, đèn pha lóe sáng",
                    "Frame 3: Luồng phản lực phía sau bốc nhẹ, lốp xe hoàn tất 1 vòng quay"
                ]
            },
            "kartPink": {
                "file": "assets/reactor/sheet_kart_pink.png",
                "sheetWidth": 640,
                "sheetHeight": 160,
                "frameWidth": 160,
                "frameHeight": 160,
                "totalFrames": 4,
                "fps": 8,
                "animations": {
                    "idle": [0],
                    "drive": [0, 1, 2, 3],
                    "boost": [2, 3]
                },
                "framesDescription": [
                    "Frame 0: Xe idle nhịp nhàng, đèn LED sáng dịu",
                    "Frame 1: Bánh xe xoay phát sáng hồ quang, thân xe nhún nhẹ",
                    "Frame 2: Ăng-ten và ống hút rung lắc cơ khí, đèn pha lóe sáng",
                    "Frame 3: Luồng phản lực phía sau bốc nhẹ, lốp xe hoàn tất 1 vòng quay"
                ]
            },
            "circuitCyan": {
                "file": "assets/reactor/sheet_circuit_cyan.png",
                "sheetWidth": 640,
                "sheetHeight": 160,
                "frameWidth": 160,
                "frameHeight": 160,
                "totalFrames": 4,
                "fps": 8,
                "animations": {
                    "standby": [0],
                    "clampAction": [0, 1, 2, 3]
                },
                "framesDescription": [
                    "Frame 0: Gập tay cơ khí, trạng thái chờ",
                    "Frame 1: Vươn kẹp phóng tia lửa nhỏ",
                    "Frame 2: Kẹp chặt chốt điện hồ quang cực mạnh",
                    "Frame 3: Dòng điện chạy qua thân rô-bốt, giật lùi cơ học"
                ]
            },
            "circuitPink": {
                "file": "assets/reactor/sheet_circuit_pink.png",
                "sheetWidth": 640,
                "sheetHeight": 160,
                "frameWidth": 160,
                "frameHeight": 160,
                "totalFrames": 4,
                "fps": 8,
                "animations": {
                    "standby": [0],
                    "clampAction": [0, 1, 2, 3]
                },
                "framesDescription": [
                    "Frame 0: Gập tay cơ khí, trạng thái chờ",
                    "Frame 1: Vươn kẹp phóng tia lửa nhỏ",
                    "Frame 2: Kẹp chặt chốt điện hồ quang cực mạnh",
                    "Frame 3: Dòng điện chạy qua thân rô-bốt, giật lùi cơ học"
                ]
            },
            "cryoCyan": {
                "file": "assets/reactor/sheet_cryo_cyan.png",
                "sheetWidth": 640,
                "sheetHeight": 160,
                "frameWidth": 160,
                "frameHeight": 160,
                "totalFrames": 4,
                "fps": 8,
                "animations": {
                    "idle": [0],
                    "frostBlast": [0, 1, 2, 3]
                },
                "framesDescription": [
                    "Frame 0: Nạp khí lạnh, khoang làm mát phát sáng",
                    "Frame 1: Nòng súng lùi giật mở van, phóng tia sương băng",
                    "Frame 2: Sóng băng tuyết -196°C bùng nổ cực mạnh",
                    "Frame 3: Xả hơi sương mù, nòng súng trở về vị trí"
                ]
            },
            "cryoPink": {
                "file": "assets/reactor/sheet_cryo_pink.png",
                "sheetWidth": 640,
                "sheetHeight": 160,
                "frameWidth": 160,
                "frameHeight": 160,
                "totalFrames": 4,
                "fps": 8,
                "animations": {
                    "idle": [0],
                    "frostBlast": [0, 1, 2, 3]
                },
                "framesDescription": [
                    "Frame 0: Nạp khí lạnh, khoang làm mát phát sáng",
                    "Frame 1: Nòng súng lùi giật mở van, phóng tia sương băng",
                    "Frame 2: Sóng băng tuyết -196°C bùng nổ cực mạnh",
                    "Frame 3: Xả hơi sương mù, nòng súng trở về vị trí"
                ]
            },
            "energyOrb": {
                "file": "assets/reactor/sheet_energy_orb.png",
                "sheetWidth": 384,
                "sheetHeight": 64,
                "frameWidth": 64,
                "frameHeight": 64,
                "totalFrames": 6,
                "fps": 12,
                "animations": {
                    "spin": [0, 1, 2, 3, 4, 5]
                },
                "framesDescription": [
                    "Frame 0: Vành đai 0°, lõi plasma 1.0",
                    "Frame 1: Vành đai xoay +30°, electron di chuyển",
                    "Frame 2: Vành đai xoay +60°, góc nhìn 3D chiều sâu",
                    "Frame 3: Vành đai xoay +90°, góc nghiêng đối cực",
                    "Frame 4: Vành đai xoay +120°, electron qua mặt sau",
                    "Frame 5: Vành đai xoay +150°, hoàn tất chu kỳ 180° đối xứng"
                ]
            },
            "champTrophy": {
                "file": "assets/reactor/sheet_champ_trophy.png",
                "sheetWidth": 512,
                "sheetHeight": 128,
                "frameWidth": 128,
                "frameHeight": 128,
                "totalFrames": 4,
                "fps": 6,
                "animations": {
                    "shimmer": [0, 1, 2, 3]
                },
                "framesDescription": [
                    "Frame 0: Cúp vàng hoàng kim, ánh kim tĩnh và vệt phản quang",
                    "Frame 1: Ngôi sao 4 cánh lấp lánh ở quai cúp bên trái",
                    "Frame 2: Ngôi sao lấp lánh lóe sáng ở đỉnh cúp / biểu tượng STEM",
                    "Frame 3: Ngôi sao lấp lánh lóe sáng ở quai cúp bên phải & bệ cúp"
                ]
            }
        },
        "hudAssets": {
            "roundBadge": "assets/reactor/hud_round_badge.png",
            "timerCapsule": "assets/reactor/hud_timer_capsule.png",
            "scorePill": "assets/reactor/hud_score_pill.png",
            "comboMultiplier": "assets/reactor/hud_combo_multiplier.png"
        }
    }

    for folder in TARGET_FOLDERS:
        json_path = os.path.join(folder, 'spritesheets_metadata.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        print(f"  ✓ Saved metadata to: {json_path}")

# ---------------------------------------------------------------------------
# Main Execution Pipeline
# ---------------------------------------------------------------------------
def main():
    print("=" * 76)
    print("  FU-DEVER 3D GAME ART & MULTI-FRAME SPRITESHEET CRAFTSMAN PIPELINE")
    print("=" * 76)

    generate_background_plates()
    generate_kart_spritesheets()
    generate_circuit_spritesheets()
    generate_cryo_spritesheets()
    generate_energy_orb_spritesheet()
    generate_trophy_spritesheet()
    generate_hud_ui_assets()
    generate_metadata_json()

    print("\n" + "=" * 76)
    print("  ALL ASSETS SUCCESSFULLY GENERATED & DEPLOYED (ZERO AI SLOP)!")
    print("=" * 76)

if __name__ == '__main__':
    main()
