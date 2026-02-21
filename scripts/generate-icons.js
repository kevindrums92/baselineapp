/**
 * Script to generate PNG icons from SVG sources
 * Run: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ICONS_DIR = join(rootDir, 'public', 'icons');

// Ensure icons directory exists
mkdirSync(ICONS_DIR, { recursive: true });

// Read source SVGs
const iconSvg = readFileSync(join(rootDir, 'docs', 'media', 'icons', 'icon.svg'));
const faviconSvg = readFileSync(join(rootDir, 'docs', 'media', 'icons', 'favicon.svg'));
const safariSvg = readFileSync(join(rootDir, 'docs', 'media', 'icons', 'safari-pinned-tab.svg'));

// Icon sizes to generate
const standardSizes = [16, 32, 48, 64, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512, 1024];
const maskableSizes = [192, 512];

console.log('Generando iconos PNG...\n');

// Generate standard icons from icon.svg
for (const size of standardSizes) {
  await sharp(iconSvg)
    .resize(size, size)
    .png()
    .toFile(join(ICONS_DIR, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Generate maskable icons (with safe zone for Android)
// For maskable icons, we need to add padding (safe zone)
// Android requires 40% padding = icon should be 60% of total size
for (const size of maskableSizes) {
  const iconSize = Math.round(size * 0.6); // 60% for icon
  const padding = Math.round((size - iconSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 13, g: 148, b: 136, alpha: 1 } // #0d9488
    }
  })
    .composite([
      {
        input: await sharp(iconSvg)
          .resize(iconSize, iconSize)
          .png()
          .toBuffer(),
        top: padding,
        left: padding
      }
    ])
    .png()
    .toFile(join(ICONS_DIR, `maskable-${size}.png`));
  console.log(`✓ maskable-${size}.png`);
}

// Generate favicon.ico (multi-resolution: 16x16, 32x32, 48x48)
// Note: Sharp doesn't support ICO format directly, so we'll just ensure
// the PNG favicons exist. Browsers support PNG favicons natively.
console.log('\n✓ Todos los iconos PNG generados correctamente!');
console.log('\nNota: favicon.svg será usado directamente (soporte nativo en navegadores modernos)');
