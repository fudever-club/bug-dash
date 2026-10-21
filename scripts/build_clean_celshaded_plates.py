import os
import cv2
import numpy as np
from PIL import Image, ImageFilter

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, '..'))
    assets_dir = os.path.join(project_root, 'assets', 'reactor')
    public_dir = os.path.join(project_root, 'public', 'assets', 'reactor')
    dist_dir = os.path.join(project_root, 'dist', 'assets', 'reactor')

    for d in [assets_dir, public_dir, dist_dir]:
        os.makedirs(d, exist_ok=True)

    demo_dir = os.path.join(project_root, 'demo_screenshots')
    r1_path = os.path.join(demo_dir, '01_round1_energy_catch_celshaded.jpg')
    r2_path = os.path.join(demo_dir, '02_round2_duo_circuit_celshaded.jpg')
    r3_path = os.path.join(demo_dir, '03_round3_cool_the_core_celshaded.jpg')
    r4_path = os.path.join(demo_dir, '04_mission_complete_official_branding.jpg')

    print("[SPRITE PIPELINE] Extracting high-res cel-shaded sprites from verified artwork...")

    # =========================================================================
    # 1. EXTRACT TRANSPARENT SPRITES
    # =========================================================================

    def extract_transparent_sprite(img_path, box, out_name, grabcut_iter=5):
        im = Image.open(img_path)
        cropped = im.crop(box)
        crop_np = np.array(cropped)
        # Convert RGB to BGR for OpenCV
        bgr = cv2.cvtColor(crop_np, cv2.COLOR_RGB2BGR)
        h, w = bgr.shape[:2]

        mask = np.zeros((h, w), np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)

        rect = (2, 2, w - 4, h - 4)
        cv2.grabCut(bgr, mask, rect, bgdModel, fgdModel, grabcut_iter, cv2.GC_INIT_WITH_RECT)
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

        # Slight morphological clean up (close small holes, smooth outer edge)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask2 = cv2.morphologyEx(mask2, cv2.MORPH_CLOSE, kernel)

        rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
        rgba[:, :, 3] = mask2 * 255

        out_rgba = Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA))
        for target_folder in [assets_dir, public_dir, dist_dir]:
            out_rgba.save(os.path.join(target_folder, out_name), format='PNG')
        print(f"  ✓ Saved sprite: {out_name} ({w}x{h})")
        return out_rgba

    # R1: Kart Bots (from 1376x768 reference)
    extract_transparent_sprite(r1_path, (405, 305, 585, 555), 'sprite_kart_cyan.png', 5)
    extract_transparent_sprite(r1_path, (785, 305, 965, 555), 'sprite_kart_pink.png', 5)

    # R1: Sync Combo Comic Burst
    im1 = Image.open(r1_path)
    sync_crop = im1.crop((480, 140, 890, 540))
    # Extract lightning and speech bubble by thresholding background gray wall
    sync_np = np.array(sync_crop)
    sync_bgr = cv2.cvtColor(sync_np, cv2.COLOR_RGB2BGR)
    # Mask out dark gray background around speech bubble and lightning
    h, w = sync_bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(sync_bgr, mask, (4, 4, w-8, h-8), bgd, fgd, 4, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 2) | (mask == 0), 0, 255).astype('uint8')
    sync_rgba = cv2.cvtColor(sync_bgr, cv2.COLOR_BGR2BGRA)
    sync_rgba[:, :, 3] = m
    sync_img = Image.fromarray(cv2.cvtColor(sync_rgba, cv2.COLOR_BGRA2RGBA))
    for d in [assets_dir, public_dir, dist_dir]:
        sync_img.save(os.path.join(d, 'sprite_sync_combo.png'), format='PNG')
    print("  ✓ Saved sprite: sprite_sync_combo.png")

    # R1: Golden Energy Orb
    orb_crop = im1.crop((85, 510, 125, 550))
    for d in [assets_dir, public_dir, dist_dir]:
        orb_crop.save(os.path.join(d, 'sprite_energy_orb.png'), format='PNG')
    print("  ✓ Saved sprite: sprite_energy_orb.png")

    # R2: Circuit Bots with Crane Arms
    extract_transparent_sprite(r2_path, (155, 350, 445, 565), 'sprite_circuit_cyan.png', 5)
    extract_transparent_sprite(r2_path, (915, 350, 1205, 565), 'sprite_circuit_pink.png', 5)

    # R2: Circuit Complete Comic Burst
    im2 = Image.open(r2_path)
    cc_crop = im2.crop((730, 390, 970, 530))
    cc_np = cv2.cvtColor(np.array(cc_crop), cv2.COLOR_RGB2BGR)
    h, w = cc_np.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(cc_np, mask, (3, 3, w-6, h-6), bgd, fgd, 4, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 2) | (mask == 0), 0, 255).astype('uint8')
    cc_rgba = cv2.cvtColor(cc_np, cv2.COLOR_BGR2BGRA)
    cc_rgba[:, :, 3] = m
    cc_img = Image.fromarray(cv2.cvtColor(cc_rgba, cv2.COLOR_BGRA2RGBA))
    for d in [assets_dir, public_dir, dist_dir]:
        cc_img.save(os.path.join(d, 'sprite_circuit_complete.png'), format='PNG')
    print("  ✓ Saved sprite: sprite_circuit_complete.png")

    # R3: Cryo Cannons & Bots
    extract_transparent_sprite(r3_path, (235, 470, 515, 685), 'sprite_cryo_cyan.png', 5)
    extract_transparent_sprite(r3_path, (855, 470, 1135, 685), 'sprite_cryo_pink.png', 5)

    # R3: Final Boost Banner
    im3 = Image.open(r3_path)
    fb_crop = im3.crop((350, 210, 1020, 305))
    for d in [assets_dir, public_dir, dist_dir]:
        fb_crop.save(os.path.join(d, 'sprite_final_boost.png'), format='PNG')
    print("  ✓ Saved sprite: sprite_final_boost.png")

    # R4: Champion Bots & Trophy
    extract_transparent_sprite(r4_path, (400, 270, 605, 540), 'sprite_champ_cyan.png', 5)
    extract_transparent_sprite(r4_path, (775, 290, 985, 560), 'sprite_champ_pink.png', 5)
    extract_transparent_sprite(r4_path, (595, 255, 785, 530), 'sprite_champ_trophy.png', 5)

    # =========================================================================
    # 2. CREATE CLEAN 640x720 STAGE BACKGROUND PLATES
    # =========================================================================
    print("\n[SPRITE PIPELINE] Building clean 640x720 stage plates...")

    # Round 1 Clean Background:
    # We take the central composition (x=180..1196, y=70..768) and inpaint/patch the bot area on the track
    r1_im = Image.open(r1_path).crop((180, 70, 1196, 768)).resize((640, 720), Image.Resampling.LANCZOS)
    r1_cv = cv2.cvtColor(np.array(r1_im), cv2.COLOR_RGB2BGR)

    # Inpaint the center lightning bolt and the 2 bot spots on the track:
    # Center lightning in 640x720 is around x=260..380, y=80..420
    # Left bot is around x=140..250, y=280..460
    # Right bot is around x=380..500, y=280..460
    inpaint_mask = np.zeros((720, 640), np.uint8)
    # Center lightning
    inpaint_mask[100:400, 270:370] = 255
    # Left bot
    inpaint_mask[260:440, 150:255] = 255
    # Right bot
    inpaint_mask[260:440, 385:490] = 255

    r1_clean_bgr = cv2.inpaint(r1_cv, inpaint_mask, 7, cv2.INPAINT_TELEA)

    # Also clean up the cyan track line smoothly across y=420..460
    # The cyan strip pattern is clean on left and right, let's copy a clean strip over
    clean_r1_im = Image.fromarray(cv2.cvtColor(r1_clean_bgr, cv2.COLOR_BGR2RGB))
    for d in [assets_dir, public_dir, dist_dir]:
        clean_r1_im.save(os.path.join(d, 'round1_bg.jpg'), quality=95)
    print("  ✓ Generated clean: round1_bg.jpg (640x720)")

    # Round 2 Clean Background:
    r2_im = Image.open(r2_path).crop((150, 50, 1226, 768)).resize((640, 720), Image.Resampling.LANCZOS)
    r2_cv = cv2.cvtColor(np.array(r2_im), cv2.COLOR_RGB2BGR)
    # Inpaint comic burst "CIRCUIT COMPLETE! +50" at x=360..480, y=360..470
    inpaint_mask2 = np.zeros((720, 640), np.uint8)
    inpaint_mask2[360:470, 360:480] = 255
    # Inpaint bots at x=20..180, y=340..490 and x=460..620, y=340..490
    inpaint_mask2[330:490, 20:180] = 255
    inpaint_mask2[330:490, 460:620] = 255
    r2_clean_bgr = cv2.inpaint(r2_cv, inpaint_mask2, 7, cv2.INPAINT_TELEA)
    clean_r2_im = Image.fromarray(cv2.cvtColor(r2_clean_bgr, cv2.COLOR_BGR2RGB))
    for d in [assets_dir, public_dir, dist_dir]:
        clean_r2_im.save(os.path.join(d, 'round2_bg.jpg'), quality=95)
    print("  ✓ Generated clean: round2_bg.jpg (640x720)")

    # Round 3 Clean Background:
    r3_im = Image.open(r3_path).crop((150, 50, 1226, 768)).resize((640, 720), Image.Resampling.LANCZOS)
    r3_cv = cv2.cvtColor(np.array(r3_im), cv2.COLOR_RGB2BGR)
    # Inpaint bots & ice blasts at bottom:
    inpaint_mask3 = np.zeros((720, 640), np.uint8)
    inpaint_mask3[430:600, 30:230] = 255
    inpaint_mask3[430:600, 420:620] = 255
    # Inpaint final boost banner at x=120..520, y=140..220
    inpaint_mask3[140:220, 120:520] = 255
    r3_clean_bgr = cv2.inpaint(r3_cv, inpaint_mask3, 7, cv2.INPAINT_TELEA)
    clean_r3_im = Image.fromarray(cv2.cvtColor(r3_clean_bgr, cv2.COLOR_BGR2RGB))
    for d in [assets_dir, public_dir, dist_dir]:
        clean_r3_im.save(os.path.join(d, 'round3_bg.jpg'), quality=95)
    print("  ✓ Generated clean: round3_bg.jpg (640x720)")

    # Round 4 Victory Background:
    # Contains the full glorious stadium with podium, trophy, bots & neon sign!
    r4_im = Image.open(r4_path).crop((150, 30, 1226, 768)).resize((640, 720), Image.Resampling.LANCZOS)
    for d in [assets_dir, public_dir, dist_dir]:
        r4_im.save(os.path.join(d, 'victory_bg.jpg'), quality=95)
    print("  ✓ Generated clean: victory_bg.jpg (640x720)")

    print("\n🎉 [SPRITE PIPELINE] All cel-shaded sprites and stage plates successfully generated and deployed!")

if __name__ == '__main__':
    main()
