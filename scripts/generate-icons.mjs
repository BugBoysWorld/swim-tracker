// Generate PWA icon PNGs from icon.svg
// Run: node scripts/generate-icons.mjs

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/icons/icon.svg');
const svg = readFileSync(svgPath, 'utf8');

// Standard sizes
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512]]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  writeFileSync(resolve(__dirname, '../public/icons', name), png);
  console.log(`✓ ${name} (${size}×${size})`);
}

// Maskable: scale inner icon to 80% and centre within solid background (safe-zone compliant)
const innerContent = svg
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')
  .replace(/<rect[^/]* fill="#0077B6"[^/]*\/>/, ''); // remove bg rect — we redraw it

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0077B6"/>
  <g transform="translate(51.2,51.2) scale(0.8)">
    ${innerContent}
  </g>
</svg>`;

const resvgM = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: 512 } });
writeFileSync(resolve(__dirname, '../public/icons/icon-512-maskable.png'), resvgM.render().asPng());
console.log('✓ icon-512-maskable.png (512×512, safe-zone padded)');
