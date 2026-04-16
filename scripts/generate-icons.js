// Generate PWA icon PNGs from icon.svg
// Run: node scripts/generate-icons.js

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/icons/icon.svg');
const svg = readFileSync(svgPath, 'utf8');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

for (const { name, size } of sizes) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const outPath = resolve(__dirname, '../public/icons', name);
  writeFileSync(outPath, png);
  console.log(`✓ Generated ${name} (${size}×${size})`);
}

// Maskable icon — same SVG with extra padding (safe zone = inner 80%)
// We scale the icon to 80% and center it on the background color
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0077B6"/>
  <g transform="translate(51.2,51.2) scale(0.8)">
${svg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
</svg>`;

const resvgMaskable = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: 512 } });
const maskablePng = resvgMaskable.render().asPng();
writeFileSync(resolve(__dirname, '../public/icons/icon-512-maskable.png'), maskablePng);
console.log('✓ Generated icon-512-maskable.png (512×512, safe-zone padded)');
