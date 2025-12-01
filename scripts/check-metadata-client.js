#!/usr/bin/env node
/* Simple check: fail if a single file contains both "use client" and metadata export */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "app");

const offenders = [];

/** Recursively walk a directory and return .tsx files */
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      files = files.concat(walk(p));
    } else if (e.isFile() && p.endsWith(".tsx")) {
      files.push(p);
    }
  }
  return files;
}

const files = walk(APP_DIR);
const metaRegex = /(export\s+const\s+metadata\b|export\s+async\s+function\s+generateMetadata\b)/;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  // normalize to avoid false positives in comments? Keep simple: direct includes
  const hasUseClient = /(^|\n)\s*["']use client["'];?/.test(src);
  const hasMetadata = metaRegex.test(src);

  if (hasUseClient && hasMetadata) {
    offenders.push(path.relative(ROOT, file));
  }
}

if (offenders.length) {
  console.error("Metadata exports found in Client Components (use client):");
  for (const f of offenders) console.error(" - " + f);
  process.exit(1);
} else {
  console.log("OK: No files export metadata in Client Components.");
}
