#!/usr/bin/env node
/**
 * generate-assets.js
 *
 * Generates release-sized PNG assets for the Expo mobile app without any
 * external image tooling. The artwork is intentionally simple and vector-like
 * so it stays crisp across app stores, launch screens, and notifications.
 *
 * Usage: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const COLORS = {
  navy: [26, 35, 126, 255],
  blue: [41, 98, 255, 255],
  cyan: [0, 188, 212, 255],
  white: [255, 255, 255, 255],
  clear: [0, 0, 0, 0],
};

/**
 * Build a PNG file buffer from a raw RGBA pixel buffer.
 */
function buildPng(width, height, rgba) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // --- IHDR chunk: 8-bit RGBA ---
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;               // bit depth
  ihdrData[9] = 6;               // color type: RGBA
  ihdrData[10] = 0;              // compression
  ihdrData[11] = 0;              // filter
  ihdrData[12] = 0;              // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // --- IDAT chunk: each row starts with filter byte 0 + RGBA pixels ---
  const rowLength = width * 4;
  const raw = Buffer.alloc((rowLength + 1) * height);
  for (let y = 0; y < height; y++) {
    const srcStart = y * rowLength;
    const destStart = y * (rowLength + 1);
    raw[destStart] = 0;
    rgba.copy(raw, destStart + 1, srcStart, srcStart + rowLength);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = makeChunk('IDAT', compressed);

  // --- IEND chunk ---
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createCanvas(width, height, color) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { width, height, data };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return;
  }
  const index = (y * canvas.width + x) * 4;
  canvas.data[index] = color[0];
  canvas.data[index + 1] = color[1];
  canvas.data[index + 2] = color[2];
  canvas.data[index + 3] = color[3];
}

function drawRect(canvas, x, y, width, height, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(canvas.width, Math.ceil(x + width));
  const y1 = Math.min(canvas.height, Math.ceil(y + height));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      setPixel(canvas, xx, yy, color);
    }
  }
}

function drawCircle(canvas, cx, cy, radius, color) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(canvas.width - 1, Math.ceil(cx + radius));
  const y1 = Math.min(canvas.height - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(canvas, x, y, color);
      }
    }
  }
}

function drawRoundedRect(canvas, x, y, width, height, radius, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(canvas.width - 1, Math.ceil(x + width));
  const y1 = Math.min(canvas.height - 1, Math.ceil(y + height));
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const left = xx < x + radius;
      const right = xx > x + width - radius;
      const top = yy < y + radius;
      const bottom = yy > y + height - radius;
      if ((left || right) && (top || bottom)) {
        const cx = left ? x + radius : x + width - radius;
        const cy = top ? y + radius : y + height - radius;
        const dx = xx - cx;
        const dy = yy - cy;
        if (dx * dx + dy * dy > radius * radius) {
          continue;
        }
      }
      setPixel(canvas, xx, yy, color);
    }
  }
}

function drawGroupMark(canvas, cx, cy, scale, color) {
  drawCircle(canvas, cx, cy - scale * 0.22, scale * 0.14, color);
  drawCircle(canvas, cx - scale * 0.22, cy - scale * 0.12, scale * 0.105, color);
  drawCircle(canvas, cx + scale * 0.22, cy - scale * 0.12, scale * 0.105, color);
  drawRoundedRect(canvas, cx - scale * 0.32, cy + scale * 0.02, scale * 0.64, scale * 0.18, scale * 0.09, color);
  drawRoundedRect(canvas, cx - scale * 0.44, cy + scale * 0.12, scale * 0.22, scale * 0.14, scale * 0.07, color);
  drawRoundedRect(canvas, cx + scale * 0.22, cy + scale * 0.12, scale * 0.22, scale * 0.14, scale * 0.07, color);
}

function drawBrandOrb(canvas, cx, cy, radius) {
  drawCircle(canvas, cx, cy, radius, COLORS.blue);
  drawCircle(canvas, cx - radius * 0.38, cy - radius * 0.38, radius * 0.2, COLORS.cyan);
  drawGroupMark(canvas, cx, cy + radius * 0.04, radius * 0.92, COLORS.white);
}

function makeIcon() {
  const canvas = createCanvas(1024, 1024, COLORS.navy);
  drawBrandOrb(canvas, 512, 512, 382);
  return canvas;
}

function makeAdaptiveIcon() {
  const canvas = createCanvas(1024, 1024, COLORS.clear);
  drawBrandOrb(canvas, 512, 512, 318);
  return canvas;
}

function makeFavicon() {
  const canvas = createCanvas(48, 48, COLORS.navy);
  drawBrandOrb(canvas, 24, 24, 18);
  return canvas;
}

function makeNotificationIcon() {
  const canvas = createCanvas(96, 96, COLORS.clear);
  drawCircle(canvas, 48, 48, 34, COLORS.white);
  drawGroupMark(canvas, 48, 51, 58, COLORS.navy);
  return canvas;
}

function makeSplash() {
  const canvas = createCanvas(1284, 2778, COLORS.navy);
  drawBrandOrb(canvas, 642, 1220, 248);
  drawRoundedRect(canvas, 430, 1580, 424, 48, 24, COLORS.white);
  drawRoundedRect(canvas, 490, 1660, 304, 26, 13, COLORS.cyan);
  return canvas;
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

const assets = [
  { name: 'icon.png', make: makeIcon, desc: '1024x1024 app icon' },
  { name: 'splash.png', make: makeSplash, desc: '1284x2778 splash screen' },
  { name: 'adaptive-icon.png', make: makeAdaptiveIcon, desc: '1024x1024 Android adaptive icon foreground' },
  { name: 'favicon.png', make: makeFavicon, desc: '48x48 web favicon' },
  { name: 'notification-icon.png', make: makeNotificationIcon, desc: '96x96 notification icon' },
];

// Ensure output directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

console.log('Generating release-sized PNG assets...\n');

for (const asset of assets) {
  const canvas = asset.make();
  const png = buildPng(canvas.width, canvas.height, canvas.data);
  const outPath = path.join(ASSETS_DIR, asset.name);
  fs.writeFileSync(outPath, png);
  console.log(`  Created ${asset.name} (${canvas.width}x${canvas.height}, ${png.length} bytes) - ${asset.desc}`);
}

console.log(`\nAll ${assets.length} assets written to ${ASSETS_DIR}`);
