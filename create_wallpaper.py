"""Render the original, seamless topology wallpaper.

Optional generator only; the finished website needs no Python packages.
Install numpy, opencv-python-headless, Pillow, and imageio-ffmpeg to regenerate.
"""
from pathlib import Path
import math
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'
ASSETS.mkdir(exist_ok=True)
WIDTH, HEIGHT, FPS, SECONDS = 1280, 720, 24, 12
TAU = math.tau

# A luminous, finely woven trefoil tube: mathematical art, not a stock clip.
t = np.linspace(0, TAU, 280, endpoint=False)
centerline = np.stack([(2 + np.cos(3 * t)) * np.cos(2 * t),
                       (2 + np.cos(3 * t)) * np.sin(2 * t),
                       np.sin(3 * t)], axis=-1)
tangent = np.roll(centerline, -1, axis=0) - np.roll(centerline, 1, axis=0)
tangent /= np.linalg.norm(tangent, axis=1)[:, None]
normal = np.cross(tangent, np.array([0, 0, 1]))
normal /= np.linalg.norm(normal, axis=1)[:, None]
binormal = np.cross(tangent, normal)
angle = np.linspace(0, TAU, 28, endpoint=False)
mesh = centerline[:, None, :] + .34 * (
    normal[:, None, :] * np.cos(angle)[None, :, None] +
    binormal[:, None, :] * np.sin(angle)[None, :, None])

Y, X = np.mgrid[0:HEIGHT, 0:WIDTH].astype(np.float32)
halo = np.exp(-(((X - WIDTH * .76) / 480) ** 2 + ((Y - HEIGHT * .44) / 380) ** 2))
base = np.stack([8 + 9 * halo, 22 + 18 * halo, 15 + 9 * halo], axis=-1).astype(np.uint8)
for gx in range(0, WIDTH, 48):
    cv2.line(base, (gx, 0), (gx, HEIGHT), (15, 30, 21), 1, cv2.LINE_AA)
for gy in range(0, HEIGHT, 48):
    cv2.line(base, (0, gy), (WIDTH, gy), (15, 30, 21), 1, cv2.LINE_AA)
# Grid disappears gently into the dark, leaving room for readable copy.
mask = np.clip((X - 380) / 550, 0, .55)
background = np.stack([8 + 9 * halo, 22 + 18 * halo, 15 + 9 * halo], axis=-1)
base = (base * mask[:, :, None] + background * (1 - mask[:, :, None])).astype(np.uint8)

rng = np.random.default_rng(24)
particle_phase = rng.uniform(0, TAU, 42)
particle_radius = rng.uniform(140, 330, 42)
particle_y_scale = rng.uniform(.7, 1.05, 42)


def rotation(x, y, z):
    cx, sx, cy, sy, cz, sz = math.cos(x), math.sin(x), math.cos(y), math.sin(y), math.cos(z), math.sin(z)
    rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return rz @ ry @ rx


def frame_at(fraction):
    phase = fraction * TAU
    layer = np.zeros((HEIGHT, WIDTH, 3), np.uint8)
    rot = rotation(.93 + .13 * math.sin(phase), .30 + .20 * math.cos(phase), -.43 + .14 * math.sin(phase))
    points3 = mesh @ rot.T
    perspective = 9.5 / (9.5 - points3[:, :, 2])
    px = points3[:, :, 0] * perspective * 83 + WIDTH * .745 + 8 * math.sin(phase)
    py = points3[:, :, 1] * perspective * 83 + HEIGHT * .44 + 6 * math.cos(phase)
    points2 = np.stack([px, py], axis=-1).astype(np.int32)

    # The depth-ordered strokes and soft bloom give the mesh a three-dimensional finish.
    paths = []
    for j in range(len(angle)):
        paths.append((float(points3[:, j, 2].mean()), points2[:, j], .55))
    for i in range(0, len(t), 4):
        paths.append((float(points3[i, :, 2].mean()), points2[i], 1.0))
    for depth, path, weight in sorted(paths, key=lambda p: p[0]):
        intensity = np.clip(.34 + (depth + 2.2) / 5.8, .23, 1.0) * weight
        color = tuple(int(c * intensity) for c in (198, 234, 130))
        cv2.polylines(layer, [np.ascontiguousarray(path)], True, color, 1, cv2.LINE_AA)

    # A few moving satellites and contour lines, kept quiet enough for a portfolio.
    for i in range(42):
        a = particle_phase[i] + phase * (-1 if i % 2 else 1)
        x = int(WIDTH * .745 + particle_radius[i] * math.cos(a))
        y = int(HEIGHT * .44 + particle_radius[i] * particle_y_scale[i] * math.sin(a))
        pulse = .35 + .18 * (1 + math.sin(phase + particle_phase[i]))
        color = tuple(int(c * pulse) for c in (135, 178, 91))
        cv2.circle(layer, (x, y), 1 if i % 6 else 2, color, -1, cv2.LINE_AA)
    for i in range(9):
        xs = np.linspace(-30, WIDTH + 30, 170)
        ys = HEIGHT * .90 + i * 13 + 26 * np.sin(xs / 150 + phase + i * .13) - xs * .08
        path = np.stack([xs, ys], axis=-1).astype(np.int32)
        cv2.polylines(layer, [path], False, (12, 33 + i * 2, 19), 1, cv2.LINE_AA)

    small = cv2.resize(layer, (WIDTH // 2, HEIGHT // 2), interpolation=cv2.INTER_AREA)
    bloom = cv2.resize(cv2.GaussianBlur(small, (0, 0), 3.2), (WIDTH, HEIGHT))
    glow = cv2.resize(cv2.GaussianBlur(small, (0, 0), 9), (WIDTH, HEIGHT))
    image = cv2.addWeighted(base, 1, layer, .98, 0)
    image = cv2.addWeighted(image, 1, bloom, .88, 0)
    image = cv2.addWeighted(image, 1, glow, .9, 0)
    return image


poster = frame_at(0)
Image.fromarray(poster).save(ASSETS / 'topology-poster.webp', quality=90, method=6)
writer = imageio_ffmpeg.write_frames(
    str(ASSETS / 'topology-wallpaper.mp4'), (WIDTH, HEIGHT), fps=FPS,
    codec='libx264', pix_fmt_in='rgb24', pix_fmt_out='yuv420p',
    macro_block_size=16, ffmpeg_log_level='error',
    output_params=['-vf', 'scale=960:540:flags=lanczos', '-crf', '26', '-preset', 'medium', '-movflags', '+faststart', '-an'])
writer.send(None)
for frame in range(FPS * SECONDS):
    writer.send(frame_at(frame / (FPS * SECONDS)))
    if frame % FPS == 0:
        print(f'Rendered {frame // FPS}/{SECONDS} seconds', flush=True)
writer.close()

subprocess.run([
    imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-hide_banner', '-loglevel', 'error',
    '-i', str(ASSETS / 'topology-wallpaper.mp4'), '-an', '-c:v', 'libvpx-vp9',
    '-b:v', '0', '-crf', '37', '-deadline', 'good', '-cpu-used', '4',
    str(ASSETS / 'topology-wallpaper.webm')], check=True)
for path in ASSETS.glob('topology-*'):
    print(f'{path.name}: {path.stat().st_size:,} bytes')
