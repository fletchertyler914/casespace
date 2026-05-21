#!/usr/bin/env node
/**
 * Regenerate the CaseSpace icon set with a brand background baked in.
 *
 * Usage:
 *   node scripts/generate-brand-icons.mjs               # uses default brand blue
 *   node scripts/generate-brand-icons.mjs --color "#0099F0"
 *   node scripts/generate-brand-icons.mjs --color "oklch(0.65 0.18 240)" --preview
 *
 * Flags:
 *   --color <css>   CSS color (hex, rgb(), oklch(), etc.). Defaults to
 *                   the v1 light-theme primary: oklch(0.50 0.15 240).
 *   --preview       Write a single 1024x1024 preview to scripts/.preview-icon.png
 *                   without touching app/web assets.
 *   --padding <n>   Padding ratio (default 0.10). Lower = bigger owl.
 *   --radius <n>    Corner radius ratio (default 0.22). 0 = sharp square.
 */
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { converter, formatHex, parse } from "culori";
import sharp from "sharp";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const SOURCE_OWL = join(REPO_ROOT, "apps/web/public/casespace-owl.png");
const TAURI_ICONS = join(REPO_ROOT, "apps/desktop-backend/src-tauri/icons");
const WEB_PUBLIC = join(REPO_ROOT, "apps/web/public");
const DESKTOP_PUBLIC = join(REPO_ROOT, "apps/desktop/public");
const WEB_APP = join(REPO_ROOT, "apps/web/app");
const DESKTOP_APP = join(REPO_ROOT, "apps/desktop/app");

const DEFAULT_BRAND_COLOR = "oklch(0.50 0.15 240)";

const args = parseArgs(process.argv.slice(2));
const color = args.color ?? DEFAULT_BRAND_COLOR;
const padding = args.padding ?? 0.1;
const cornerRatio = args.radius ?? 0.22;

const bg = toRgb255(color);
console.log(`Brand background: ${color} -> #${toHex(bg)} rgb(${bg.r}, ${bg.g}, ${bg.b})`);

const trimmed = await prepareOwl(SOURCE_OWL);
const trimmedMeta = await sharp(trimmed).metadata();
console.log(`Owl trimmed to ${trimmedMeta.width}x${trimmedMeta.height}`);

async function prepareOwl(path) {
  // The v1 source PNG already carries correct alpha (transparent background,
  // opaque owl). Just crop to the visible bounding box so we can scale it
  // without preserving the original whitespace.
  return sharp(path)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

if (args.preview) {
  const preview = await composeIcon(trimmed, 1024);
  const out = join(REPO_ROOT, "scripts/.preview-icon.png");
  await sharp(preview).png().toFile(out);
  console.log(`Preview written to ${relative(REPO_ROOT, out)}`);
  process.exit(0);
}

await renderAll(trimmed);
console.log("Done.");

async function renderAll(owl) {
  const tauriPng = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "icon.png": 1024,
  };
  const windowsLogos = {
    "Square30x30Logo.png": 30,
    "Square44x44Logo.png": 44,
    "Square71x71Logo.png": 71,
    "Square89x89Logo.png": 89,
    "Square107x107Logo.png": 107,
    "Square142x142Logo.png": 142,
    "Square150x150Logo.png": 150,
    "Square284x284Logo.png": 284,
    "Square310x310Logo.png": 310,
    "StoreLogo.png": 50,
  };

  console.log("\nTauri PNGs:");
  for (const [name, size] of Object.entries(tauriPng)) {
    await renderPng(owl, size, join(TAURI_ICONS, name));
  }

  console.log("\nWindows Store logos:");
  for (const [name, size] of Object.entries(windowsLogos)) {
    await renderPng(owl, size, join(TAURI_ICONS, name));
  }

  console.log("\nWindows .ico:");
  await buildIco(owl, join(TAURI_ICONS, "icon.ico"));

  console.log("\nmacOS .icns:");
  await buildIcns(owl, join(TAURI_ICONS, "icon.icns"));

  console.log("\nWeb + desktop public icons:");
  await renderPng(owl, 512, join(WEB_PUBLIC, "casespace-owl-icon.png"));
  await renderPng(owl, 512, join(DESKTOP_PUBLIC, "casespace-owl-icon.png"));
  await renderPng(owl, 256, join(WEB_PUBLIC, "apple-touch-icon.png"));
  await renderPng(owl, 256, join(DESKTOP_PUBLIC, "apple-touch-icon.png"));

  console.log("\nFavicons:");
  await buildIco(owl, join(WEB_APP, "favicon.ico"));
  await buildIco(owl, join(DESKTOP_APP, "favicon.ico"));
}

async function renderPng(owl, size, target) {
  const png = await composeIcon(owl, size, cornerRatio);
  mkdirSync(dirname(target), { recursive: true });
  await sharp(png).png({ compressionLevel: 9 }).toFile(target);
  console.log(`  wrote ${relative(REPO_ROOT, target)}`);
}

async function composeIcon(owl, size, radiusRatio = cornerRatio) {
  const inner = Math.max(8, Math.round(size * (1 - 2 * padding)));
  const resizedOwl = await sharp(owl)
    .resize({ width: inner, height: inner, fit: "inside", withoutEnlargement: false })
    .toBuffer();
  const owlMeta = await sharp(resizedOwl).metadata();

  const radius = Math.round(size * radiusRatio);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"
          fill="rgb(${bg.r},${bg.g},${bg.b})" />
  </svg>`;

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: Buffer.from(svg) },
      {
        input: resizedOwl,
        left: Math.round((size - owlMeta.width) / 2),
        top: Math.round((size - owlMeta.height) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function buildIco(owl, target) {
  const sizes = [16, 32, 48, 64, 128, 256];
  const frames = await Promise.all(
    sizes.map(async (size) => ({ size, buffer: await composeIcon(owl, size) })),
  );
  const ico = encodeIco(frames);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, ico);
  console.log(`  wrote ${relative(REPO_ROOT, target)}`);
}

async function buildIcns(owl, target) {
  if (process.platform !== "darwin") {
    console.log("  skipping .icns (requires macOS iconutil)");
    return;
  }
  const iconset = target.replace(/\.icns$/, ".iconset");
  rmSync(iconset, { recursive: true, force: true });
  mkdirSync(iconset, { recursive: true });
  const layout = [
    [16, "icon_16x16.png"],
    [32, "icon_16x16@2x.png"],
    [32, "icon_32x32.png"],
    [64, "icon_32x32@2x.png"],
    [128, "icon_128x128.png"],
    [256, "icon_128x128@2x.png"],
    [256, "icon_256x256.png"],
    [512, "icon_256x256@2x.png"],
    [512, "icon_512x512.png"],
    [1024, "icon_512x512@2x.png"],
  ];
  for (const [size, name] of layout) {
    // Bake the rounded-squircle into every .icns layer — macOS does NOT apply
    // a system mask to app icons, so the shape has to live in the asset.
    const buffer = await composeIcon(owl, size, cornerRatio);
    await sharp(buffer).png().toFile(join(iconset, name));
  }
  execFileSync("iconutil", ["-c", "icns", iconset, "-o", target]);
  rmSync(iconset, { recursive: true, force: true });
  console.log(`  wrote ${relative(REPO_ROOT, target)}`);
}

function encodeIco(frames) {
  // PNG-encoded ICO (supported by Windows Vista+; what GitHub / Tauri / browsers expect).
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  const entrySize = 16;
  const directory = Buffer.alloc(entrySize * frames.length);
  const dataChunks = [];
  let offset = header.length + directory.length;

  frames.forEach(({ size, buffer }, index) => {
    const entry = directory.subarray(index * entrySize, (index + 1) * entrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2);                       // palette
    entry.writeUInt8(0, 3);                       // reserved
    entry.writeUInt16LE(1, 4);                    // color planes
    entry.writeUInt16LE(32, 6);                   // bpp
    entry.writeUInt32LE(buffer.length, 8);        // size
    entry.writeUInt32LE(offset, 12);              // offset
    dataChunks.push(buffer);
    offset += buffer.length;
  });

  return Buffer.concat([header, directory, ...dataChunks]);
}

function toRgb255(css) {
  const parsed = parse(css);
  if (!parsed) throw new Error(`Unable to parse color: ${css}`);
  const rgb = converter("rgb")(parsed);
  return {
    r: clamp255(Math.round(rgb.r * 255)),
    g: clamp255(Math.round(rgb.g * 255)),
    b: clamp255(Math.round(rgb.b * 255)),
  };
}

function toHex(rgb) {
  return formatHex({ mode: "rgb", r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 }).replace("#", "");
}

function clamp255(n) {
  return Math.max(0, Math.min(255, n));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--preview") {
      out.preview = true;
    } else if (flag === "--color") {
      out.color = argv[++i];
    } else if (flag === "--padding") {
      out.padding = Number(argv[++i]);
    } else if (flag === "--radius") {
      out.radius = Number(argv[++i]);
    } else {
      throw new Error(`Unknown argument: ${flag}`);
    }
  }
  return out;
}
