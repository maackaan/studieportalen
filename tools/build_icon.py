"""Build a Windows ICO using the same shapes as the app's SVG icon."""
from pathlib import Path
from PIL import Image, ImageDraw

image = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, 511, 511), radius=116, fill='#0b1020')
draw.rounded_rectangle((70, 70, 442, 442), radius=92, fill='#6857e8')
draw.polygon([(100, 206), (256, 122), (412, 206), (256, 290)], fill='white')
draw.polygon([(158, 256), (256, 309), (354, 256), (354, 350), (305, 379), (207, 379), (158, 350)], fill='white')
draw.line([(402, 217), (402, 313)], fill='white', width=20)
draw.ellipse((385, 320, 419, 354), fill='white')
destination = Path(__file__).resolve().parents[1] / 'build' / 'icon.ico'
destination.parent.mkdir(exist_ok=True)
image.save(destination, sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
