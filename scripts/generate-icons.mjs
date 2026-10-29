// Generates the extension icons (extension/icons/icon-*.png) from the Taboard
// brand mark (see docs/favicon.svg): mint rounded square with four violet tiles.
// Zero dependencies: rasterizes rounded rects with supersampling and writes PNG via zlib.
// Usage: node scripts/generate-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const MINT = [0xa8, 0xf0, 0xc6];
const VIOLET = [0x56, 0x3e, 0xd4];
const SAMPLES = 8;

// Layout in the 30-unit grid of docs/favicon.svg.
const BRAND = {
  unit: 30,
  bg: { x: 0, y: 0, w: 30, h: 30, r: 8 },
  tiles: [
    { x: 5, y: 5, w: 8.5, h: 8.5, r: 2 },
    { x: 16.5, y: 5, w: 8.5, h: 8.5, r: 2 },
    { x: 5, y: 16.5, w: 8.5, h: 8.5, r: 2 },
    { x: 16.5, y: 16.5, w: 8.5, h: 8.5, r: 2 }
  ]
};

// 16px is hand-snapped to whole pixels so the four tiles stay crisp and separated.
const BRAND_16 = {
  unit: 16,
  bg: { x: 0, y: 0, w: 16, h: 16, r: 4 },
  tiles: [
    { x: 3, y: 3, w: 4, h: 4, r: 1 },
    { x: 9, y: 3, w: 4, h: 4, r: 1 },
    { x: 3, y: 9, w: 4, h: 4, r: 1 },
    { x: 9, y: 9, w: 4, h: 4, r: 1 }
  ]
};

// Chrome recommends 96x96 artwork with 16px transparent padding for the 128px icon.
const ICONS = [
  { size: 16, layout: BRAND_16, inset: 0 },
  { size: 32, layout: BRAND, inset: 0 },
  { size: 48, layout: BRAND, inset: 0 },
  { size: 128, layout: BRAND, inset: 16 }
];

function inRoundRect(px, py, { x, y, w, h, r }) {
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function render({ size, layout, inset }) {
  const scale = (size - inset * 2) / layout.unit;
  const pixels = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgHits = 0;
      let tileHits = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const ux = (px + (sx + 0.5) / SAMPLES - inset) / scale;
          const uy = (py + (sy + 0.5) / SAMPLES - inset) / scale;
          if (!inRoundRect(ux, uy, layout.bg)) continue;
          bgHits++;
          if (layout.tiles.some((tile) => inRoundRect(ux, uy, tile))) tileHits++;
        }
      }
      const offset = (py * size + px) * 4;
      if (bgHits === 0) continue;
      const t = tileHits / bgHits;
      for (let c = 0; c < 3; c++) {
        pixels[offset + c] = Math.round(MINT[c] * (1 - t) + VIOLET[c] * t);
      }
      pixels[offset + 3] = Math.round((bgHits / (SAMPLES * SAMPLES)) * 255);
    }
  }
  return encodePng(size, size, pixels);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "../extension/icons");
mkdirSync(outDir, { recursive: true });
for (const icon of ICONS) {
  const file = resolve(outDir, `icon-${icon.size}.png`);
  writeFileSync(file, render(icon));
  console.log(`wrote ${file}`);
}
