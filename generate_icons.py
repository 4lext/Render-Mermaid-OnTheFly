#!/usr/bin/env python3
"""
Generate simple icons for the Chrome extension
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("PIL not available, creating SVG icons instead")
    import os

    # Create SVG icons that Chrome can use
    sizes = [16, 48, 128]

    for size in sizes:
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{size//8}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="{size//2}"
        fill="white" text-anchor="middle" dominant-baseline="central" font-weight="bold">M</text>
</svg>'''

        with open(f'icons/icon{size}.svg', 'w') as f:
            f.write(svg_content)

        print(f"Created icons/icon{size}.svg")

    exit(0)

# If PIL is available, create PNG icons
def create_icon(size, output_path):
    """Create a simple icon with a gradient background and 'M' letter"""
    # Create image with gradient
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)

    # Draw gradient background (simplified - just use solid color)
    for y in range(size):
        # Gradient from purple to blue
        r = int(102 + (118 - 102) * (y / size))
        g = int(126 + (75 - 126) * (y / size))
        b = int(234 + (162 - 234) * (y / size))
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    # Draw 'M' letter
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size // 2)
    except:
        font = ImageFont.load_default()

    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]

    draw.text((x, y), text, fill='white', font=font)

    # Save
    img.save(output_path, 'PNG')
    print(f"Created {output_path}")

# Generate icons in different sizes
sizes = [16, 48, 128]
for size in sizes:
    create_icon(size, f'icons/icon{size}.png')

print("\nAll icons created successfully!")
