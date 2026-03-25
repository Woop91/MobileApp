#!/usr/bin/env node
/**
 * generate-assets.js
 *
 * Generates minimal valid PNG placeholder files for the Expo mobile app.
 * These are true 1x1 pixel PNGs (smallest valid PNG possible) meant to be
 * replaced with real artwork before release.
 *
 * A valid PNG consists of:
 *   - 8-byte signature
 *   - IHDR chunk (image header)
 *   - IDAT chunk (compressed image data)
 *   - IEND chunk (image end)
 *
 * Usage: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

/**
 * Build a minimal valid PNG file buffer.
 * Creates a 1x1 pixel PNG with the given RGBA color.
 */
function buildPng(r, g, b, a) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // --- IHDR chunk: 1x1, 8-bit RGBA ---
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);  // width
  ihdrData.writeUInt32BE(1, 4);  // height
  ihdrData[8] = 8;               // bit depth
  ihdrData[9] = 6;               // color type: RGBA
  ihdrData[10] = 0;              // compression
  ihdrData[11] = 0;              // filter
  ihdrData[12] = 0;              // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // --- IDAT chunk: one row, filter byte 0 + RGBA pixel ---
  const rawRow = Buffer.from([0, r, g, b, a]);
  const compressed = zlib.deflateSync(rawRow);
  const idat = makeChunk('IDAT', compressed);

  // --- IEND chunk ---
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Construct a PNG chunk: length(4) + type(4) + data + crc(4)
 */
function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcInput);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * CRC-32 as required by the PNG specification.
 */
function crc32(buf) {
  // Build table once
  if (!crc32.table) {
    crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crc32.table[n] = c;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crc32.table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// --- Assets to generate ---
// All are 1x1 placeholders; the comment notes the target dimensions for real art.
const assets = [
  { name: 'icon.png',              r: 42,  g: 100, b: 246, a: 255, desc: '1024x1024 app icon' },
  { name: 'splash.png',            r: 255, g: 255, b: 255, a: 255, desc: '1284x2778 splash screen' },
  { name: 'adaptive-icon.png',     r: 42,  g: 100, b: 246, a: 255, desc: '1024x1024 Android adaptive icon' },
  { name: 'favicon.png',           r: 42,  g: 100, b: 246, a: 255, desc: '48x48 web favicon' },
  { name: 'notification-icon.png', r: 255, g: 255, b: 255, a: 255, desc: '96x96 notification icon' },
];

// Ensure output directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

console.log('Generating placeholder PNG assets...\n');

for (const asset of assets) {
  const png = buildPng(asset.r, asset.g, asset.b, asset.a);
  const outPath = path.join(ASSETS_DIR, asset.name);
  fs.writeFileSync(outPath, png);
  console.log(`  Created ${asset.name} (${png.length} bytes) — placeholder for ${asset.desc}`);
}

console.log(`\nAll ${assets.length} assets written to ${ASSETS_DIR}`);
console.log('These are 1x1 pixel placeholders. Replace with real artwork before release.');
