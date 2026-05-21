#!/usr/bin/env node
/**
 * Paint over the small ink smudge on the owl's paper in the original v1
 * artwork so all derived icons start from a clean source.
 *
 * The smudge sits inside the paper at roughly (610, 567) in the 1024x1024
 * source PNG. Inspection revealed it is actually a small cluster of fully
 * transparent pixels (alpha = 0) punched through the paper artwork — so when
 * the icon is composited over a dark background, the background shows through
 * those holes and reads as an ink smudge. We patch both the RGB and the alpha
 * channel: sample a clean paper patch immediately above the smudge, fill the
 * smudge rectangle with that color, and force every pixel in the patch to be
 * fully opaque.
 */
import { Buffer } from "node:buffer";
import { copyFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const WEB_SOURCE = join(REPO_ROOT, "apps/web/public/casespace-owl.png");
const DESKTOP_COPY = join(REPO_ROOT, "apps/desktop/public/casespace-owl.png");

// Bounding box around the smudge hole. Widened slightly to cover the soft
// halo of partial-alpha pixels surrounding the fully-transparent core.
const SMUDGE = { x0: 590, y0: 555, x1: 624, y1: 580 };
// A clean patch of paper directly below the smudge to sample.
const SAMPLE = { x0: 540, y0: 585, x1: 620, y1: 605 };

const { data, info } = await sharp(WEB_SOURCE)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const buf = Buffer.from(data);

function idx(x, y) {
  return (y * W + x) * 4;
}

let sR = 0;
let sG = 0;
let sB = 0;
let sN = 0;
for (let y = SAMPLE.y0; y < SAMPLE.y1; y += 1) {
  for (let x = SAMPLE.x0; x < SAMPLE.x1; x += 1) {
    const p = idx(x, y);
    sR += buf[p];
    sG += buf[p + 1];
    sB += buf[p + 2];
    sN += 1;
  }
}
const paper = {
  r: Math.round(sR / sN),
  g: Math.round(sG / sN),
  b: Math.round(sB / sN),
};
console.log(`Sampled paper color: rgb(${paper.r}, ${paper.g}, ${paper.b})`);

let alphaFixed = 0;
let rgbFixed = 0;
const w = SMUDGE.x1 - SMUDGE.x0;
const h = SMUDGE.y1 - SMUDGE.y0;
for (let y = SMUDGE.y0; y < SMUDGE.y1; y += 1) {
  for (let x = SMUDGE.x0; x < SMUDGE.x1; x += 1) {
    const p = idx(x, y);
    const a = buf[p + 3];
    const luma = 0.2126 * buf[p] + 0.7152 * buf[p + 1] + 0.0722 * buf[p + 2];

    // Skip pixels that are already clean paper (high alpha + bright color).
    if (a === 255 && luma >= 220) continue;

    // Anything inside the patch that is darker than paper or partially
    // transparent is treated as smudge: paint with paper color and force
    // alpha back to fully opaque.
    buf[p] = paper.r;
    buf[p + 1] = paper.g;
    buf[p + 2] = paper.b;
    buf[p + 3] = 255;
    if (a < 255) alphaFixed += 1;
    if (luma < 220) rgbFixed += 1;
  }
}
console.log(
  `Patched ${w}x${h} smudge area: ${alphaFixed} transparent pixels restored, ${rgbFixed} dark pixels repainted.`,
);

await sharp(buf, { raw: { width: W, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(WEB_SOURCE);
copyFileSync(WEB_SOURCE, DESKTOP_COPY);

console.log(`Cleaned ${relative(REPO_ROOT, WEB_SOURCE)}`);
console.log(`Copied to ${relative(REPO_ROOT, DESKTOP_COPY)}`);
