from PIL import Image
import collections

def get_dominant_color(image_path):
    img = Image.open(image_path)
    img = img.resize((1, 1))
    color = img.getpixel((0, 0))
    return '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])

print(get_dominant_color(r"C:\Users\HP\.gemini\antigravity\brain\29592861-85ef-43ba-ba56-e49fad4ca386\media__1776015824510.png"))
