#!/usr/bin/env python3
"""
Generate high-resolution Notepad App Icons (PNG + multi-res ICO)
Creates a distinctive, modern Notepad icon with folded corner, pencil, and lined paper accents.
"""

import os
from PIL import Image, ImageDraw

def create_notepad_icon():
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base Slate/Navy Rounded Background Shield
    # Draw soft shadow
    shadow_offset = 12
    draw.rounded_rectangle(
        [32 + shadow_offset, 32 + shadow_offset, 480 + shadow_offset, 480 + shadow_offset],
        radius=96,
        fill=(0, 0, 0, 80)
    )

    # Gradient background card (Modern Deep Indigo/Blue #1e293b -> #0f172a)
    draw.rounded_rectangle(
        [32, 32, 480, 480],
        radius=96,
        fill=(24, 28, 40, 255),
        outline=(59, 130, 246, 180),
        width=6
    )

    # 2. Notepad Paper (Crisp White / Light Cream Sheet)
    # Sheet coordinates
    px0, py0, px1, py1 = 110, 95, 402, 417
    # Paper shadow
    draw.rounded_rectangle([px0 + 6, py0 + 8, px1 + 6, py1 + 8], radius=24, fill=(0, 0, 0, 100))
    # Paper body
    draw.rounded_rectangle([px0, py0, px1, py1], radius=24, fill=(248, 250, 252, 255))

    # Folded top-right corner effect
    fold_size = 56
    draw.polygon([
        (px1 - fold_size, py0),
        (px1, py0 + fold_size),
        (px1 - fold_size, py0 + fold_size)
    ], fill=(203, 213, 225, 255))
    draw.polygon([
        (px1 - fold_size, py0),
        (px1, py0 + fold_size),
        (px1, py0)
    ], fill=(24, 28, 40, 255))

    # 3. Notepad Header Banner (Vibrant Royal Blue / Cyan)
    draw.rounded_rectangle(
        [px0, py0, px1 - fold_size, py0 + 44],
        radius=12,
        fill=(37, 99, 235, 255)
    )

    # 4. Lined Paper Rows (Horizontal guide lines)
    line_y_starts = [185, 235, 285, 335, 385]
    for idx, ly in enumerate(line_y_starts):
        lw = 320 if idx < 3 else (220 if idx == 3 else 160)
        # Subtle ruled line
        draw.rounded_rectangle(
            [px0 + 32, ly, px0 + 32 + lw, ly + 6],
            radius=3,
            fill=(148, 163, 184, 200) if idx != 0 else (59, 130, 246, 255)
        )

    # Margin Line (Vertical red/coral rule)
    draw.line([(px0 + 60, py0 + 55), (px0 + 60, py1 - 20)], fill=(244, 63, 94, 180), width=3)

    # 5. Stylized Stylus / Pencil (Golden Yellow with Blue Tip)
    # Pencil body diagonal
    draw.polygon([
        (310, 390),
        (435, 265),
        (460, 290),
        (335, 415)
    ], fill=(245, 158, 11, 255))

    # Pencil tip
    draw.polygon([
        (290, 420),
        (310, 390),
        (335, 415)
    ], fill=(254, 243, 199, 255))

    # Graphite point
    draw.polygon([
        (290, 420),
        (298, 408),
        (308, 418)
    ], fill=(30, 41, 59, 255))

    # Pencil eraser cap
    draw.polygon([
        (435, 265),
        (460, 290),
        (475, 275),
        (450, 250)
    ], fill=(239, 68, 68, 255))

    # 6. Save images
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)

    win_ico = os.path.join(root_dir, "Windows", "icon.ico")
    win_png = os.path.join(root_dir, "Windows", "icon.png")
    linux_png = os.path.join(root_dir, "Linux", "icon.png")
    app_png = os.path.join(root_dir, "app", "src", "icons", "icon.png")

    # High-Res PNG
    img.save(win_png, "PNG")
    img.save(linux_png, "PNG")
    img.save(app_png, "PNG")
    print(f"Saved high-res PNG icons: {win_png}")

    # Multi-resolution ICO (256, 128, 64, 48, 32, 16)
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(win_ico, format="ICO", sizes=icon_sizes)
    print(f"Saved multi-resolution Notepad App ICO: {win_ico}")

if __name__ == "__main__":
    create_notepad_icon()
