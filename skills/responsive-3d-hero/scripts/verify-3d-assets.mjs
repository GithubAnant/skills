#!/usr/bin/env node
/**
 * Verify 3D asset manifest URLs resolve on disk and files are content-hashed.
 *
 * Usage:
 *   node scripts/verify-3d-assets.mjs <path-to-asset-manifest.ts> [public-dir]
 *
 * Example (from project root):
 *   node path/to/skill/scripts/verify-3d-assets.mjs src/lib/3d-config/asset-manifest.ts public
 *
 * Scans exported object literals for "/3d/..." strings. Works with asset-manifest.ts
 * that exports ASSETS_BASE and INSPECTABLES_META (or any TS file containing /3d/ URLs).
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"

const manifestPath = process.argv[2]
const publicDir = resolve(process.argv[3] ?? "public")

if (!manifestPath) {
  console.error(
    "Usage: node verify-3d-assets.mjs <asset-manifest.ts> [public-dir]"
  )
  process.exit(1)
}

const source = readFileSync(manifestPath, "utf8")
const urlRegex = /"(\/3d\/[^"]+)"/g
const urls = []
let match
while ((match = urlRegex.exec(source)) !== null) {
  urls.push(match[1])
}

const seen = new Set()
const missing = []
let totalBytes = 0

for (const url of urls) {
  if (seen.has(url)) continue
  seen.add(url)
  const diskPath = join(publicDir, url)
  try {
    totalBytes += statSync(diskPath).size
  } catch {
    missing.push(url)
  }
}

console.log(`Manifest file: ${manifestPath}`)
console.log(`Public dir:    ${publicDir}`)
console.log(
  `References: ${urls.length} (${seen.size} unique), ${(totalBytes / 1024 / 1024).toFixed(2)} MB`
)

if (missing.length > 0) {
  console.error(`\n✗ ${missing.length} missing:`)
  for (const url of missing) console.error(`  - ${join(publicDir, url)}`)
  process.exit(1)
}

const HASH_SUFFIX = /-[a-f0-9]{8}\.[a-z0-9]+$/i
const unhashed = []
for (const url of seen) {
  const basename = url.split("/").pop() ?? ""
  if (!HASH_SUFFIX.test(basename)) unhashed.push(url)
}

if (unhashed.length > 0) {
  console.error(`\n✗ ${unhashed.length} not content-hashed:`)
  for (const url of unhashed) console.error(`  - ${url}`)
  console.error("Rename with hash suffix before deploying with immutable cache.")
  process.exit(1)
}

// Orphan scan under public/3d/
const threeDDir = join(publicDir, "3d")
const referenced = new Set([...seen].map((u) => join(publicDir, u)))
const onDisk = []

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else onDisk.push(full)
  }
}

try {
  walk(threeDDir)
  const orphans = onDisk.filter((f) => !referenced.has(f))
  if (orphans.length > 0) {
    console.warn(`\n⚠ ${orphans.length} orphan files (on disk, not in manifest):`)
    for (const f of orphans.slice(0, 20)) console.warn(`  - ${f}`)
    if (orphans.length > 20) console.warn(`  ... and ${orphans.length - 20} more`)
  }
} catch {
  console.warn(`\n⚠ No ${threeDDir} directory — skipped orphan scan`)
}

console.log("\n✓ All manifest /3d/ URLs resolve and are content-hashed.")
