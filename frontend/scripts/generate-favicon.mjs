#!/usr/bin/env node
/**
 * Generate PNG favicons + favicon.ico from public/icons/logo.svg.
 * Google and many crawlers request /favicon.ico — so we output one to avoid the blue default.
 * Run: node scripts/generate-favicon.mjs
 */
import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'icons', 'logo.svg');
const outDir = join(root, 'public', 'icons');
const publicDir = join(root, 'public');

const sizes = [32, 16, 512]; // 512 for og:image / social sharing

async function main() {
  const svg = await readFile(svgPath);
  let png16Buffer;
  let png32Buffer;

  for (const size of sizes) {
    // Flatten to opaque (no alpha) so ICO and crawlers render correctly
    const buf = await sharp(svg)
      .resize(size, size)
      .flatten({ background: { r: 14, g: 14, b: 14 } }) // #0E0E0E from logo
      .png()
      .toBuffer();
    const outPath = join(outDir, `favicon-${size}x${size}.png`);
    await writeFile(outPath, buf);
    console.log('Wrote', outPath);
    if (size === 16) png16Buffer = buf;
    if (size === 32) png32Buffer = buf;
  }

  // favicon.ico at site root — Google/crawlers request this; include 16+32 for compatibility
  if (png16Buffer && png32Buffer) {
    const icoBuffer = await toIco([png16Buffer, png32Buffer]);
    const faviconIcoPath = join(publicDir, 'favicon.ico');
    await writeFile(faviconIcoPath, icoBuffer);
    console.log('Wrote', faviconIcoPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
