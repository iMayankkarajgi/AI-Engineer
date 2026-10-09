# Draws the logo mark as PNG icons and the 1200x630 link-preview image.
# Run from the project root: python scripts/make-icons.py
from PIL import Image, ImageDraw, ImageFont
import os

FONTS = r"C:\Windows\Fonts"
def font(name, size):
    for n in (name, "segoeui.ttf", "arial.ttf"):
        try: return ImageFont.truetype(os.path.join(FONTS, n), size)
        except OSError: pass

VIOLET, INKDARK = (183, 156, 255), (12, 10, 23)          # the Sign In button colours (dark theme)
BG, INK, MUTED = (12, 10, 23), (244, 241, 255), (170, 163, 200)

def tile(size, full_bleed=False):
    S = size * 4; k = S / 64
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=0 if full_bleed else int(15 * k), fill=VIOLET)
    P = [(x * k, y * k) for x, y in ((14, 49), (14, 22), (32, 44), (50, 22), (50, 49))]; w = int(5.5 * k)
    d.line(P, fill=INKDARK, width=w, joint="curve")
    for p in (P[0], P[-1]): d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=INKDARK)
    for x, y in ((14, 22), (50, 22), (32, 44)): d.ellipse([(x - 4.6) * k, (y - 4.6) * k, (x + 4.6) * k, (y + 4.6) * k], fill=INKDARK)
    star = [(32, 7), (34.6, 16.4), (44, 19), (34.6, 21.6), (32, 31), (29.4, 21.6), (20, 19), (29.4, 16.4)]
    d.polygon([(x * k, y * k) for x, y in star], fill=INKDARK)
    return im.resize((size, size), Image.LANCZOS)

for size, name, bleed in ((48, "favicon-48.png", False), (180, "apple-touch-icon.png", True), (192, "icon-192.png", False), (512, "icon-512.png", False), (1024, "logo-1024.png", False)):
    tile(size, bleed).save("public/" + name)

W, H, S = 1200, 630, 2
im = Image.new("RGB", (W * S, H * S), BG); g = ImageDraw.Draw(im)
for i in range(60):
    r = (700 - i * 10) * S; c = tuple(int(BG[k] + (VIOLET[k] - BG[k]) * 0.0045 * i) for k in range(3))
    g.ellipse([W * S * 0.86 - r, H * S * 0.2 - r, W * S * 0.86 + r, H * S * 0.2 + r], fill=c)
im = im.convert("RGBA"); x = 80 * S
im.alpha_composite(tile(56 * S), (x, 68 * S))
d = ImageDraw.Draw(im)
d.text((x + 76 * S, 96 * S), "Modern AI Engineering", font=font("seguisb.ttf", 34 * S), fill=INK, anchor="lm")
d.text((x, 205 * S), "AI ENGINEERING BOOTCAMP", font=font("seguisb.ttf", 24 * S), fill=VIOLET)
d.text((x, 250 * S), "ML, deep learning", font=font("segoeuib.ttf", 76 * S), fill=INK)
d.text((x, 340 * S), "and generative AI.", font=font("segoeuib.ttf", 76 * S), fill=MUTED)
d.text((x, 470 * S), "149 video lessons  ·  19 modules  ·  3 tracks  ·  hands-on labs", font=font("segoeui.ttf", 28 * S), fill=MUTED)
d.text((x, 540 * S), "modernaiengineering.com", font=font("seguisb.ttf", 26 * S), fill=INK)
out = im.convert("RGB").resize((W, H), Image.LANCZOS)
out.save("public/og-v4.png", optimize=True); out.save("public/og.png", optimize=True)
print("icons and link-preview image written")
