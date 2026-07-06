#!/usr/bin/env python3
"""Generate Apple-style polished Play Store screenshots + feature graphic for Crunchii (local)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(ROOT, "android-screenshots")
OUT_DIR = os.path.join(ROOT, "playstore_assets", "screenshots")
ICON = os.path.join(ROOT, "playstore_assets", "icon_512_alpha.png")
FONT_BOLD = os.path.join(ROOT, "assets", "fonts", "brandon-bold.otf")
FONT_REG = os.path.join(ROOT, "assets", "fonts", "brandon-regular.otf")
os.makedirs(OUT_DIR, exist_ok=True)

RED = (221, 74, 70)
RED_DARK = (179, 52, 49)
WHITE = (255, 255, 255)

W, H = 1080, 1920  # Play Store phone screenshot (9:16)

def font(path, size):
    return ImageFont.truetype(path, size)

def red_background(w, h):
    """Vertical red gradient with subtle decorative rings."""
    bg = Image.new("RGB", (w, h), RED)
    top = Image.new("RGB", (w, h), RED)
    bot = Image.new("RGB", (w, h), RED_DARK)
    mask = Image.new("L", (w, h))
    md = mask.load()
    for y in range(h):
        v = int(255 * (y / h) ** 1.3)
        for x in range(w):
            md[x, y] = v
    bg = Image.composite(bot, top, mask)
    # subtle lighter rings for texture
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    rings = [(w*0.85, -h*0.05, w*0.45), (w*0.1, h*0.9, w*0.4), (w*0.95, h*0.55, w*0.3)]
    for cx, cy, r in rings:
        od.ellipse([cx-r, cy-r, cx+r, cy+r], outline=(255, 255, 255, 16), width=3)
        od.ellipse([cx-r*0.7, cy-r*0.7, cx+r*0.7, cy+r*0.7], fill=(255, 255, 255, 8))
    bg = Image.alpha_composite(bg.convert("RGBA"), overlay).convert("RGB")
    return bg

def round_corners(im, rad):
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, im.size[0]-1, im.size[1]-1], radius=rad, fill=255)
    im.putalpha(mask)
    return im

def phone_frame(screenshot_path, screen_w, top_crop=70, bottom_crop=90):
    """Crop OS chrome from a raw android screenshot and wrap it in a dark phone body."""
    shot = Image.open(screenshot_path).convert("RGB")
    sw, sh = shot.size
    shot = shot.crop((0, top_crop, sw, sh - bottom_crop))
    sw, sh = shot.size
    # scale screenshot to target screen width
    scale = screen_w / sw
    screen_h = int(sh * scale)
    shot = shot.resize((screen_w, screen_h), Image.LANCZOS)
    screen_rad = int(screen_w * 0.07)
    shot = round_corners(shot, screen_rad)
    # phone body
    bezel = int(screen_w * 0.035)
    body_w = screen_w + bezel * 2
    body_h = screen_h + bezel * 2
    body = Image.new("RGBA", (body_w, body_h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    body_rad = int(body_w * 0.11)
    bd.rounded_rectangle([0, 0, body_w-1, body_h-1], radius=body_rad, fill=(17, 17, 19, 255))
    body.alpha_composite(shot, (bezel, bezel))
    return body

def paste_with_shadow(bg, fg, x, y, blur=45, alpha=150, dy=22):
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sh_layer = Image.new("RGBA", fg.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh_layer)
    # use fg alpha as shadow silhouette
    sil = Image.new("RGBA", fg.size, (0, 0, 0, alpha))
    sil.putalpha(fg.split()[-1].point(lambda a: int(a * alpha / 255)))
    shadow.alpha_composite(sil, (x, y + dy))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    bg.alpha_composite(shadow)
    bg.alpha_composite(fg, (x, y))

def draw_centered(draw, text, cx, y, fnt, fill=WHITE, line_gap=14):
    lines = text.split("\n")
    cy = y
    for ln in lines:
        bb = draw.textbbox((0, 0), ln, font=fnt)
        tw = bb[2] - bb[0]
        th = bb[3] - bb[1]
        draw.text((cx - tw/2, cy), ln, font=fnt, fill=fill)
        cy += th + line_gap
    return cy

# ---------------- Screenshots ----------------
SCREENS = [
    ("WhatsApp Image 2026-06-10 at 4.35.25 PM.jpeg",     "Discover Hot Spots\nRight Near You"),
    ("WhatsApp Image 2026-06-10 at 4.35.23 PM.jpeg",     "Find Restaurants by\nCuisine & Distance"),
    ("WhatsApp Image 2026-06-10 at 4.35.24 PM.jpeg",     "Ratings, Reviews &\nDirections in One Tap"),
    ("WhatsApp Image 2026-06-10 at 4.35.25 PM (1).jpeg", "Explore, Save &\nShare Great Food"),
]

head_font = font(FONT_BOLD, 70)
for i, (fname, headline) in enumerate(SCREENS, 1):
    bg = red_background(W, H).convert("RGBA")
    d = ImageDraw.Draw(bg)
    # headline near top
    draw_centered(d, headline, W/2, 130, head_font, line_gap=18)
    # phone frame
    phone = phone_frame(os.path.join(RAW_DIR, fname), screen_w=620)
    px = (W - phone.size[0]) // 2
    py = 430
    paste_with_shadow(bg, phone, px, py)
    out = os.path.join(OUT_DIR, f"screenshot_{i}.png")
    bg.convert("RGB").save(out, "PNG")
    print("saved", out, bg.size)

# ---------------- Feature graphic (Crunchii) ----------------
FW, FH = 1024, 500
fg_bg = red_background(FW, FH).convert("RGBA")
d = ImageDraw.Draw(fg_bg)
# icon on a white rounded card (left)
icon = Image.open(ICON).convert("RGBA").resize((230, 230), Image.LANCZOS)
card = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
cd = ImageDraw.Draw(card)
cd.rounded_rectangle([0, 0, 299, 299], radius=62, fill=(255, 255, 255, 255))
card.alpha_composite(icon, (35, 35))
paste_with_shadow(fg_bg, card, 88, 100, blur=35, alpha=110, dy=16)
# wordmark
title_font = font(FONT_BOLD, 120)
tag_font = font(FONT_REG, 36)
d.text((468, 150), "Crunchii", font=title_font, fill=WHITE)
d.text((472, 300), "Find the best restaurants near you", font=tag_font, fill=(255, 255, 255, 235))
d.rounded_rectangle([474, 360, 584, 366], radius=3, fill=(255, 255, 255, 230))
fg_bg.convert("RGB").save(os.path.join(ROOT, "playstore_assets", "feature_graphic_1024x500.png"), "PNG")
print("saved feature graphic")
