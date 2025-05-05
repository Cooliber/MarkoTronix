const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate a simple placeholder icon for each size
// In a real project, you would use your actual logo/icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0080ff';
  ctx.fillRect(0, 0, size, size);

  // Text
  const fontSize = Math.floor(size / 4);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HVAC', size / 2, size / 2 - fontSize / 2);
  ctx.fillText('CRM', size / 2, size / 2 + fontSize / 2);

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
  console.log(`Generated icon-${size}x${size}.png`);
}

// Generate logo for offline page
function generateLogo() {
  const size = 200;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0080ff';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HVAC', size / 2, size / 2 - 20);
  ctx.fillText('CRM', size / 2, size / 2 + 20);

  // Save the logo
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, '../public/logo.png'), buffer);
  console.log('Generated logo.png');
}

// Generate all icons
sizes.forEach(generateIcon);
generateLogo();

console.log('Icon generation complete!');