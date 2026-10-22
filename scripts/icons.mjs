// Renders the favicon set from public/favicon.svg into public/: favicon.ico (16 and 32 px),
// apple-touch-icon.png (180 px, on the icon's background: iOS does not do transparency) and
// icon-192.png / icon-512.png for the web manifest (src/pages/site.webmanifest.ts).
// Run `npm run icons` after changing the SVG; the outputs are committed.

import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg');
const BACKGROUND = '#050507';

const png = (size, flatten = false) => {
  let image = sharp(svg, { density: 72 * (size / 32) * 2 }).resize(size, size);
  if (flatten) image = image.flatten({ background: BACKGROUND });
  return image.png().toBuffer();
};

/** An .ico file holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

writeFileSync(
  'public/favicon.ico',
  ico([
    { size: 16, data: await png(16) },
    { size: 32, data: await png(32) },
  ]),
);
writeFileSync('public/apple-touch-icon.png', await png(180, true));
writeFileSync('public/icon-192.png', await png(192, true));
writeFileSync('public/icon-512.png', await png(512, true));
console.log('Wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png');
